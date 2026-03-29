import { spendCredits, getCreditBalance } from "./usage";
import { getCreditCost, CREDIT_ACTION_LABELS, type CreditAction } from "./plans";

/**
 * Credit Guard — เช็ค + หักเครดิตก่อนอนุญาตให้ใช้ AI
 */

export interface CreditCheckResult {
  allowed: boolean;
  remaining: number;
  cost: number;
  message?: string;
}

/**
 * Check if shop has enough credits for action (read-only, ไม่หัก)
 */
export async function checkCredits(
  shopId: string,
  action: CreditAction
): Promise<CreditCheckResult> {
  const cost = getCreditCost(action);
  const balance = await getCreditBalance(shopId);
  const allowed = balance >= cost;
  const label = CREDIT_ACTION_LABELS[action];

  return {
    allowed,
    remaining: balance,
    cost,
    message: allowed
      ? undefined
      : `เครดิตไม่พอสำหรับ${label} (ต้องการ ${cost} เครดิต, คงเหลือ ${balance}) กรุณาเติมเครดิต`,
  };
}

/**
 * Enforce credit: check + deduct in one call
 * ใช้ใน tRPC procedures — throw error ถ้าเครดิตไม่พอ
 */
export async function enforceCredit(
  shopId: string,
  action: CreditAction
): Promise<{ remaining: number; cost: number }> {
  const result = await spendCredits(shopId, action);

  if (!result.success) {
    const cost = getCreditCost(action);
    const label = CREDIT_ACTION_LABELS[action];
    throw new Error(
      `เครดิตไม่พอสำหรับ${label} (ต้องการ ${cost} เครดิต, คงเหลือ ${result.remaining}) กรุณาเติมเครดิต`
    );
  }

  return { remaining: result.remaining, cost: result.cost };
}
