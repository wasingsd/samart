import { z } from "zod";
import { router, protectedProcedure } from "../server";
import { getDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export const analyticsRouter = router({
  /**
   * ดึง overview stats ของร้าน (ตาม period)
   */
  overview: protectedProcedure
    .input(
      z.object({
        shopId: z.string(),
        period: z.enum(["1d", "7d", "14d", "30d"]).default("7d"),
      })
    )
    .query(async ({ input }) => {
      const daysMap = { "1d": 1, "7d": 7, "14d": 14, "30d": 30 };
      const days = daysMap[input.period];
      const since = new Date();
      since.setDate(since.getDate() - days);

      const ordersSnap = await getDb()
        .collection("shops")
        .doc(input.shopId)
        .collection("orders")
        .where("createdAt", ">=", since)
        .get();

      let totalRevenue = 0;
      let orderCount = 0;
      const itemSales: Record<string, { name: string; quantity: number; revenue: number }> = {};

      ordersSnap.docs.forEach((doc) => {
        const order = doc.data();
        if (order.status !== "cancelled") {
          totalRevenue += order.totalAmount || 0;
          orderCount++;
          (order.items || []).forEach((item: { menuItemId: string; name: string; quantity: number; price: number }) => {
            if (!itemSales[item.menuItemId]) {
              itemSales[item.menuItemId] = { name: item.name, quantity: 0, revenue: 0 };
            }
            itemSales[item.menuItemId].quantity += item.quantity;
            itemSales[item.menuItemId].revenue += item.price * item.quantity;
          });
        }
      });

      // New customers in period
      const customersSnap = await getDb()
        .collection("shops")
        .doc(input.shopId)
        .collection("customers")
        .where("firstContactAt", ">=", since)
        .get();

      const avgOrderValue = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0;

      // Top products sorted by quantity
      const topProducts = Object.values(itemSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);

      return {
        totalRevenue,
        orderCount,
        avgOrderValue,
        newCustomers: customersSnap.size,
        topProducts,
        period: input.period,
      };
    }),

  /**
   * ดึงยอดขายรายวันสำหรับกราฟ
   */
  dailyBreakdown: protectedProcedure
    .input(
      z.object({
        shopId: z.string(),
        period: z.enum(["7d", "14d", "30d"]).default("7d"),
      })
    )
    .query(async ({ input }) => {
      const daysMap = { "7d": 7, "14d": 14, "30d": 30 };
      const days = daysMap[input.period];
      const since = new Date();
      since.setDate(since.getDate() - days);

      const ordersSnap = await getDb()
        .collection("shops")
        .doc(input.shopId)
        .collection("orders")
        .where("createdAt", ">=", since)
        .get();

      // Group by date
      const dailyMap: Record<string, { revenue: number; orders: number }> = {};

      // Pre-fill all dates with zeros
      for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (days - 1 - i));
        const key = d.toISOString().split("T")[0];
        dailyMap[key] = { revenue: 0, orders: 0 };
      }

      ordersSnap.docs.forEach((doc) => {
        const order = doc.data();
        if (order.status !== "cancelled") {
          const ts = order.createdAt?.toDate?.() || new Date(order.createdAt);
          const key = ts.toISOString().split("T")[0];
          if (!dailyMap[key]) dailyMap[key] = { revenue: 0, orders: 0 };
          dailyMap[key].revenue += order.totalAmount || 0;
          dailyMap[key].orders++;
        }
      });

      return Object.entries(dailyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, data]) => ({
          date,
          label: new Date(date).toLocaleDateString("th-TH", { day: "numeric", month: "short" }),
          revenue: data.revenue,
          orders: data.orders,
        }));
    }),

  /**
   * บันทึกยอดขาย manual
   */
  recordSale: protectedProcedure
    .input(
      z.object({
        shopId: z.string(),
        amount: z.number().positive(),
        note: z.string().optional(),
        date: z.string().optional(), // ISO date
      })
    )
    .mutation(async ({ input }) => {
      const docRef = getDb()
        .collection("shops")
        .doc(input.shopId)
        .collection("orders")
        .doc();

      await docRef.set({
        id: docRef.id,
        customerId: "manual",
        items: [],
        totalAmount: input.amount,
        status: "completed",
        source: "manual",
        notes: input.note || "",
        createdAt: input.date ? new Date(input.date) : FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { id: docRef.id };
    }),
});
