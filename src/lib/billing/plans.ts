/**
 * SAMART Plan Definitions
 * ราคา, quota, features สำหรับแต่ละ plan
 */

export type PlanId = "free" | "pro" | "business";

export interface PlanLimits {
  aiMessages: number;       // ต่อเดือน
  knowledgeDocs: number;    // จำนวนสูงสุด
  contentGenerations: number; // ต่อเดือน
  analyticsDays: number;    // ย้อนหลังกี่วัน
  canBroadcast: boolean;
  canExportCSV: boolean;
  hasAIInsights: boolean;
}

export interface PlanConfig {
  id: PlanId;
  name: string;
  price: number;          // THB/month (0 = free)
  limits: PlanLimits;
  features: string[];
  recommended?: boolean;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    limits: {
      aiMessages: 100,
      knowledgeDocs: 20,
      contentGenerations: 3,
      analyticsDays: 7,
      canBroadcast: false,
      canExportCSV: false,
      hasAIInsights: false,
    },
    features: [
      "AI ตอบแชทอัตโนมัติ 100 ข้อความ/เดือน",
      "Knowledge Base 20 รายการ",
      "สร้าง Content AI 3 ครั้ง/เดือน",
      "วิเคราะห์ยอดขาย 7 วัน",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 599,
    recommended: true,
    limits: {
      aiMessages: 2000,
      knowledgeDocs: 200,
      contentGenerations: 30,
      analyticsDays: 30,
      canBroadcast: true,
      canExportCSV: true,
      hasAIInsights: false,
    },
    features: [
      "AI ตอบแชทอัตโนมัติ 2,000 ข้อความ/เดือน",
      "Knowledge Base 200 รายการ",
      "สร้าง Content AI 30 ครั้ง/เดือน",
      "วิเคราะห์ยอดขาย 30 วัน",
      "ส่ง Broadcast ได้",
      "Export CSV",
    ],
  },
  business: {
    id: "business",
    name: "Business",
    price: 1499,
    limits: {
      aiMessages: 10000,
      knowledgeDocs: -1, // unlimited
      contentGenerations: -1,
      analyticsDays: 90,
      canBroadcast: true,
      canExportCSV: true,
      hasAIInsights: true,
    },
    features: [
      "AI ตอบแชทอัตโนมัติ 10,000 ข้อความ/เดือน",
      "Knowledge Base ไม่จำกัด",
      "สร้าง Content AI ไม่จำกัด",
      "วิเคราะห์ยอดขาย 90 วัน + AI Insights",
      "ส่ง Broadcast ได้",
      "Export CSV",
    ],
  },
};

/**
 * ดึง plan config จาก planId
 */
export function getPlan(planId: string): PlanConfig {
  return PLANS[planId as PlanId] || PLANS.free;
}

/**
 * ดึง limits ของ plan
 */
export function getPlanLimits(planId: string): PlanLimits {
  return getPlan(planId).limits;
}

/**
 * เช็คว่า plan รองรับ feature หรือไม่
 */
export function canUseFeature(planId: string, feature: keyof PlanLimits): boolean {
  const limits = getPlanLimits(planId);
  const value = limits[feature];
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  return false;
}
