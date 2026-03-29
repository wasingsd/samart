import { z } from "zod";
import { router, protectedProcedure } from "../server";
import { getDb } from "@/lib/firebase/admin";
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
    throw new Error("ไม่พบร้านค้าของคุณ กรุณาสร้างร้านก่อน");
  }
  return shopId;
}

/**
 * Helper: ตรวจสอบว่า user เป็นเจ้าของร้านเท่านั้น (Strict)
 */
async function assertShopOwnerStrict(uid: string): Promise<string> {
  const shopId = await assertShopAccess(uid);
  const shopDoc = await getDb().collection("shops").doc(shopId).get();
  if (shopDoc.data()?.ownerId !== uid) {
    throw new Error("คุณไม่ใช่เจ้าของร้าน ไม่มีสิทธิ์ทำรายการนี้");
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
      const shopId = await assertShopAccess(ctx.user.uid);
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
      const shopId = await assertShopAccess(ctx.user.uid);
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
      const shopId = await assertShopAccess(ctx.user.uid);
      await getDb().collection("shops").doc(shopId).update({
        ...input,
        lineConnected: true,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { success: true };
    }),

  // ==========================================
  // Team Management (Invite Code)
  // ==========================================

  /**
   * สร้างหรือดึงรหัสเชิญทีมงาน
   */
  generateInviteCode: protectedProcedure.mutation(async ({ ctx }) => {
    const shopId = await assertShopOwnerStrict(ctx.user.uid);
    // Generate 6 chars alphanumeric
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    await getDb().collection("shops").doc(shopId).update({
      inviteCode: code,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { inviteCode: code };
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

    // Get Staff
    const staffIds: string[] = data.staffIds || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const staff: any[] = [];
    if (staffIds.length > 0) {
      // Create user chunks to avoid Firebase limits "in" max 10
      for (let i = 0; i < staffIds.length; i += 10) {
        const chunk = staffIds.slice(i, i + 10);
        const staffQuery = await getDb().collection("users").where("uid", "in", chunk).get();
        staffQuery.forEach(doc => staff.push({ id: doc.id, ...doc.data() }));
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
      // Remove from shop.staffIds
      batch.update(getDb().collection("shops").doc(shopId), {
        staffIds: FieldValue.arrayRemove(input.targetUid),
        updatedAt: FieldValue.serverTimestamp(),
      });
      // Clear user.shopId และเปลี่ยนบทบาทคืน
      batch.update(getDb().collection("users").doc(input.targetUid), {
        shopId: null,
        role: "owner",
        updatedAt: FieldValue.serverTimestamp(),
      });
      await batch.commit();

      return { success: true };
    }),

  /**
   * ลูกทีมใช้โค้ดเพื่อเข้าร่วม
   */
  joinShop: protectedProcedure
    .input(z.object({ inviteCode: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const code = input.inviteCode.toUpperCase();
      const shopsQuery = await getDb()
        .collection("shops")
        .where("inviteCode", "==", code)
        .limit(1)
        .get();

      if (shopsQuery.empty) {
        throw new Error("รหัสเชิญไม่ถูกต้องหรือหมดอายุ");
      }

      const shopDoc = shopsQuery.docs[0];
      const shopId = shopDoc.id;
      
      if (shopDoc.data().ownerId === ctx.user.uid) {
         throw new Error("คุณเป็นเจ้าของร้านนี้อยู่แล้ว");
      }
      
      if (shopDoc.data().staffIds?.includes(ctx.user.uid)) {
         throw new Error("คุณอยู่ในทีมนี้อยู่แล้ว");
      }

      const batch = getDb().batch();
      // Add user to staffIds
      batch.update(shopDoc.ref, {
        staffIds: FieldValue.arrayUnion(ctx.user.uid),
        updatedAt: FieldValue.serverTimestamp(),
      });
      // Update User
      batch.update(getDb().collection("users").doc(ctx.user.uid), {
        shopId: shopId,
        role: "staff",
        updatedAt: FieldValue.serverTimestamp(),
      });

      await batch.commit();
      return { success: true, shopId, shopName: shopDoc.data().name };
    }),
});
