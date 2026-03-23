import { z } from "zod";
import { router, protectedProcedure } from "../server";
import { generateDailyBriefing } from "@/lib/ai/daily-briefing";
import { generateInsights, detectAnomalies } from "@/lib/ai/insights";
import { buildFromMenu, buildFromOnboarding } from "@/lib/ai/knowledge-builder";
import { generateProductImage, enhanceImagePrompt } from "@/lib/ai/image-gen";
import { handleChatMessage } from "@/lib/ai/chat-brain";
import { checkFeatureAccess } from "@/lib/billing/guard";

export const aiRouter = router({
  /**
   * AI Preview — ลองถาม AI ว่าจะตอบยังไง (ไม่นับ quota)
   */
  previewAI: protectedProcedure
    .input(
      z.object({
        shopId: z.string(),
        question: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const result = await handleChatMessage({
        shopId: input.shopId,
        customerMessage: input.question,
        customerName: "ทดสอบ",
      });
      return { reply: result.reply, contextUsed: result.contextUsed };
    }),

  /**
   * Daily Briefing — สรุปยอดขายเมื่อวาน + action items
   */
  getDailyBriefing: protectedProcedure
    .input(z.object({ shopId: z.string() }))
    .query(async ({ input }) => {
      return generateDailyBriefing(input.shopId);
    }),

  /**
   * AI Insights — วิเคราะห์ trend + anomaly (Business plan only)
   */
  getInsights: protectedProcedure
    .input(
      z.object({
        shopId: z.string(),
        period: z.number().min(7).max(90).default(14),
      })
    )
    .query(async ({ input }) => {
      // Check plan access
      const hasAccess = await checkFeatureAccess(input.shopId, "hasAIInsights");
      if (!hasAccess) {
        return {
          insights: [{
            type: "recommendation" as const,
            icon: "🔒",
            title: "อัปเกรดเป็น Business",
            description: "AI Insights พร้อมใช้งานในแพลน Business เท่านั้น",
            priority: "medium" as const,
          }],
          generatedAt: new Date().toISOString(),
        };
      }
      return generateInsights(input.shopId, input.period);
    }),

  /**
   * Quick anomaly alerts (ไม่ใช้ AI, ทุก plan ใช้ได้)
   */
  getAnomalies: protectedProcedure
    .input(z.object({ shopId: z.string() }))
    .query(async ({ input }) => {
      return detectAnomalies(input.shopId);
    }),

  /**
   * Auto-build knowledge from menu items
   */
  buildKnowledgeFromMenu: protectedProcedure
    .input(z.object({ shopId: z.string() }))
    .mutation(async ({ input }) => {
      return buildFromMenu(input.shopId);
    }),

  /**
   * Auto-build knowledge from onboarding data
   */
  buildKnowledgeFromOnboarding: protectedProcedure
    .input(z.object({ shopId: z.string() }))
    .mutation(async ({ input }) => {
      return buildFromOnboarding(input.shopId);
    }),

  /**
   * Generate product image (Imagen 3)
   */
  generateImage: protectedProcedure
    .input(
      z.object({
        shopId: z.string(),
        prompt: z.string().min(3),
      })
    )
    .mutation(async ({ input }) => {
      const { enforceQuota } = await import("@/lib/billing/guard");
      await enforceQuota(input.shopId, "content_generation");

      const result = await generateProductImage(input.prompt);
      if (!result) {
        throw new Error("ไม่สามารถสร้างรูปได้ กรุณาลองใหม่");
      }

      const { trackUsage } = await import("@/lib/billing/usage");
      await trackUsage(input.shopId, "content_generation");

      return result;
    }),

  /**
   * Enhance image prompt — ช่วย user สร้าง prompt ที่ดีขึ้น
   */
  enhancePrompt: protectedProcedure
    .input(
      z.object({
        productName: z.string(),
        productType: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const enhanced = await enhanceImagePrompt(input.productName, input.productType);
      return { prompt: enhanced };
    }),
});
