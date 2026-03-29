import { z } from "zod";
import { router, protectedProcedure } from "../server";
import { generateDailyBriefing } from "@/lib/ai/daily-briefing";
import { generateInsights, detectAnomalies } from "@/lib/ai/insights";
import { buildFromMenu, buildFromOnboarding } from "@/lib/ai/knowledge-builder";
import { generateProductImage, enhanceImagePrompt } from "@/lib/ai/image-gen";
import { handleChatMessage } from "@/lib/ai/chat-brain";
import { enforceCredit } from "@/lib/billing/guard";

export const aiRouter = router({
  /**
   * AI Preview — ลองถาม AI ว่าจะตอบยังไง (หักเครดิต)
   */
  previewAI: protectedProcedure
    .input(
      z.object({
        shopId: z.string(),
        question: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      await enforceCredit(input.shopId, "ai_message");

      const result = await handleChatMessage({
        shopId: input.shopId,
        customerMessage: input.question,
        customerName: "ทดสอบ",
      });
      return { reply: result.reply, contextUsed: result.contextUsed };
    }),

  /**
   * Daily Briefing — สรุปยอดขายเมื่อวาน + action items (หักเครดิต)
   */
  getDailyBriefing: protectedProcedure
    .input(z.object({ shopId: z.string() }))
    .query(async ({ input }) => {
      await enforceCredit(input.shopId, "daily_briefing");
      return generateDailyBriefing(input.shopId);
    }),

  /**
   * AI Insights — วิเคราะห์ trend + anomaly (หักเครดิต, ทุกคนใช้ได้)
   */
  getInsights: protectedProcedure
    .input(
      z.object({
        shopId: z.string(),
        period: z.number().min(7).max(90).default(14),
      })
    )
    .query(async ({ input }) => {
      await enforceCredit(input.shopId, "ai_insights");
      return generateInsights(input.shopId, input.period);
    }),

  /**
   * Quick anomaly alerts (ไม่ใช้ AI, ฟรี ไม่หักเครดิต)
   */
  getAnomalies: protectedProcedure
    .input(z.object({ shopId: z.string() }))
    .query(async ({ input }) => {
      return detectAnomalies(input.shopId);
    }),

  /**
   * Auto-build knowledge from menu items (ฟรี)
   */
  buildKnowledgeFromMenu: protectedProcedure
    .input(z.object({ shopId: z.string() }))
    .mutation(async ({ input }) => {
      return buildFromMenu(input.shopId);
    }),

  /**
   * Auto-build knowledge from onboarding data (ฟรี)
   */
  buildKnowledgeFromOnboarding: protectedProcedure
    .input(z.object({ shopId: z.string() }))
    .mutation(async ({ input }) => {
      return buildFromOnboarding(input.shopId);
    }),

  /**
   * Generate product image — Imagen 3 (หักเครดิต image_generation)
   */
  generateImage: protectedProcedure
    .input(
      z.object({
        shopId: z.string(),
        prompt: z.string().min(3),
      })
    )
    .mutation(async ({ input }) => {
      await enforceCredit(input.shopId, "image_generation");

      const result = await generateProductImage(input.prompt);
      if (!result) {
        throw new Error("ไม่สามารถสร้างรูปได้ กรุณาลองใหม่");
      }
      return result;
    }),

  /**
   * Enhance image prompt — ช่วย user สร้าง prompt ที่ดีขึ้น (หักเครดิต)
   */
  enhancePrompt: protectedProcedure
    .input(
      z.object({
        productName: z.string(),
        productType: z.string(),
        shopId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      if (input.shopId) {
        await enforceCredit(input.shopId, "enhance_prompt");
      }
      const enhanced = await enhanceImagePrompt(input.productName, input.productType);
      return { prompt: enhanced };
    }),
});
