import { z } from "zod";
import { router, protectedProcedure } from "../server";
import { getDb } from "@/lib/firebase/admin";
import {
  getPackagesList,
  getCreditPackage,
  getTotalCredits,
  CREDIT_COSTS,
  CREDIT_ACTION_LABELS,
} from "@/lib/billing/plans";
import {
  getCreditBalance,
  addCredits,
  getMonthlyUsage,
  getTransactionHistory,
} from "@/lib/billing/usage";
import { createCustomer, chargeCard, chargePromptPay, getCharge } from "@/lib/billing/omise";
import { FieldValue } from "firebase-admin/firestore";

export const billingRouter = router({
  /**
   * ดึงยอดเครดิต + usage stats
   */
  getBalance: protectedProcedure
    .input(z.object({ shopId: z.string() }))
    .query(async ({ input }) => {
      const balance = await getCreditBalance(input.shopId);
      const monthlyUsage = await getMonthlyUsage(input.shopId);

      return {
        creditBalance: balance,
        monthlyUsage,
        creditCosts: CREDIT_COSTS,
        creditLabels: CREDIT_ACTION_LABELS,
      };
    }),

  /**
   * ดึงรายการ credit packages
   */
  getPackages: protectedProcedure.query(() => {
    return getPackagesList();
  }),

  /**
   * ซื้อเครดิต — จ่ายผ่านบัตรหรือ PromptPay
   */
  purchaseCredits: protectedProcedure
    .input(
      z.object({
        shopId: z.string(),
        packageId: z.string(),
        paymentMethod: z.enum(["card", "promptpay"]),
        cardToken: z.string().optional(), // ต้องมีถ้า method = card
      })
    )
    .mutation(async ({ input }) => {
      const pkg = getCreditPackage(input.packageId);
      if (!pkg) throw new Error("ไม่พบแพ็กเครดิตนี้");
      if (pkg.price === 0) throw new Error("แพ็กฟรีไม่ต้องชำระเงิน");

      const shopDoc = await getDb().collection("shops").doc(input.shopId).get();
      const shop = shopDoc.data();
      const amountSatang = pkg.price * 100;
      const description = `SAMART Credits: ${pkg.name} (${getTotalCredits(pkg)} เครดิต)`;

      if (input.paymentMethod === "card") {
        // Card payment
        if (!input.cardToken) throw new Error("กรุณาเพิ่มบัตรเครดิต/เดบิต");

        let omiseCustomerId = shop?.billing?.omiseCustomerId;
        if (!omiseCustomerId) {
          const customer = await createCustomer(
            shop?.ownerEmail || "",
            `SAMART: ${shop?.name || input.shopId}`,
            input.cardToken
          );
          omiseCustomerId = customer.id;

          // Save customer ID
          await getDb().collection("shops").doc(input.shopId).update({
            "billing.omiseCustomerId": omiseCustomerId,
          });
        }

        const charge = await chargeCard(amountSatang, omiseCustomerId, description);

        if (charge.status === "successful") {
          const totalCredits = getTotalCredits(pkg);
          await addCredits(input.shopId, totalCredits, "topup", {
            packageId: pkg.id,
            paymentId: charge.id,
          });

          // Log billing history
          await getDb()
            .collection("shops")
            .doc(input.shopId)
            .collection("billingHistory")
            .doc(charge.id)
            .set({
              chargeId: charge.id,
              amount: pkg.price,
              credits: totalCredits,
              packageId: pkg.id,
              method: "card",
              status: "successful",
              paidAt: FieldValue.serverTimestamp(),
            });

          return { success: true, chargeId: charge.id, credits: totalCredits };
        }

        throw new Error("การชำระเงินไม่สำเร็จ กรุณาลองใหม่");
      } else {
        // PromptPay QR
        const result = await chargePromptPay(amountSatang, description);

        // Save pending charge
        await getDb()
          .collection("shops")
          .doc(input.shopId)
          .collection("billingHistory")
          .doc(result.chargeId)
          .set({
            chargeId: result.chargeId,
            amount: pkg.price,
            credits: getTotalCredits(pkg),
            packageId: pkg.id,
            method: "promptpay",
            status: "pending",
            createdAt: FieldValue.serverTimestamp(),
          });

        return {
          success: true,
          chargeId: result.chargeId,
          qrCodeUrl: result.qrCodeUrl,
          expiresAt: result.expiresAt,
          credits: getTotalCredits(pkg),
        };
      }
    }),

  /**
   * เช็คสถานะ PromptPay charge (polling)
   */
  checkChargeStatus: protectedProcedure
    .input(z.object({ shopId: z.string(), chargeId: z.string() }))
    .query(async ({ input }) => {
      const charge = await getCharge(input.chargeId);

      if (charge.paid && charge.status === "successful") {
        // Check if already credited
        const historyDoc = await getDb()
          .collection("shops")
          .doc(input.shopId)
          .collection("billingHistory")
          .doc(input.chargeId)
          .get();

        const history = historyDoc.data();
        if (history && history.status === "pending") {
          // Credit not yet added — add now
          await addCredits(input.shopId, history.credits, "topup", {
            packageId: history.packageId,
            paymentId: input.chargeId,
          });

          await historyDoc.ref.update({
            status: "successful",
            paidAt: FieldValue.serverTimestamp(),
          });
        }

        return { paid: true, status: "successful" };
      }

      return { paid: false, status: charge.status };
    }),

  /**
   * ดึงประวัติธุรกรรม (topup + deduct)
   */
  getTransactions: protectedProcedure
    .input(z.object({ shopId: z.string(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      return getTransactionHistory(input.shopId, input.limit);
    }),

  /**
   * ดึงประวัติการชำระเงิน (เฉพาะ top-up)
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
