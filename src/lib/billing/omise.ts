/**
 * Omise Payment Integration
 * Pay-as-you-go credit top-up สำหรับ SAMART
 * รองรับ: บัตรเครดิต/เดบิต + PromptPay QR
 */

const OMISE_API = "https://api.omise.co";

/**
 * Make Omise API request (server-side only)
 */
async function omiseRequest(
  endpoint: string,
  method: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
  body?: Record<string, string | number | boolean>
): Promise<Record<string, unknown>> {
  const secretKey = process.env.OMISE_SECRET_KEY;
  if (!secretKey) throw new Error("OMISE_SECRET_KEY not configured");

  const headers: HeadersInit = {
    Authorization: `Basic ${Buffer.from(secretKey + ":").toString("base64")}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const options: RequestInit = { method, headers };

  if (body && (method === "POST" || method === "PATCH")) {
    const params = new URLSearchParams();
    Object.entries(body).forEach(([key, value]) => {
      params.append(key, String(value));
    });
    options.body = params.toString();
  }

  const res = await fetch(`${OMISE_API}${endpoint}`, options);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Omise error: ${err.message || res.statusText}`);
  }
  return res.json();
}

// ──────────────────────────────────────
// Customer
// ──────────────────────────────────────

export async function createCustomer(
  email: string,
  description: string,
  cardToken?: string
): Promise<{ id: string }> {
  const body: Record<string, string> = { email, description };
  if (cardToken) body.card = cardToken;
  const result = await omiseRequest("/customers", "POST", body);
  return { id: result.id as string };
}

// ──────────────────────────────────────
// Charge — One-time payment
// ──────────────────────────────────────

/**
 * Charge via card (customer token)
 */
export async function chargeCard(
  amount: number, // สตางค์ (THB * 100)
  customerId: string,
  description: string
): Promise<{ id: string; status: string; authorized: boolean }> {
  const result = await omiseRequest("/charges", "POST", {
    amount,
    currency: "thb",
    customer: customerId,
    description,
  });
  return {
    id: result.id as string,
    status: result.status as string,
    authorized: result.authorized as boolean,
  };
}

/**
 * Charge via PromptPay QR
 * สร้าง source → charge → return QR image URL
 */
export async function chargePromptPay(
  amount: number, // สตางค์ (THB * 100)
  description: string
): Promise<{
  chargeId: string;
  status: string;
  qrCodeUrl: string;
  expiresAt: string;
}> {
  // Step 1: Create PromptPay source
  const source = await omiseRequest("/sources", "POST", {
    type: "promptpay",
    amount,
    currency: "thb",
  });

  // Step 2: Create charge from source
  const charge = await omiseRequest("/charges", "POST", {
    amount,
    currency: "thb",
    source: source.id as string,
    description,
  });

  // QR code URL from source
  const scannable = (charge.source as Record<string, unknown>)?.scannable_code as Record<string, unknown> | undefined;
  const qrImage = scannable?.image as Record<string, unknown> | undefined;

  return {
    chargeId: charge.id as string,
    status: charge.status as string,
    qrCodeUrl: (qrImage?.download_uri as string) || "",
    expiresAt: (charge.expires_at as string) || "",
  };
}

// ──────────────────────────────────────
// Charge Status
// ──────────────────────────────────────

export async function getCharge(
  chargeId: string
): Promise<{ id: string; status: string; amount: number; paid: boolean }> {
  const result = await omiseRequest(`/charges/${chargeId}`);
  return {
    id: result.id as string,
    status: result.status as string,
    amount: result.amount as number,
    paid: result.paid as boolean,
  };
}
