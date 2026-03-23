import { generatePro } from "./gemini";
import { getDb } from "@/lib/firebase/admin";

/**
 * AI Insights — วิเคราะห์ trend, anomaly, แนะนำโปรโมชัน
 * ใช้ Gemini Pro วิเคราะห์ข้อมูลหลายวัน
 */

interface InsightItem {
  type: "trend" | "anomaly" | "recommendation";
  icon: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

interface InsightsResult {
  insights: InsightItem[];
  generatedAt: string;
}

/**
 * Gather multi-day revenue data for analysis
 */
async function gatherRevenueHistory(
  shopId: string,
  days: number = 14
): Promise<{ date: string; revenue: number; orders: number }[]> {
  const db = getDb();
  const results: { date: string; revenue: number; orders: number }[] = [];

  for (let i = 0; i < days; i++) {
    const dayStart = new Date();
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    try {
      const snap = await db
        .collection("shops").doc(shopId).collection("orders")
        .where("createdAt", ">=", dayStart)
        .where("createdAt", "<", dayEnd)
        .get();

      let revenue = 0;
      snap.docs.forEach((doc) => {
        revenue += doc.data().total || 0;
      });

      results.push({
        date: dayStart.toLocaleDateString("th-TH", { day: "numeric", month: "short" }),
        revenue,
        orders: snap.size,
      });
    } catch {
      results.push({ date: "", revenue: 0, orders: 0 });
    }
  }

  return results.reverse();
}

/**
 * Gather customer segment data
 */
async function gatherCustomerSegments(shopId: string): Promise<Record<string, number>> {
  const segments: Record<string, number> = { new: 0, regular: 0, vip: 0, dormant: 0 };

  try {
    const snap = await getDb()
      .collection("shops").doc(shopId).collection("customers").get();

    snap.docs.forEach((doc) => {
      const seg = doc.data().segment || "new";
      segments[seg] = (segments[seg] || 0) + 1;
    });
  } catch { /* ignore */ }

  return segments;
}

/**
 * Generate AI Insights
 */
export async function generateInsights(
  shopId: string,
  period: number = 14
): Promise<InsightsResult> {
  const revenueHistory = await gatherRevenueHistory(shopId, period);
  const segments = await gatherCustomerSegments(shopId);

  const revenueStr = revenueHistory
    .map((d) => `${d.date}: ${d.revenue}฿ (${d.orders} orders)`)
    .join("\n");

  const segmentStr = Object.entries(segments)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  let insights: InsightItem[];

  try {
    const result = await generatePro(
      `คุณเป็นนักวิเคราะห์ธุรกิจ AI สำหรับร้านค้าไทย
วิเคราะห์ข้อมูลแล้วให้ insights เป็น JSON array:
[{"type": "trend|anomaly|recommendation", "icon": "emoji", "title": "หัวข้อสั้น", "description": "อธิบาย 1-2 ประโยค", "priority": "high|medium|low"}]
ให้ 3-5 insights ที่สำคัญที่สุด เน้น actionable
ถ้ายอดเป็น 0 ทั้งหมด ให้แนะนำวิธีเริ่มต้นขาย`,
      `ยอดขาย ${period} วัน:\n${revenueStr}\n\nลูกค้าแบ่งกลุ่ม: ${segmentStr}`
    );

    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      insights = JSON.parse(jsonMatch[0]);
    } else {
      insights = [{
        type: "recommendation",
        icon: "💡",
        title: "เริ่มใช้ระบบ",
        description: "เพิ่มข้อมูลเมนูและ Knowledge Base เพื่อให้ AI ตอบลูกค้าได้ดีขึ้น",
        priority: "high",
      }];
    }
  } catch {
    insights = [{
      type: "recommendation",
      icon: "💡",
      title: "ตั้งค่า GEMINI_API_KEY",
      description: "กรุณาตั้งค่า API key เพื่อเปิดใช้ AI Insights",
      priority: "high",
    }];
  }

  return { insights, generatedAt: new Date().toISOString() };
}

/**
 * Quick anomaly detection (no AI needed)
 */
export async function detectAnomalies(shopId: string): Promise<InsightItem[]> {
  const history = await gatherRevenueHistory(shopId, 14);
  const anomalies: InsightItem[] = [];

  if (history.length < 7) return anomalies;

  // Compare last 7 days avg vs previous 7 days
  const recent = history.slice(-7);
  const previous = history.slice(-14, -7);

  const recentAvg = recent.reduce((s, d) => s + d.revenue, 0) / 7;
  const previousAvg = previous.reduce((s, d) => s + d.revenue, 0) / 7;

  if (previousAvg > 0 && recentAvg < previousAvg * 0.7) {
    anomalies.push({
      type: "anomaly",
      icon: "📉",
      title: "ยอดขายลดลง",
      description: `ยอดขาย 7 วันล่าสุดลดลง ${Math.round((1 - recentAvg / previousAvg) * 100)}% เทียบสัปดาห์ก่อน`,
      priority: "high",
    });
  }

  if (previousAvg > 0 && recentAvg > previousAvg * 1.3) {
    anomalies.push({
      type: "trend",
      icon: "📈",
      title: "ยอดขายเพิ่มขึ้น",
      description: `ยอดขาย 7 วันล่าสุดเพิ่มขึ้น ${Math.round((recentAvg / previousAvg - 1) * 100)}% เทียบสัปดาห์ก่อน`,
      priority: "medium",
    });
  }

  return anomalies;
}
