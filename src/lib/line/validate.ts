import crypto from "crypto";

/**
 * ตรวจสอบ LINE Webhook Signature
 * ใช้ Channel Secret สร้าง HMAC-SHA256 แล้วเทียบกับ x-line-signature header
 */
export function validateLineSignature(
  body: string,
  signature: string,
  channelSecret: string
): boolean {
  const hash = crypto
    .createHmac("SHA256", channelSecret)
    .update(body)
    .digest("base64");
  return hash === signature;
}

/**
 * Parse LINE Webhook Event types
 */
export interface LineWebhookEvent {
  type: "message" | "follow" | "unfollow" | "postback";
  timestamp: number;
  source: {
    type: "user" | "group" | "room";
    userId?: string;
    groupId?: string;
    roomId?: string;
  };
  replyToken?: string;
  message?: {
    id: string;
    type: "text" | "image" | "video" | "audio" | "file" | "location" | "sticker";
    text?: string;
  };
  postback?: {
    data: string;
  };
}

export interface LineWebhookBody {
  destination: string;
  events: LineWebhookEvent[];
}
