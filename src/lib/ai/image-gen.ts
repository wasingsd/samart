import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Image Generation with Gemini Imagen 3
 * สร้างรูปสินค้า/โปรโมชันสำหรับโพสต์
 */

/**
 * Generate product image
 * @param prompt - คำอธิบายรูปที่ต้องการ
 * @returns base64 image data + mime type
 */
export async function generateProductImage(
  prompt: string
): Promise<{ base64: string; mimeType: string } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const genAI = new GoogleGenerativeAI(apiKey);

  // Use Imagen 3 via Gemini
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
  });

  // Enhance prompt for better results
  const enhancedPrompt = `Create a high-quality product photo for a Thai shop social media post. 
Style: professional, clean background, good lighting, appetizing/attractive.
Subject: ${prompt}
Do NOT include any text overlay on the image.`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: enhancedPrompt }] }],
      generationConfig: {
        responseModalities: ["image", "text"],
      } as Record<string, unknown>,
    });

    // Extract image from response
    const response = result.response;
    const candidates = response.candidates;

    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          return {
            base64: part.inlineData.data || "",
            mimeType: part.inlineData.mimeType || "image/png",
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Image generation error:", error);
    return null;
  }
}

/**
 * Generate enhanced prompt from simple product description
 * ช่วย user สร้าง prompt ที่ดีขึ้น
 */
export async function enhanceImagePrompt(
  productName: string,
  productType: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  try {
    const result = await model.generateContent(
      `Create a short image generation prompt (1-2 sentences, English) for a Thai shop product photo:
Product: ${productName}
Type: ${productType}
Style: professional product photography, clean, appetizing
Respond with ONLY the prompt, nothing else.`
    );
    return result.response.text().trim();
  } catch {
    return `Professional product photo of ${productName}, clean background, good lighting`;
  }
}
