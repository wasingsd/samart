import { getDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Usage Metering — บันทึกและตรวจสอบการใช้งานของร้าน
 * เก็บใน shops/{shopId}/usage/{yearMonth}
 */

export type UsageType = "ai_message" | "knowledge_doc" | "content_generation";

interface UsageDoc {
  ai_message: number;
  knowledge_doc: number;
  content_generation: number;
  updatedAt: FirebaseFirestore.Timestamp;
}

/**
 * Get current month key (e.g. "2026-03")
 */
function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Track usage — เพิ่มจำนวนการใช้งาน
 */
export async function trackUsage(
  shopId: string,
  type: UsageType,
  count: number = 1
): Promise<void> {
  const monthKey = getCurrentMonth();
  const ref = getDb()
    .collection("shops")
    .doc(shopId)
    .collection("usage")
    .doc(monthKey);

  await ref.set(
    {
      [type]: FieldValue.increment(count),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Get current month usage for a specific type
 */
export async function getUsage(
  shopId: string,
  type: UsageType
): Promise<number> {
  const monthKey = getCurrentMonth();
  const doc = await getDb()
    .collection("shops")
    .doc(shopId)
    .collection("usage")
    .doc(monthKey)
    .get();

  if (!doc.exists) return 0;
  return (doc.data() as Partial<UsageDoc>)?.[type] || 0;
}

/**
 * Get all usage for current month
 */
export async function getAllUsage(
  shopId: string
): Promise<Record<UsageType, number>> {
  const monthKey = getCurrentMonth();
  const doc = await getDb()
    .collection("shops")
    .doc(shopId)
    .collection("usage")
    .doc(monthKey)
    .get();

  const data = doc.exists ? (doc.data() as Partial<UsageDoc>) : {};

  return {
    ai_message: data.ai_message || 0,
    knowledge_doc: data.knowledge_doc || 0,
    content_generation: data.content_generation || 0,
  };
}

/**
 * Get knowledge doc count (total, not monthly)
 */
export async function getKnowledgeDocCount(shopId: string): Promise<number> {
  const snapshot = await getDb()
    .collection("shops")
    .doc(shopId)
    .collection("knowledge")
    .where("isActive", "==", true)
    .get();

  return snapshot.size;
}
