import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../server";
import { getDb, getAdminAuth } from "@/lib/firebase/admin";
import { ShopCreateSchema, StyleProfileSchema } from "@/types";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Helper: ดึง shopId ของ user
 */
async function getShopIdForUser(uid: string): Promise<string | null> {
  const userDoc = await getDb().collection("users").doc(uid).get();
  return userDoc.data()?.shopId ?? null;
}

/**
 * Helper: ตรวจสอบว่า user มีร้าน (เจ้าของหรือทีมงาน)
 */
async function assertShopAccess(uid: string): Promise<string> {
  const shopId = await getShopIdForUser(uid);
  if (!shopId) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "ไม่พบร้านค้าของคุณ กรุณาสร้างร้านก่อน"
    });
  }
  return shopId;
}

/**
 * Helper: ตรวจสอบว่า user เป็นเจ้าของร้านเท่านั้น (Strict)
 */
async function assertShopOwnerStrict(uid: string): Promise<string> {
  const shopId = await assertShopAccess(uid);
  const shopDoc = await getDb().collection("shops").doc(shopId).get();
  const data = shopDoc.data();
  if (!data) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบข้อมูลร้าน" });

  const isPrimaryOwner = data.ownerId === uid;
  const isCoOwner = data.members && data.members[uid] === "owner";

  if (!isPrimaryOwner && !isCoOwner) {
    throw new TRPCError({ code: "FORBIDDEN", message: "คุณไม่ใช่เจ้าของร้าน ไม่มีสิทธิ์ทำรายการนี้" });
  }
  return shopId;
}

/**
 * Helper: ตรวจสอบว่าเป็นเจ้าของร้าน หรือ ผู้จัดการ
 */
async function assertShopManagerOrOwner(uid: string): Promise<string> {
  const shopId = await assertShopAccess(uid);
  const shopDoc = await getDb().collection("shops").doc(shopId).get();
  const data = shopDoc.data();
  if (!data) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบข้อมูลร้าน" });

  const isPrimaryOwner = data.ownerId === uid;
  const role = data.members ? data.members[uid] : "staff";
  
  if (!isPrimaryOwner && role !== "owner" && role !== "manager") {
    throw new TRPCError({ code: "FORBIDDEN", message: "คุณไม่มีสิทธิ์ผู้จัดการ ในการทำรายการนี้" });
  }
  return shopId;
}

export const shopRouter = router({
  /**
   * สร้างร้านค้าใหม่ (Onboarding)
   */
  create: protectedProcedure
    .input(ShopCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const shopRef = getDb().collection("shops").doc();
      const now = FieldValue.serverTimestamp();

      const shopData = {
        ...input,
        id: shopRef.id,
        ownerId: ctx.user.uid,
        lineConnected: false,
        creditBalance: 100,     // เครดิตฟรีตอนสมัคร
        totalCreditsBought: 100,
        totalCreditsUsed: 0,
        createdAt: now,
        updatedAt: now,
      };

      // Batch: สร้าง shop + อัปเดต user.shopId
      const batch = getDb().batch();
      batch.set(shopRef, shopData);
      batch.update(getDb().collection("users").doc(ctx.user.uid), {
        shopId: shopRef.id,
        updatedAt: now,
      });
      await batch.commit();

      // Auto-build knowledge from onboarding data (fire-and-forget)
      try {
        const { buildFromOnboarding } = await import("@/lib/ai/knowledge-builder");
        buildFromOnboarding(shopRef.id).catch(console.error);
      } catch {
        // Non-critical — don't block shop creation
      }

      return { ...shopData, id: shopRef.id };
    }),

  /**
   * ดึงข้อมูลร้านของ user ปัจจุบัน
   */
  getByOwner: protectedProcedure.query(async ({ ctx }) => {
    const shopId = await getShopIdForUser(ctx.user.uid);
    if (!shopId) return null;

    const shopDoc = await getDb().collection("shops").doc(shopId).get();
    if (!shopDoc.exists) return null;

    return { id: shopDoc.id, ...shopDoc.data() };
  }),

  /**
   * แก้ไขข้อมูลร้าน
   */
  update: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        category: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        logoURL: z.string().optional(),
        businessHours: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const shopId = await assertShopManagerOrOwner(ctx.user.uid);
      await getDb()
        .collection("shops")
        .doc(shopId)
        .update({
          ...input,
          updatedAt: FieldValue.serverTimestamp(),
        });
      return { success: true };
    }),

  /**
   * อัปเดต AI Style Profile
   */
  updateStyle: protectedProcedure
    .input(StyleProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const shopId = await assertShopManagerOrOwner(ctx.user.uid);
      await getDb().collection("shops").doc(shopId).update({
        styleProfile: input,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { success: true };
    }),

  /**
   * เชื่อมต่อ LINE OA
   */
  connectLine: protectedProcedure
    .input(
      z.object({
        lineChannelId: z.string().min(1),
        lineChannelSecret: z.string().min(1),
        lineAccessToken: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const shopId = await assertShopManagerOrOwner(ctx.user.uid);
      await getDb().collection("shops").doc(shopId).update({
        ...input,
        lineConnected: true,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { success: true };
    }),

  // ==========================================
  // Team Management (Role-Based)
  // ==========================================

  /**
   * สร้างบัญชีทีมงานใหม่ (โดย Owner)
   */
  addTeamMember: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
      displayName: z.string().min(1),
      role: z.enum(["owner", "manager", "staff"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const shopId = await assertShopOwnerStrict(ctx.user.uid);
      
      try {
        // 1. ตรวจสอบว่ามีอีเมลนี้ในระบบ Auth หรือไม่
        let userRecord;
        try {
          userRecord = await getAdminAuth().getUserByEmail(input.email);
          // ถ้ามีบัญชีนี้อยู่ในระบบแล้ว ให้แจ้งเตือนว่าใช้งานแล้ว
          throw new TRPCError({
            code: "CONFLICT",
            message: "อีเมลนี้ถูกใช้งานแล้ว",
          });
        } catch (e: any) {
          if (e.code === "auth/user-not-found") {
            // สร้างผู้ใช้ใหม่ใน Firebase Auth
            userRecord = await getAdminAuth().createUser({
              email: input.email,
              password: input.password,
              displayName: input.displayName,
            });
          } else if (e instanceof TRPCError) {
            throw e; // โยน TRPCError ที่ทำไว้ข้างบนออกไป
          } else {
            throw e;
          }
        }

        // 2. เพิ่มข้อมูลลงใน Firestore
        const userDocRef = getDb().collection("users").doc(userRecord.uid);
        const batch = getDb().batch();
        const now = FieldValue.serverTimestamp();

        batch.set(userDocRef, {
          uid: userRecord.uid,
          email: input.email,
          displayName: input.displayName,
          shopId: shopId,
          role: input.role,
          createdAt: now,
          updatedAt: now,
        }, { merge: true });

        batch.update(getDb().collection("shops").doc(shopId), {
          [`members.${userRecord.uid}`]: input.role,
          updatedAt: now,
        });

        await batch.commit();
        return { success: true, uid: userRecord.uid, isNewUser: true };
      } catch (error: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message || "ไม่สามารถสร้างบัญชีได้",
        });
      }
    }),

  /**
   * ดึงรายชื่อทีมงานทั้งหมด
   */
  getTeam: protectedProcedure.query(async ({ ctx }) => {
    const shopId = await getShopIdForUser(ctx.user.uid);
    if (!shopId) return { owner: null, staff: [] };

    const shopDoc = await getDb().collection("shops").doc(shopId).get();
    const data = shopDoc.data();
    if (!data) return { owner: null, staff: [] };

    // Get Owner
    const ownerDoc = await getDb().collection("users").doc(data.ownerId).get();
    const owner = ownerDoc.exists ? { id: ownerDoc.id, ...ownerDoc.data() } : null;

    // Get Staff from `members` map
    const membersMap: Record<string, string> = data.members || {};
    const staffIds = Object.keys(membersMap);
    const staff: any[] = [];
    
    if (staffIds.length > 0) {
      for (let i = 0; i < staffIds.length; i += 10) {
        const chunk = staffIds.slice(i, i + 10);
        const staffQuery = await getDb().collection("users").where("uid", "in", chunk).get();
        staffQuery.forEach(doc => {
          staff.push({ 
            id: doc.id, 
            ...doc.data(), 
            role: membersMap[doc.id] || "staff" 
          });
        });
      }
    }

    return { owner, staff };
  }),

  /**
   * เตะพนักงานออก (เฉพาะเจ้าของ)
   */
  removeTeamMember: protectedProcedure
    .input(z.object({ targetUid: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const shopId = await assertShopOwnerStrict(ctx.user.uid);
      
      const batch = getDb().batch();
      // Remove from shop.members map
      batch.update(getDb().collection("shops").doc(shopId), {
        [`members.${input.targetUid}`]: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      // Clear user.shopId and role
      batch.update(getDb().collection("users").doc(input.targetUid), {
        shopId: null,
        role: "owner",
        updatedAt: FieldValue.serverTimestamp(),
      });
      await batch.commit();

      // Also delete the user from Authentication entirely (Optional but recommended for strict team)
      try {
        await getAdminAuth().deleteUser(input.targetUid);
      } catch(e) {
        console.error("Failed to delete auth user:", e);
      }

      return { success: true };
    }),
});
