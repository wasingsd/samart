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
    const shopId = req.nextUrl.searchParams.get("shopId");
    if (!shopId) {
      return NextResponse.json({ error: "Missing shopId" }, { status: 400 });
    }

    // Read body as text for signature validation
    const bodyText = await req.text();
    const signature = req.headers.get("x-line-signature") || "";

    // Get shop LINE credentials
    const shopDoc = await getDb().collection("shops").doc(shopId).get();
    if (!shopDoc.exists) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const shop = shopDoc.data();
    const channelSecret = shop?.lineChannelSecret;
    const accessToken = shop?.lineAccessToken;

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

      // Save customer
      if (event.source.userId) {
        const profile = await getLineProfile(event.source.userId, accessToken);
        if (profile) {
          await getDb()
            .collection("shops")
            .doc(shopId)
            .collection("customers")
            .doc(event.source.userId)
            .set(
              {
                lineUserId: event.source.userId,
                displayName: profile.displayName,
                pictureURL: profile.pictureUrl || "",
                segment: "new",
                totalSpent: 0,
                orderCount: 0,
                lastVisitAt: null,
                preferences: [],
                notes: "",
                firstContactAt: new Date(),
                updatedAt: new Date(),
              },
              { merge: true }
            );
        }
      }
      break;

    case "unfollow":
      // Update customer segment
      if (event.source.userId) {
        await getDb()
          .collection("shops")
          .doc(shopId)
          .collection("customers")
          .doc(event.source.userId)
          .update({ segment: "dormant", updatedAt: new Date() })
          .catch(() => {}); // Ignore if doc doesn't exist
      }
      break;
  }
}

/**
 * Handle text message — placeholder for AI Chat Brain (Phase 4)
 * ตอนนี้ reply ด้วย default message ก่อน
 */
async function handleTextMessage(
  userId: string,
  message: string,
  replyToken: string,
  shopId: string,
  accessToken: string
) {
  // TODO Phase 4: AI Chat Brain (Gemini + RAG) จะมาแทนที่ตรงนี้
  // 1. ค้นหา knowledge base ที่เกี่ยวข้อง (RAG)
  // 2. ส่งให้ Gemini สร้างคำตอบ
  // 3. บันทึก conversation log

  // Default reply
  const shopDoc = await getDb().collection("shops").doc(shopId).get();
  const shopName = shopDoc.data()?.name || "ร้านค้า";

  await replyMessage(
    replyToken,
    [
      textMessage(
        `ขอบคุณที่ส่งข้อความมาครับ/ค่ะ ขณะนี้ระบบ AI ของ ${shopName} กำลังเรียนรู้ข้อมูล ทางร้านจะตอบกลับโดยเร็วที่สุดนะครับ/ค่ะ`
      ),
    ],
    accessToken
  );

  // Log conversation
  await getDb()
    .collection("shops")
    .doc(shopId)
    .collection("conversations")
    .add({
      customerLineUserId: userId,
      customerName: "",
      customerMessage: message,
      aiReply: `(default reply — AI ยังไม่พร้อม)`,
      status: "pending",
      createdAt: new Date(),
    });
}
