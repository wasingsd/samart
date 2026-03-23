import { z } from "zod";
import { router, protectedProcedure } from "../server";
import { getDb } from "@/lib/firebase/admin";
import { MenuCreateSchema } from "@/types";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Helper: ดึง shopId ของ user
 */
async function getShopId(uid: string): Promise<string> {
  const userDoc = await getDb().collection("users").doc(uid).get();
  const shopId = userDoc.data()?.shopId;
  if (!shopId) throw new Error("ไม่พบร้านค้า กรุณาสร้างร้านก่อน");
  return shopId;
}

export const menuRouter = router({
  /**
   * ดึงเมนูทั้งหมด (filter category)
   */
  list: protectedProcedure
    .input(z.object({ category: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const shopId = await getShopId(ctx.user.uid);
      let query = getDb()
        .collection("shops")
        .doc(shopId)
        .collection("menuItems")
        .orderBy("sortOrder", "asc");

      if (input?.category) {
        query = query.where("category", "==", input.category);
      }

      const snapshot = await query.get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }),

  /**
   * ดึงเมนูตัวเดียว
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const shopId = await getShopId(ctx.user.uid);
      const doc = await getDb()
        .collection("shops")
        .doc(shopId)
        .collection("menuItems")
        .doc(input.id)
        .get();

      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    }),

  /**
   * เพิ่มเมนูใหม่
   */
  create: protectedProcedure
    .input(MenuCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const shopId = await getShopId(ctx.user.uid);
      const ref = getDb()
        .collection("shops")
        .doc(shopId)
        .collection("menuItems")
        .doc();

      const data = {
        ...input,
        id: ref.id,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      await ref.set(data);
      return data;
    }),

  /**
   * แก้ไขเมนู
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: MenuCreateSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const shopId = await getShopId(ctx.user.uid);
      await getDb()
        .collection("shops")
        .doc(shopId)
        .collection("menuItems")
        .doc(input.id)
        .update({
          ...input.data,
          updatedAt: FieldValue.serverTimestamp(),
        });
      return { success: true };
    }),

  /**
   * ลบเมนู
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const shopId = await getShopId(ctx.user.uid);
      await getDb()
        .collection("shops")
        .doc(shopId)
        .collection("menuItems")
        .doc(input.id)
        .delete();
      return { success: true };
    }),

  /**
   * สลับสถานะ inStock
   */
  toggleStock: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const shopId = await getShopId(ctx.user.uid);
      const ref = getDb()
        .collection("shops")
        .doc(shopId)
        .collection("menuItems")
        .doc(input.id);

      const doc = await ref.get();
      if (!doc.exists) throw new Error("ไม่พบเมนูนี้");

      const currentStock = doc.data()?.inStock ?? true;
      await ref.update({
        inStock: !currentStock,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { inStock: !currentStock };
    }),

  /**
   * ดึง categories ทั้งหมด
   */
  listCategories: protectedProcedure.query(async ({ ctx }) => {
    const shopId = await getShopId(ctx.user.uid);
    const snapshot = await getDb()
      .collection("shops")
      .doc(shopId)
      .collection("menuItems")
      .get();

    const categories = new Set<string>();
    snapshot.docs.forEach((doc) => {
      const cat = doc.data()?.category;
      if (cat) categories.add(cat);
    });
    return Array.from(categories).sort();
  }),
});
