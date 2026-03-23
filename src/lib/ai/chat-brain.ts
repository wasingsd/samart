import { generateFlash, classifyIntent } from "./gemini";
import { styleProfileToPrompt, defaultStyleProfile } from "./style-profile";
import { retrieveContext, getDynamicContext, getLearnedPatterns } from "./rag";
import { getDb } from "@/lib/firebase/admin";

/**
 * Chat Brain — Main AI Orchestrator
 * ประกอบ prompt 5 layers + intent classification แล้วเรียก Gemini Flash
 */

interface ChatBrainInput {
  shopId: string;
  customerMessage: string;
  customerName?: string;
  customerSegment?: string;
}

interface ChatBrainOutput {
  reply: string;
  intent: "order" | "faq" | "booking" | "complaint" | "general";
  contextUsed: string;
}

/**
 * Handle incoming chat message — หัวใจของ SAMART
 */
export async function handleChatMessage(
  input: ChatBrainInput
): Promise<ChatBrainOutput> {
  const { shopId, customerMessage, customerName, customerSegment } = input;

  // 0. Classify intent (parallel with data fetch)
  let intent: ChatBrainOutput["intent"] = "general";
  try {
    intent = await classifyIntent(customerMessage);
  } catch {
    // Default to general
  }

  // 1. Get shop data + style profile
  let shopName = "ร้านค้า";
  let styleProfile = defaultStyleProfile();

  try {
    const shopDoc = await getDb().collection("shops").doc(shopId).get();
    if (shopDoc.exists) {
      const data = shopDoc.data();
      shopName = data?.name || shopName;
      if (data?.styleProfile) {
        styleProfile = { ...styleProfile, ...data.styleProfile };
      }
    }
  } catch {
    // Use defaults
  }

  // 2. Retrieve relevant knowledge (RAG)
  const ragContext = await retrieveContext(shopId, customerMessage, 3);

  // 3. Get dynamic context (time, promos)
  const dynamicContext = await getDynamicContext(shopId);

  // 4. Get few-shot examples from learned patterns
  const learnedExamples = await getLearnedPatterns(shopId, 3);

  // 5. Build system prompt with intent awareness
  const intentInstruction = getIntentInstruction(intent);
  const systemPrompt = buildSystemPrompt({
    shopName,
    styleProfile,
    ragContext,
    dynamicContext,
    learnedExamples,
    customerName,
    customerSegment,
    intentInstruction,
  });

  // 6. Call Gemini Flash
  let reply: string;
  try {
    reply = await generateFlash(systemPrompt, customerMessage);
  } catch (error) {
    console.error("Gemini error:", error);
    reply = `ขอบคุณที่ส่งข้อความมาครับ/ค่ะ ขออภัยระบบมีปัญหาชั่วคราว ทางร้านจะติดต่อกลับโดยเร็วครับ/ค่ะ`;
  }

  // 7. Basic validation
  reply = validateReply(reply);

  return {
    reply,
    intent,
    contextUsed: ragContext,
  };
}

/**
 * Get intent-specific instructions for the AI
 */
function getIntentInstruction(intent: ChatBrainOutput["intent"]): string {
  switch (intent) {
    case "order":
      return "ลูกค้ากำลังสนใจสั่งซื้อ ให้แนะนำสินค้า บอกราคา และถามว่าต้องการสั่งอะไรบ้าง";
    case "faq":
      return "ลูกค้ามีคำถาม ให้ตอบจากข้อมูลที่มี ถ้าไม่มีให้บอกว่าจะสอบถามทางร้านให้";
    case "booking":
      return "ลูกค้าต้องการจอง ให้สอบถามวันเวลาที่ต้องการและจำนวนคน";
    case "complaint":
      return "ลูกค้ามีปัญหาหรือข้อร้องเรียน ให้ขอโทษอย่างจริงใจ รับฟัง และแจ้งว่าจะส่งเรื่องให้ทางร้านดูแลทันที";
    default:
      return "";
  }
}

/**
 * Build multi-layer system prompt
 */
function buildSystemPrompt(params: {
  shopName: string;
  styleProfile: ReturnType<typeof defaultStyleProfile>;
  ragContext: string;
  dynamicContext: string;
  learnedExamples: string;
  customerName?: string;
  customerSegment?: string;
  intentInstruction?: string;
}): string {
  const parts: string[] = [];

  // Layer 1: Core identity + style
  parts.push(styleProfileToPrompt(params.styleProfile, params.shopName));

  // Layer 2: Intent instruction
  if (params.intentInstruction) {
    parts.push(`\n## คำสั่งพิเศษ\n${params.intentInstruction}`);
  }

  // Layer 3: RAG context
  parts.push(`\n## ข้อมูลร้านที่เกี่ยวข้อง\n${params.ragContext}`);

  // Layer 4: Dynamic context
  parts.push(`\n## สถานการณ์ปัจจุบัน\n${params.dynamicContext}`);

  // Layer 5: Few-shot examples
  if (params.learnedExamples) {
    parts.push(`\n## ตัวอย่างการตอบที่ดี\n${params.learnedExamples}`);
  }

  // Layer 6: Customer info
  if (params.customerName || params.customerSegment) {
    const customerInfo = [
      params.customerName ? `ชื่อ: ${params.customerName}` : "",
      params.customerSegment ? `กลุ่ม: ${params.customerSegment}` : "",
    ].filter(Boolean).join(", ");
    parts.push(`\n## ข้อมูลลูกค้า\n${customerInfo}`);
  }

  return parts.join("\n");
}

/**
 * Basic reply validation
 */
function validateReply(reply: string): string {
  // Trim whitespace
  reply = reply.trim();

  // Cap length at ~500 chars for LINE (LINE has 5000 char limit but shorter is better)
  if (reply.length > 500) {
    reply = reply.substring(0, 497) + "...";
  }

  // Ensure not empty
  if (!reply) {
    reply = "ขอสอบถามทางร้านเพิ่มเติมให้นะคะ";
  }

  return reply;
}
