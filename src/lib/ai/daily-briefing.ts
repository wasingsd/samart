import { generatePro } from "./gemini";
import { getDb } from "@/lib/firebase/admin";

/**
 * Daily Briefing — สรุปยอดขาย + action items ทุกเช้า
 * ใช้ Gemini Pro วิเคราะห์ข้อมูลเมื่อวาน
 */

interface BriefingMetrics {
  revenue: number;
  orderCount: number;
  newCustomers: number;
  aiChats: number;
  unansweredChats: number;
  topProducts: { name: string; count: number }[];
}

interface DailyBriefingResult {
  summary: string;
  actionItems: string[];
  metrics: BriefingMetrics;
  generatedAt: string;
}

/**
 * Gather yesterday's metrics from Firestore
 */
async function gatherMetrics(shopId: string): Promise<BriefingMetrics> {
  const db = getDb();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Orders
  let revenue = 0;
  let orderCount = 0;
  const productCounts: Record<string, number> = {};

  try {
    const ordersSnap = await db
      .collection("shops").doc(shopId).collection("orders")
      .where("createdAt", ">=", yesterday)
      .where("createdAt", "<", today)
      .get();

    ordersSnap.docs.forEach((doc) => {
      const d = doc.data();
      revenue += d.total || 0;
      orderCount++;
      if (d.items) {
        for (const item of d.items) {
          productCounts[item.name] = (productCounts[item.name] || 0) + (item.quantity || 1);
        }
      }
    });
  } catch { /* no orders yet */ }

  // Conversations
  let aiChats = 0;
  let unansweredChats = 0;

  try {
    const chatsSnap = await db
      .collection("shops").doc(shopId).collection("conversations")
      .where("createdAt", ">=", yesterday)
      .where("createdAt", "<", today)
      .get();

    chatsSnap.docs.forEach((doc) => {
      const d = doc.data();
      aiChats++;
      if (d.status === "pending" || d.status === "error") unansweredChats++;
    });
  } catch { /* no chats yet */ }

  // New customers
  let newCustomers = 0;
  try {
    const custSnap = await db
      .collection("shops").doc(shopId).collection("customers")
      .where("createdAt", ">=", yesterday)
      .where("createdAt", "<", today)
      .get();
    newCustomers = custSnap.size;
  } catch { /* no customers yet */ }

  const topProducts = Object.entries(productCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  return { revenue, orderCount, newCustomers, aiChats, unansweredChats, topProducts };
}

/**
 * Generate daily briefing with Gemini Pro
 */
export async function generateDailyBriefing(shopId: string): Promise<DailyBriefingResult> {
  const metrics = await gatherMetrics(shopId);

  const topProductsStr = metrics.topProducts.length > 0
    ? metrics.topProducts.map((p) => `${p.name}: ${p.count} ชิ้น`).join(", ")
    : "ไม่มีข้อมูล";

  const dataPrompt = `ข้อมูลร้านเมื่อวาน:
- ยอดขาย: ${metrics.revenue.toLocaleString()} บาท (${metrics.orderCount} ออเดอร์)
- ลูกค้าใหม่: ${metrics.newCustomers} คน
- แชท AI: ${metrics.aiChats} ข้อความ (ยังไม่ตอบ: ${metrics.unansweredChats})
- สินค้าขายดี: ${topProductsStr}`;

  let summary: string;
  let actionItems: string[];

  try {
    const result = await generatePro(
      `คุณเป็นผู้ช่วยวิเคราะห์ธุรกิจของร้านค้าไทย
ให้สรุปผลประกอบการเมื่อวานแบบกระชับ (2-3 ประโยค)
แล้วแนะนำ action items 2-3 ข้อที่ทำได้ทันที
ตอบเป็น JSON format: {"summary": "...", "actionItems": ["...", "..."]}
ถ้ายอดเป็น 0 ให้แนะนำ action เพื่อเริ่มต้นขาย`,
      dataPrompt
    );

    // Parse JSON response
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      summary = parsed.summary || "ไม่สามารถสร้างสรุปได้";
      actionItems = parsed.actionItems || [];
    } else {
      summary = result.substring(0, 300);
      actionItems = [];
    }
  } catch {
    summary = `ยอดขายเมื่อวาน ${metrics.revenue.toLocaleString()} บาท จาก ${metrics.orderCount} ออเดอร์ มีลูกค้าใหม่ ${metrics.newCustomers} คน`;
    actionItems = metrics.unansweredChats > 0
      ? [`มีแชทที่ยังไม่ได้ตอบ ${metrics.unansweredChats} ข้อความ ควรตรวจสอบ`]
      : [];
  }

  return {
    summary,
    actionItems,
    metrics,
    generatedAt: new Date().toISOString(),
  };
}
