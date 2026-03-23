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
 * Helper: ตรวจสอบว่า user เป็นเจ้าของร้าน
 */
async function assertShopOwner(uid: string): Promise<string> {
  const shopId = await getShopIdForUser(uid);
  if (!shopId) {
    throw new Error("ไม่พบร้านค้าของคุณ กรุณาสร้างร้านก่อน");
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
        plan: "trial" as const,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 วัน
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
      const shopId = await assertShopOwner(ctx.user.uid);
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
      const shopId = await assertShopOwner(ctx.user.uid);
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
      const shopId = await assertShopOwner(ctx.user.uid);
      await getDb().collection("shops").doc(shopId).update({
        ...input,
        lineConnected: true,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { success: true };
    }),
});
