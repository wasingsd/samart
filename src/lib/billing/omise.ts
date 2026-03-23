/**
 * Omise Payment Integration
 * Monthly subscription billing สำหรับ SAMART
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

/**
 * สร้าง Omise Customer
 */
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

/**
 * อัปเดต card ของ customer
 */
export async function updateCustomerCard(
  customerId: string,
  cardToken: string
): Promise<void> {
  await omiseRequest(`/customers/${customerId}`, "PATCH", { card: cardToken });
}

/**
 * สร้าง Charge (one-time payment)
 * ใช้สำหรับ monthly billing via cron/schedule
 */
export async function createCharge(
  amount: number, // สตางค์ (THB * 100)
  currency: string = "thb",
  customerId: string,
  description: string
): Promise<{ id: string; status: string }> {
  const result = await omiseRequest("/charges", "POST", {
    amount,
    currency,
    customer: customerId,
    description,
  });
  return {
    id: result.id as string,
    status: result.status as string,
  };
}

/**
 * สร้าง Schedule (recurring monthly charge)
 */
export async function createSchedule(
  customerId: string,
  amount: number, // สตางค์
  description: string
): Promise<{ id: string }> {
  const result = await omiseRequest("/schedules", "POST", {
    every: 1,
    period: "month",
    "on[days_of_month][]": 1 as unknown as string,
    "charge[customer]": customerId,
    "charge[amount]": amount,
    "charge[currency]": "thb",
    "charge[description]": description,
  });
  return { id: result.id as string };
}

/**
 * ยกเลิก Schedule
 */
export async function destroySchedule(scheduleId: string): Promise<void> {
  await omiseRequest(`/schedules/${scheduleId}`, "DELETE");
}

/**
 * ดึงข้อมูล Charge
 */
export async function getCharge(
  chargeId: string
): Promise<{ id: string; status: string; amount: number }> {
  const result = await omiseRequest(`/charges/${chargeId}`);
  return {
    id: result.id as string,
    status: result.status as string,
    amount: result.amount as number,
  };
}
