import { z } from "zod";
import { router, protectedProcedure } from "../server";
import { getDb } from "@/lib/firebase/admin";
import { PLANS, getPlan, type PlanId } from "@/lib/billing/plans";
import { getAllUsage } from "@/lib/billing/usage";
import { checkQuota } from "@/lib/billing/guard";
import { createCustomer, createCharge, updateCustomerCard } from "@/lib/billing/omise";
import { FieldValue } from "firebase-admin/firestore";

export const billingRouter = router({
  /**
   * ดึง plan ปัจจุบันของร้าน + usage + quota
   */
  getStatus: protectedProcedure
    .input(z.object({ shopId: z.string() }))
    .query(async ({ input }) => {
      const shopDoc = await getDb().collection("shops").doc(input.shopId).get();
      const shop = shopDoc.data();
      const planId = (shop?.plan || "free") as PlanId;
      const plan = getPlan(planId);
      const usage = await getAllUsage(input.shopId);

      // Check each quota
      const aiQuota = await checkQuota(input.shopId, "ai_message");
      const knowledgeQuota = await checkQuota(input.shopId, "knowledge_doc");
      const contentQuota = await checkQuota(input.shopId, "content_generation");

      return {
        plan,
        billing: shop?.billing || { status: "none" },
        usage,
        quotas: {
          aiMessages: aiQuota,
          knowledgeDocs: knowledgeQuota,
          contentGenerations: contentQuota,
        },
      };
    }),

  /**
   * ดึง plans ทั้งหมดเพื่อแสดง pricing
   */
  getPlans: protectedProcedure.query(() => {
    return Object.values(PLANS);
  }),

  /**
   * อัปเกรด/เปลี่ยน plan
   */
  upgradePlan: protectedProcedure
    .input(
      z.object({
        shopId: z.string(),
        planId: z.enum(["free", "pro", "business"]),
        cardToken: z.string().optional(), // Omise token จาก frontend
      })
    )
    .mutation(async ({ input }) => {
      const plan = getPlan(input.planId);

      // Downgrade to free
      if (input.planId === "free") {
        await getDb()
          .collection("shops")
          .doc(input.shopId)
          .update({
            plan: "free",
            "billing.status": "none",
            updatedAt: FieldValue.serverTimestamp(),
          });
        return { success: true, plan: "free" };
      }

      // Paid plan — needs card token
      if (!input.cardToken) {
        throw new Error("กรุณาเพิ่มบัตรเครดิต/เดบิตก่อนอัปเกรด");
      }

      // Get or create Omise customer
      const shopDoc = await getDb().collection("shops").doc(input.shopId).get();
      const shop = shopDoc.data();
      let omiseCustomerId = shop?.billing?.omiseCustomerId;

      if (!omiseCustomerId) {
        const customer = await createCustomer(
          shop?.ownerEmail || "",
          `SAMART Shop: ${shop?.name || input.shopId}`,
          input.cardToken
        );
        omiseCustomerId = customer.id;
      } else {
        await updateCustomerCard(omiseCustomerId, input.cardToken);
      }

      // Create first charge
      const amountSatang = plan.price * 100;
      const charge = await createCharge(
        amountSatang,
        "thb",
        omiseCustomerId,
        `SAMART ${plan.name} - ${shop?.name || "Shop"}`
      );

      // Update shop
      const nextBillingDate = new Date();
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

      await getDb()
        .collection("shops")
        .doc(input.shopId)
        .update({
          plan: input.planId,
          billing: {
            status: charge.status === "successful" ? "active" : "pending",
            omiseCustomerId,
            lastChargeId: charge.id,
            lastPaidAt: charge.status === "successful" ? new Date() : null,
            nextBillingDate,
          },
          updatedAt: FieldValue.serverTimestamp(),
        });

      return { success: true, plan: input.planId, chargeStatus: charge.status };
    }),

  /**
   * ดึงประวัติการชำระเงิน
   */
  getHistory: protectedProcedure
    .input(z.object({ shopId: z.string() }))
    .query(async ({ input }) => {
      const snapshot = await getDb()
        .collection("shops")
        .doc(input.shopId)
        .collection("billingHistory")
        .orderBy("paidAt", "desc")
        .limit(12)
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }),
});
