import { z } from "zod";
import { router, protectedProcedure } from "../server";
import { getDb } from "@/lib/firebase/admin";
import { CorrectionInputSchema } from "@/types";
import { FieldValue } from "firebase-admin/firestore";

export const chatLogRouter = router({
  /**
   * ดึงรายการ conversations ของร้าน
   */
  list: protectedProcedure
    .input(
      z.object({
        shopId: z.string(),
        status: z.enum(["all", "pending", "approved", "corrected", "featured"]).default("all"),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      let query = getDb()
        .collection("shops")
        .doc(input.shopId)
        .collection("conversations")
        .orderBy("createdAt", "desc")
        .limit(input.limit);

      if (input.status !== "all") {
        query = query.where("status", "==", input.status);
      }

      if (input.cursor) {
        const cursorDoc = await getDb()
          .collection("shops")
          .doc(input.shopId)
          .collection("conversations")
          .doc(input.cursor)
          .get();
        if (cursorDoc.exists) {
          query = query.startAfter(cursorDoc);
        }
      }

      const snapshot = await query.get();
      return {
        items: snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })),
        nextCursor: snapshot.docs.length === input.limit
          ? snapshot.docs[snapshot.docs.length - 1]?.id
          : undefined,
      };
    }),

  /**
   * นับจำนวน conversations แยกตาม status
   */
  stats: protectedProcedure
    .input(z.object({ shopId: z.string() }))
    .query(async ({ input }) => {
      const snapshot = await getDb()
        .collection("shops")
        .doc(input.shopId)
        .collection("conversations")
        .get();

      const stats = { total: 0, pending: 0, approved: 0, corrected: 0, featured: 0 };
      snapshot.docs.forEach((doc) => {
        const status = doc.data().status as string;
        stats.total++;
        if (status in stats) {
          stats[status as keyof typeof stats]++;
        }
      });
      return stats;
    }),

  /**
   * อนุมัติ AI reply ว่าถูกต้อง
   */
  approve: protectedProcedure
    .input(z.object({ shopId: z.string(), conversationId: z.string() }))
    .mutation(async ({ input }) => {
      await getDb()
        .collection("shops")
        .doc(input.shopId)
        .collection("conversations")
        .doc(input.conversationId)
        .update({
          status: "approved",
          updatedAt: FieldValue.serverTimestamp(),
        });
      return { success: true };
    }),

  /**
   * แก้ไขคำตอบ AI + บันทึกเป็น learned pattern
   */
  correct: protectedProcedure
    .input(
      z.object({
        shopId: z.string(),
        correction: CorrectionInputSchema,
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { shopId, correction } = input;

      // Update conversation
      await db
        .collection("shops")
        .doc(shopId)
        .collection("conversations")
        .doc(correction.conversationId)
        .update({
          status: "corrected",
          correctedReply: correction.correctedReply,
          updatedAt: FieldValue.serverTimestamp(),
        });

      // Save as learned pattern
      if (correction.saveAsExample) {
        const convDoc = await db
          .collection("shops")
          .doc(shopId)
          .collection("conversations")
          .doc(correction.conversationId)
          .get();

        const conv = convDoc.data();
        if (conv) {
          await db
            .collection("shops")
            .doc(shopId)
            .collection("learnedPatterns")
            .add({
              type: "corrected_reply",
              customerMessage: conv.customerMessage,
              aiDraftReply: conv.aiReply,
              finalReply: correction.correctedReply,
              context: "",
              usageCount: 0,
              score: 1,
              createdAt: FieldValue.serverTimestamp(),
            });
        }
      }

      return { success: true };
    }),

  /**
   * บันทึกเป็นตัวอย่างดี (featured)
   */
  feature: protectedProcedure
    .input(z.object({ shopId: z.string(), conversationId: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();

      await db
        .collection("shops")
        .doc(input.shopId)
        .collection("conversations")
        .doc(input.conversationId)
        .update({
          status: "featured",
          updatedAt: FieldValue.serverTimestamp(),
        });

      // Also save as approved learned pattern
      const convDoc = await db
        .collection("shops")
        .doc(input.shopId)
        .collection("conversations")
        .doc(input.conversationId)
        .get();

      const conv = convDoc.data();
      if (conv) {
        await db
          .collection("shops")
          .doc(input.shopId)
          .collection("learnedPatterns")
          .add({
            type: "featured",
            customerMessage: conv.customerMessage,
            aiDraftReply: conv.aiReply,
            finalReply: conv.correctedReply || conv.aiReply,
            context: "",
            usageCount: 0,
            score: 5,
            createdAt: FieldValue.serverTimestamp(),
          });
      }

      return { success: true };
    }),
});
