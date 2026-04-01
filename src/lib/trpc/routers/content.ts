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
      // Check + deduct credits
      const { enforceCredit } = await import("@/lib/billing/guard");
      await enforceCredit(input.shopId, "content_generation");

      const typeLabels: Record<string, string> = {
        promotion: "โปรโมชัน",
        "new-product": "สินค้าใหม่",
        daily: "โพสต์รายวัน",
        review: "รีวิว",
        tips: "เกร็ดความรู้",
      };

      const toneLabels: Record<string, string> = {
        friendly: "เป็นกันเอง",
        professional: "มืออาชีพ",
        fun: "สนุกสนาน",
        luxury: "หรูหรา",
      };

      // Generate content with Gemini
      let content: string;
      try {
        const { generatePro } = await import("@/lib/ai/gemini");
        const platformStr = [
          input.platforms.facebook ? "Facebook" : "",
          input.platforms.line ? "LINE" : "",
        ].filter(Boolean).join(" + ");

        content = await generatePro(
          `คุณเป็นนักเขียน content มืออาชีพสำหรับร้านค้าในประเทศไทย
เขียนเป็นภาษาไทย น้ำเสียง: ${toneLabels[input.tone]}
แพลตฟอร์ม: ${platformStr}
ให้ content พร้อมใช้งาน ไม่ต้องใส่คำอธิบายเพิ่มเติม`,
          `สร้างโพสต์ ${typeLabels[input.postType]} เกี่ยวกับ: ${input.topic}`
        );
      } catch (error: any) {
        console.error("Gemini Generate Error:", error);
        content = `[${typeLabels[input.postType]}]\n\n${input.topic}\n\n(เกิดข้อผิดพลาดในการสร้าง Content: ${error.message})`;
      }

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

      // Usage already tracked by enforceCredit

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
