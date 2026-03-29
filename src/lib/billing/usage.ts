import { getDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { getCreditCost, type CreditAction } from "./plans";

/**
 * Credit & Usage Metering — ระบบเครดิต + บันทึกการใช้งาน
 *
 * Firestore structure:
 *   shops/{shopId}.creditBalance           — ยอดเครดิตคงเหลือ
 *   shops/{shopId}/creditTransactions/{id}  — ประวัติธุรกรรม
 *   shops/{shopId}/usage/{yearMonth}        — สรุปรายเดือน (สำหรับ analytics)
 */

export type UsageType = CreditAction;

// ──────────────────────────────────────
// Credit Balance
// ──────────────────────────────────────

/**
 * ดึงยอดเครดิตคงเหลือ
 */
export async function getCreditBalance(shopId: string): Promise<number> {
  const doc = await getDb().collection("shops").doc(shopId).get();
  const data = doc.data();
  
  // Admin / Developer bypass for unlimited tokens
  let ownerEmail = data?.ownerEmail || "";
  if (!ownerEmail && data?.ownerId) {
    const userDoc = await getDb().collection("users").doc(data.ownerId).get();
    ownerEmail = userDoc.data()?.email || "";
  }

  if (ownerEmail === "wasin.gsd@gmail.com" || ownerEmail === "pluypt@gmail.com") {
    return 999999;
  }
  
  return data?.creditBalance ?? 0;
}

/**
 * เพิ่มเครดิต (เมื่อเติม/ได้โบนัส)
 */
export async function addCredits(
  shopId: string,
  amount: number,
  reason: "topup" | "bonus" | "refund",
  meta?: { packageId?: string; paymentId?: string }
): Promise<{ newBalance: number }> {
  const shopRef = getDb().collection("shops").doc(shopId);

  const newBalance = await getDb().runTransaction(async (tx) => {
    const shopDoc = await tx.get(shopRef);
    const currentBalance = shopDoc.data()?.creditBalance ?? 0;
    const updatedBalance = currentBalance + amount;

    tx.update(shopRef, {
      creditBalance: FieldValue.increment(amount),
      totalCreditsBought: FieldValue.increment(amount),
    });

    // Log transaction
    const txRef = shopRef.collection("creditTransactions").doc();
    tx.set(txRef, {
      id: txRef.id,
      type: reason,
      amount,
      balanceAfter: updatedBalance,
      packageId: meta?.packageId || null,
      paymentId: meta?.paymentId || null,
      createdAt: FieldValue.serverTimestamp(),
    });

    return updatedBalance;
  });

  return { newBalance };
}

/**
 * หักเครดิต (เมื่อใช้ AI)
 * คืน false ถ้าเครดิตไม่พอ
 */
export async function spendCredits(
  shopId: string,
  action: CreditAction
): Promise<{ success: boolean; remaining: number; cost: number }> {
  const cost = getCreditCost(action);
  const shopRef = getDb().collection("shops").doc(shopId);

  const result = await getDb().runTransaction(async (tx) => {
    const shopDoc = await tx.get(shopRef);
    const data = shopDoc.data();
    
    // Admin / Developer bypass for unlimited tokens
    let ownerEmail = data?.ownerEmail || "";
    if (!ownerEmail && data?.ownerId) {
      const userRef = getDb().collection("users").doc(data.ownerId);
      const userDoc = await tx.get(userRef);
      ownerEmail = userDoc.data()?.email || "";
    }

    if (ownerEmail === "wasin.gsd@gmail.com" || ownerEmail === "pluypt@gmail.com") {
      return { success: true, remaining: 999999, cost: 0 };
    }

    const currentBalance = data?.creditBalance ?? 0;

    if (currentBalance < cost) {
      return { success: false, remaining: currentBalance, cost };
    }

    const newBalance = currentBalance - cost;

    tx.update(shopRef, {
      creditBalance: FieldValue.increment(-cost),
      totalCreditsUsed: FieldValue.increment(cost),
    });

    // Log transaction
    const txRef = shopRef.collection("creditTransactions").doc();
    tx.set(txRef, {
      id: txRef.id,
      type: "deduct",
      amount: -cost,
      action,
      balanceAfter: newBalance,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { success: true, remaining: newBalance, cost };
  });

  // Also track monthly usage stats (fire-and-forget)
  trackMonthlyUsage(shopId, action).catch(() => {});

  return result;
}

// ──────────────────────────────────────
// Monthly Usage Stats (for analytics)
// ──────────────────────────────────────

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Track monthly usage (สำหรับดูสถิติ ไม่ใช่ guard)
 */
async function trackMonthlyUsage(
  shopId: string,
  action: CreditAction,
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
      [action]: FieldValue.increment(count),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Get monthly usage summary
 */
export async function getMonthlyUsage(
  shopId: string
): Promise<Record<string, number>> {
  const monthKey = getCurrentMonth();
  const doc = await getDb()
    .collection("shops")
    .doc(shopId)
    .collection("usage")
    .doc(monthKey)
    .get();

  if (!doc.exists) return {};
  const data = doc.data() || {};
  // Remove non-action fields
  const { updatedAt, ...usage } = data;
  return usage as Record<string, number>;
}

/**
 * Get transaction history
 */
export async function getTransactionHistory(
  shopId: string,
  limit: number = 20
): Promise<Array<Record<string, unknown>>> {
  const snap = await getDb()
    .collection("shops")
    .doc(shopId)
    .collection("creditTransactions")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// ──────────────────────────────────────
// Legacy compat (knowledge doc count)
// ──────────────────────────────────────

export async function getKnowledgeDocCount(shopId: string): Promise<number> {
  const snapshot = await getDb()
    .collection("shops")
    .doc(shopId)
    .collection("knowledge")
    .where("isActive", "==", true)
    .get();
  return snapshot.size;
}
