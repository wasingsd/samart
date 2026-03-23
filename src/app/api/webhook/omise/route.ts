import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase/admin";

/**
 * Omise Webhook Endpoint
 * POST /api/webhook/omise
 *
 * Events:
 * - charge.complete → อัปเดต payment status
 * - charge.expire → แจ้ง payment failed
 * - schedule.expiring → renew reminder
 */
export async function POST(req: NextRequest) {
  try {
    const event = await req.json();

    // Omise sends event type as "key"
    const eventKey = event.key as string;
    const data = event.data;

    switch (eventKey) {
      case "charge.complete": {
        const chargeId = data?.id;
        const metadata = data?.metadata || {};
        const shopId = metadata.shopId;

        if (shopId && chargeId) {
          // Update shop billing record
          await getDb()
            .collection("shops")
            .doc(shopId)
            .collection("billingHistory")
            .doc(chargeId)
            .set({
              chargeId,
              amount: data.amount / 100, // Convert from satang to THB
              status: data.status,
              paidAt: new Date(),
              planId: metadata.planId || "pro",
            });

          // Extend subscription if charge successful
          if (data.status === "successful") {
            const nextBillingDate = new Date();
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

            await getDb()
              .collection("shops")
              .doc(shopId)
              .update({
                "billing.status": "active",
                "billing.lastPaidAt": new Date(),
                "billing.nextBillingDate": nextBillingDate,
              });
          }
        }
        break;
      }

      case "charge.expire":
      case "charge.reversed": {
        const metadata = data?.metadata || {};
        const shopId = metadata.shopId;

        if (shopId) {
          await getDb()
            .collection("shops")
            .doc(shopId)
            .update({
              "billing.status": "past_due",
              "billing.failedAt": new Date(),
            });
        }
        break;
      }

      default:
        // Log unknown events
        console.log(`Omise webhook: unhandled event ${eventKey}`);
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Omise webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
