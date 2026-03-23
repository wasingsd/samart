import { z } from "zod";
import { router, protectedProcedure } from "../server";
import { getDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export const customerRouter = router({
  /**
   * ดึงรายการลูกค้า (filterable by segment)
   */
  list: protectedProcedure
    .input(
      z.object({
        shopId: z.string(),
        segment: z.enum(["all", "vip", "regular", "new", "dormant"]).default("all"),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      let query = getDb()
        .collection("shops")
        .doc(input.shopId)
        .collection("customers")
        .orderBy("updatedAt", "desc")
        .limit(input.limit);

      if (input.segment !== "all") {
        query = query.where("segment", "==", input.segment);
      }

      const snapshot = await query.get();
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }),

  /**
   * นับจำนวนลูกค้าแยกตาม segment
   */
  segmentCounts: protectedProcedure
    .input(z.object({ shopId: z.string() }))
    .query(async ({ input }) => {
      const snapshot = await getDb()
        .collection("shops")
        .doc(input.shopId)
        .collection("customers")
        .get();

      const counts = { all: 0, vip: 0, regular: 0, new: 0, dormant: 0 };
      snapshot.docs.forEach((doc) => {
        const segment = doc.data().segment as string;
        counts.all++;
        if (segment in counts) {
          counts[segment as keyof typeof counts]++;
        }
      });
      return counts;
    }),

  /**
   * ดึงข้อมูล customer profile (รวม order history)
   */
  getProfile: protectedProcedure
    .input(z.object({ shopId: z.string(), customerId: z.string() }))
    .query(async ({ input }) => {
      const customerDoc = await getDb()
        .collection("shops")
        .doc(input.shopId)
        .collection("customers")
        .doc(input.customerId)
        .get();

      if (!customerDoc.exists) return null;

      // Recent orders
      const ordersSnap = await getDb()
        .collection("shops")
        .doc(input.shopId)
        .collection("orders")
        .where("customerLineUserId", "==", input.customerId)
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();

      // Recent conversations
      const convsSnap = await getDb()
        .collection("shops")
        .doc(input.shopId)
        .collection("conversations")
        .where("customerLineUserId", "==", input.customerId)
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();

      return {
        customer: { id: customerDoc.id, ...customerDoc.data() },
        recentOrders: ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        recentConversations: convsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      };
    }),

  /**
   * อัปเดต customer notes / segment
   */
  update: protectedProcedure
    .input(
      z.object({
        shopId: z.string(),
        customerId: z.string(),
        data: z.object({
          segment: z.enum(["new", "regular", "vip", "dormant"]).optional(),
          notes: z.string().optional(),
          preferences: z.array(z.string()).optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const updateData: Record<string, unknown> = {
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (input.data.segment) updateData.segment = input.data.segment;
      if (input.data.notes !== undefined) updateData.notes = input.data.notes;
      if (input.data.preferences) updateData.preferences = input.data.preferences;

      await getDb()
        .collection("shops")
        .doc(input.shopId)
        .collection("customers")
        .doc(input.customerId)
        .update(updateData);

      return { success: true };
    }),
});
