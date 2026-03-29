import { NextRequest, NextResponse } from "next/server";
import { validateLineSignature, type LineWebhookBody, type LineWebhookEvent } from "@/lib/line/validate";
import { replyMessage, textMessage } from "@/lib/line/reply";
import { getLineProfile } from "@/lib/line/client";
import { getDb } from "@/lib/firebase/admin";

/**
 * LINE Webhook Endpoint
 * POST /api/webhook/line?shopId=xxx
 *
 * Flow:
 * 1. ตรวจสอบ LINE signature
 * 2. ดึง shop config (accessToken, channelSecret)
 * 3. ประมวลผล event
 * 4. ตอบกลับผ่าน AI (ในอนาคต) หรือ default reply
 */
export async function POST(req: NextRequest) {
  try {
    const shopId = req.nextUrl.searchParams.get("shopId") || "default";

    // Read body as text for signature validation
    const bodyText = await req.text();
    const signature = req.headers.get("x-line-signature") || "";

    // Get LINE credentials: try shop doc first, fallback to env vars
    let channelSecret = process.env.LINE_CHANNEL_SECRET;
    let accessToken = process.env.LINE_ACCESS_TOKEN;

    if (shopId !== "default") {
      try {
        const shopDoc = await getDb().collection("shops").doc(shopId).get();
        if (shopDoc.exists) {
          const shop = shopDoc.data();
          if (shop?.lineChannelSecret) channelSecret = shop.lineChannelSecret;
          if (shop?.lineAccessToken) accessToken = shop.lineAccessToken;
        }
      } catch {
        // Firestore not configured — use env vars
      }
    }

    if (!channelSecret || !accessToken) {
      return NextResponse.json({ error: "LINE not configured" }, { status: 400 });
    }

    // Validate signature
    if (!validateLineSignature(bodyText, signature, channelSecret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    // Parse events
    const body: LineWebhookBody = JSON.parse(bodyText);

    // Process events
    for (const event of body.events) {
      await handleEvent(event, shopId, accessToken);
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("LINE webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * Process individual LINE event
 */
async function handleEvent(
  event: LineWebhookEvent,
  shopId: string,
  accessToken: string
) {
  switch (event.type) {
    case "message":
      if (event.message?.type === "text" && event.replyToken && event.source.userId) {
        await handleTextMessage(
          event.source.userId,
          event.message.text || "",
          event.replyToken,
          shopId,
          accessToken
        );
      }
      break;

    case "follow":
      // New friend — send welcome message
      if (event.replyToken) {
        const shopDoc = await getDb().collection("shops").doc(shopId).get();
        const shopName = shopDoc.data()?.name || "ร้านค้า";
        await replyMessage(
          event.replyToken,
          [textMessage(`สวัสดีครับ/ค่ะ ยินดีต้อนรับสู่ ${shopName} มีอะไรให้ช่วยสอบถามได้เลยนะครับ/ค่ะ`)],
          accessToken
        );
      }

      // Save/update customer via multi-channel upsert
      if (event.source.userId) {
        const profile = await getLineProfile(event.source.userId, accessToken);
        if (profile) {
          const customersRef = getDb()
            .collection("shops")
            .doc(shopId)
            .collection("customers");

          // Search for existing customer with this LINE userId
          const existing = await customersRef
            .where("channels.line.userId", "==", event.source.userId)
            .limit(1)
            .get();

          if (!existing.empty) {
            // Update existing customer
            await existing.docs[0].ref.update({
              "channels.line.displayName": profile.displayName,
              "channels.line.pictureURL": profile.pictureUrl || "",
              "channels.line.lastContactAt": new Date(),
              displayName: profile.displayName,
              pictureURL: profile.pictureUrl || "",
              updatedAt: new Date(),
            });
          } else {
            // Create new customer (auto-ID, no phone yet)
            await customersRef.add({
              phone: "",
              displayName: profile.displayName,
              pictureURL: profile.pictureUrl || "",
              channels: {
                line: {
                  userId: event.source.userId,
                  displayName: profile.displayName,
                  pictureURL: profile.pictureUrl || "",
                  connectedAt: new Date(),
                  lastContactAt: new Date(),
                },
              },
              source: "line",
              segment: "new",
              totalSpent: 0,
              orderCount: 0,
              lastVisitAt: null,
              preferences: [],
              notes: "",
              firstContactAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }
      }
      break;

    case "unfollow":
      // Update customer segment — search by LINE userId
      if (event.source.userId) {
        try {
          const unfollowSnap = await getDb()
            .collection("shops")
            .doc(shopId)
            .collection("customers")
            .where("channels.line.userId", "==", event.source.userId)
            .limit(1)
            .get();
          if (!unfollowSnap.empty) {
            await unfollowSnap.docs[0].ref.update({
              segment: "dormant",
              updatedAt: new Date(),
            });
          }
        } catch {
          // Ignore if doc doesn't exist
        }
      }
      break;
  }
}

/**
 * Handle text message — SAMART AI Chat Brain
 * 1. เช็ค quota
 * 2. เรียก Chat Brain (Gemini + RAG)
 * 3. Reply ผ่าน LINE
 * 4. Log conversation + track usage
 */
async function handleTextMessage(
  userId: string,
  message: string,
  replyToken: string,
  shopId: string,
  accessToken: string
) {
  let aiReply: string;
  let status: string = "pending";
  let customerId: string | undefined;
  let customerName: string | undefined;

  try {
    // 1. Check AI message credit
    const { checkCredits } = await import("@/lib/billing/guard");
    const creditCheck = await checkCredits(shopId, "ai_message");

    if (!creditCheck.allowed) {
      // Credit exceeded — send polite fallback
      aiReply = "ขอบคุณที่ส่งข้อความมาครับ/ค่ะ ขณะนี้ระบบกำลังดำเนินการ ทางร้านจะตอบกลับโดยเร็วที่สุดนะครับ/ค่ะ";
      status = "quota_exceeded";
    } else {
      // 2. Call AI Chat Brain
      const { handleChatMessage } = await import("@/lib/ai/chat-brain");

      // Get customer name if available — search by LINE userId
      let customerSegment: string | undefined;
      try {
        const custSnap = await getDb()
          .collection("shops").doc(shopId)
          .collection("customers")
          .where("channels.line.userId", "==", userId)
          .limit(1)
          .get();
        if (!custSnap.empty) {
          const c = custSnap.docs[0].data();
          customerId = custSnap.docs[0].id;
          customerName = c?.displayName;
          customerSegment = c?.segment;
        }
      } catch {
        // Ignore
      }

      const result = await handleChatMessage({
        shopId,
        customerMessage: message,
        customerName,
        customerSegment,
      });

      aiReply = result.reply;
      status = "ai_replied";

      // 3. Deduct credit
      const { spendCredits } = await import("@/lib/billing/usage");
      await spendCredits(shopId, "ai_message");
    }
  } catch (error) {
    console.error("Chat Brain error:", error);
    aiReply = "ขอบคุณที่ส่งข้อความมาครับ/ค่ะ ขณะนี้ระบบมีปัญหาชั่วคราว ทางร้านจะติดต่อกลับโดยเร็วครับ/ค่ะ";
    status = "error";
  }

  // 4. Reply via LINE
  await replyMessage(replyToken, [textMessage(aiReply)], accessToken);

  // 5. Log conversation
  await getDb()
    .collection("shops")
    .doc(shopId)
    .collection("conversations")
    .add({
      customerId: customerId || userId,
      customerName: customerName || "",
      customerMessage: message,
      aiReply,
      channel: "line",
      status,
      createdAt: new Date(),
    });
}
