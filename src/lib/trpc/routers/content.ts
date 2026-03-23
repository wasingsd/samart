import { z } from "zod";
import { router, protectedProcedure } from "../server";
import { getDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export const contentRouter = router({
  /**
   * สร้าง AI content (placeholder — จะเชื่อม Gemini ทีหลัง)
   */
  generate: protectedProcedure
    .input(
      z.object({
        shopId: z.string(),
        postType: z.enum(["promotion", "new-product", "daily", "review", "tips"]),
        tone: z.enum(["friendly", "professional", "fun", "luxury"]),
        topic: z.string().min(3, "กรุณากรอกหัวข้ออย่างน้อย 3 ตัวอักษร"),
        platforms: z.object({
          facebook: z.boolean(),
          line: z.boolean(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      // TODO: Connect to Gemini API for actual content generation
      // For now, return a structured placeholder
      const typeLabels: Record<string, string> = {
        promotion: "โปรโมชัน",
        "new-product": "สินค้าใหม่",
        daily: "โพสต์รายวัน",
        review: "รีวิว",
        tips: "เกร็ดความรู้",
      };

      const content = `[AI Generated - ${typeLabels[input.postType]}]\n\n${input.topic}\n\n(Content จะถูกสร้างอัตโนมัติเมื่อเชื่อมต่อ Gemini API)`;

      // Save draft
      const docRef = getDb()
        .collection("shops")
        .doc(input.shopId)
        .collection("contentDrafts")
        .doc();

      await docRef.set({
        id: docRef.id,
        postType: input.postType,
        tone: input.tone,
        topic: input.topic,
        generatedContent: content,
        platforms: input.platforms,
        status: "draft",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { id: docRef.id, content };
    }),

  /**
   * ดึง content drafts ทั้งหมด
   */
  listDrafts: protectedProcedure
    .input(z.object({ shopId: z.string() }))
    .query(async ({ input }) => {
      const snapshot = await getDb()
        .collection("shops")
        .doc(input.shopId)
        .collection("contentDrafts")
        .orderBy("createdAt", "desc")
        .limit(20)
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }),

  /**
   * อัปเดต draft content
   */
  updateDraft: protectedProcedure
    .input(
      z.object({
        shopId: z.string(),
        draftId: z.string(),
        content: z.string(),
        status: z.enum(["draft", "scheduled", "published"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const updateData: Record<string, unknown> = {
        generatedContent: input.content,
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (input.status) updateData.status = input.status;

      await getDb()
        .collection("shops")
        .doc(input.shopId)
        .collection("contentDrafts")
        .doc(input.draftId)
        .update(updateData);

      return { success: true };
    }),
});
