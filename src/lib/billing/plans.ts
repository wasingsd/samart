/**
 * SAMART Credit System — Pay-As-You-Go
 * เครดิตใช้เฉพาะ AI features, CRUD ฟรีทั้งหมด
 */

// -- Credit Actions & Costs --

export type CreditAction =
  | "ai_message"           // AI ตอบแชทลูกค้า
  | "content_generation"   // สร้าง Content โพสต์
  | "image_generation"     // สร้างรูป AI (Imagen)
  | "daily_briefing"       // AI Daily Briefing
  | "ai_insights"          // AI วิเคราะห์ข้อมูล
  | "enhance_prompt";      // AI แนะนำ prompt

/**
 * ต้นทุนเครดิตต่อ action
 * คำนวณจาก Gemini API cost จริง + markup ~70%
 */
export const CREDIT_COSTS: Record<CreditAction, number> = {
  ai_message: 1,           // Flash model ~0.10 ฿
  content_generation: 5,   // Pro model ~0.50 ฿
  image_generation: 10,    // Imagen 3 ~1.00 ฿
  daily_briefing: 3,       // Pro model ~0.30 ฿
  ai_insights: 8,          // Pro model ~0.80 ฿
  enhance_prompt: 1,       // Flash model ~0.10 ฿
};

/**
 * Label ภาษาไทยสำหรับแต่ละ action
 */
export const CREDIT_ACTION_LABELS: Record<CreditAction, string> = {
  ai_message: "AI ตอบแชท",
  content_generation: "สร้าง Content",
  image_generation: "สร้างรูป AI",
  daily_briefing: "Daily Briefing",
  ai_insights: "AI Insights",
  enhance_prompt: "AI แนะนำ prompt",
};

// -- Credit Packages --

export type PackageId = "starter" | "basic" | "popular" | "power" | "business";

export interface CreditPackage {
  id: PackageId;
  name: string;
  emoji: string;
  credits: number;
  bonusCredits: number;  // เครดิตโบนัสเพิ่ม
  price: number;         // THB (0 = free)
  pricePerCredit: number;
  popular?: boolean;
}

export const CREDIT_PACKAGES: Record<PackageId, CreditPackage> = {
  starter: {
    id: "starter",
    name: "Starter",
    emoji: "🌱",
    credits: 100,
    bonusCredits: 0,
    price: 0,
    pricePerCredit: 0,
  },
  basic: {
    id: "basic",
    name: "Basic",
    emoji: "⚡",
    credits: 500,
    bonusCredits: 0,
    price: 149,
    pricePerCredit: 0.30,
  },
  popular: {
    id: "popular",
    name: "Popular",
    emoji: "🔥",
    credits: 2000,
    bonusCredits: 200,
    price: 499,
    pricePerCredit: 0.25,
    popular: true,
  },
  power: {
    id: "power",
    name: "Power",
    emoji: "💎",
    credits: 5000,
    bonusCredits: 1000,
    price: 999,
    pricePerCredit: 0.20,
  },
  business: {
    id: "business",
    name: "Business",
    emoji: "🏢",
    credits: 15000,
    bonusCredits: 3000,
    price: 2499,
    pricePerCredit: 0.17,
  },
};

/**
 * เครดิตฟรีตอนสมัครใหม่
 */
export const FREE_STARTER_CREDITS = 100;

/**
 * เครดิตคงเหลือขั้นต่ำที่แสดง warning
 */
export const LOW_CREDIT_THRESHOLD = 50;

// -- Helpers --

export function getCreditCost(action: CreditAction): number {
  return CREDIT_COSTS[action];
}

export function getCreditPackage(id: string): CreditPackage | null {
  return CREDIT_PACKAGES[id as PackageId] || null;
}

export function getPackagesList(): CreditPackage[] {
  return Object.values(CREDIT_PACKAGES);
}

/**
 * คำนวณเครดิตรวม (base + bonus)
 */
export function getTotalCredits(pkg: CreditPackage): number {
  return pkg.credits + pkg.bonusCredits;
}
