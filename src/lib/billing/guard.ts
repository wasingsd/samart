import { getPlanLimits, type PlanLimits } from "./plans";
import { getUsage, getKnowledgeDocCount, type UsageType } from "./usage";
import { getDb } from "@/lib/firebase/admin";

/**
 * Quota Guard — เช็ค quota ก่อนอนุญาตให้ใช้งาน
 */

export interface QuotaCheckResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  used: number;
  upgradeMessage?: string;
}

/**
 * Map usage type → plan limit field
 */
const usageToLimitMap: Record<UsageType, keyof PlanLimits> = {
  ai_message: "aiMessages",
  knowledge_doc: "knowledgeDocs",
  content_generation: "contentGenerations",
};

/**
 * Get shop's current plan ID
 */
async function getShopPlanId(shopId: string): Promise<string> {
  try {
    const doc = await getDb().collection("shops").doc(shopId).get();
    return doc.data()?.plan || "free";
  } catch {
    return "free";
  }
}

/**
 * Check if shop can perform action (quota check)
 */
export async function checkQuota(
  shopId: string,
  type: UsageType
): Promise<QuotaCheckResult> {
  const planId = await getShopPlanId(shopId);
  const limits = getPlanLimits(planId);
  const limitField = usageToLimitMap[type];
  const limit = limits[limitField] as number;

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, remaining: -1, limit: -1, used: 0 };
  }

  let used: number;

  // Knowledge docs check total count, not monthly
  if (type === "knowledge_doc") {
    used = await getKnowledgeDocCount(shopId);
  } else {
    used = await getUsage(shopId, type);
  }

  const remaining = Math.max(0, limit - used);
  const allowed = remaining > 0;

  const upgradeMessages: Record<UsageType, string> = {
    ai_message: `AI ตอบแชทครบ ${limit} ข้อความ/เดือนแล้ว อัปเกรดเพื่อเพิ่มจำนวน`,
    knowledge_doc: `Knowledge Base ครบ ${limit} รายการแล้ว อัปเกรดเพื่อเพิ่มพื้นที่`,
    content_generation: `สร้าง Content ครบ ${limit} ครั้ง/เดือนแล้ว อัปเกรดเพื่อสร้างเพิ่ม`,
  };

  return {
    allowed,
    remaining,
    limit,
    used,
    upgradeMessage: allowed ? undefined : upgradeMessages[type],
  };
}

/**
 * Guard: throw error if quota exceeded
 * ใช้ใน tRPC procedures
 */
export async function enforceQuota(
  shopId: string,
  type: UsageType
): Promise<void> {
  const result = await checkQuota(shopId, type);
  if (!result.allowed) {
    throw new Error(result.upgradeMessage || "Quota exceeded");
  }
}

/**
 * Check if shop can use a boolean feature (broadcast, export, insights)
 */
export async function checkFeatureAccess(
  shopId: string,
  feature: "canBroadcast" | "canExportCSV" | "hasAIInsights"
): Promise<boolean> {
  const planId = await getShopPlanId(shopId);
  const limits = getPlanLimits(planId);
  return limits[feature];
}
