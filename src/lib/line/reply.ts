/**
 * LINE Reply / Push Message helpers
 */

const LINE_API_BASE = "https://api.line.me/v2/bot";

interface LineTextMessage {
  type: "text";
  text: string;
}

/**
 * ส่งข้อความตอบกลับผ่าน reply token (ใช้ได้ครั้งเดียว ภายใน 30 วินาที)
 */
export async function replyMessage(
  replyToken: string,
  messages: LineTextMessage[],
  accessToken: string
): Promise<boolean> {
  try {
    const res = await fetch(`${LINE_API_BASE}/message/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ replyToken, messages }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * ส่ง push message (ไม่จำกัดเวลา แต่จำกัด quota)
 */
export async function pushMessage(
  to: string,
  messages: LineTextMessage[],
  accessToken: string
): Promise<boolean> {
  try {
    const res = await fetch(`${LINE_API_BASE}/message/push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ to, messages }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Helper สร้าง text message สำหรับ LINE API
 */
export function textMessage(text: string): LineTextMessage {
  return { type: "text", text };
}
