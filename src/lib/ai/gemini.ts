import { GoogleGenerativeAI, type GenerateContentResult } from "@google/generative-ai";

/**
 * Gemini AI Client
 * Flash สำหรับ chat (เร็ว, ราคาถูก)
 * Pro สำหรับ content generation + analysis (ฉลาดกว่า)
 */

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/**
 * Generate text with Gemini Flash (chat, quick tasks)
 */
export async function generateFlash(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const model = getGenAI().getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: systemPrompt,
  });

  const result: GenerateContentResult = await model.generateContent(userMessage);
  return result.response.text();
}

/**
 * Generate text with Gemini Pro (content, analysis)
 */
export async function generatePro(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const model = getGenAI().getGenerativeModel({
    model: "gemini-2.5-pro-preview-06-05",
    systemInstruction: systemPrompt,
  });

  const result: GenerateContentResult = await model.generateContent(userMessage);
  return result.response.text();
}

/**
 * Classify intent of a customer message
 */
export async function classifyIntent(
  message: string
): Promise<"order" | "faq" | "booking" | "complaint" | "general"> {
  const model = getGenAI().getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: `You are an intent classifier for a Thai shop chatbot.
Classify the customer message into exactly one of: order, faq, booking, complaint, general.
Respond with ONLY the classification word, nothing else.`,
  });

  const result = await model.generateContent(message);
  const text = result.response.text().trim().toLowerCase();

  const validIntents = ["order", "faq", "booking", "complaint", "general"] as const;
  if (validIntents.includes(text as typeof validIntents[number])) {
    return text as typeof validIntents[number];
  }
  return "general";
}
