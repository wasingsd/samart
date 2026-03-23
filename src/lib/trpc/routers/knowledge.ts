import { z } from "zod";
import { router, protectedProcedure } from "../server";
import { getDb } from "@/lib/firebase/admin";
import { KnowledgeCreateSchema } from "@/types";
import { FieldValue } from "firebase-admin/firestore";

export const knowledgeRouter = router({
  /**
   * ดึงรายการ knowledge docs ทั้งหมดของร้าน
   */
  list: protectedProcedure
    .input(z.object({ shopId: z.string() }))
    .query(async ({ input }) => {
      const snapshot = await getDb()
        .collection("shops")
        .doc(input.shopId)
        .collection("knowledge")
        .orderBy("updatedAt", "desc")
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }),

  /**
   * ดึง health stats ของ knowledge base
   */
  health: protectedProcedure
    .input(z.object({ shopId: z.string() }))
    .query(async ({ input }) => {
      const snapshot = await getDb()
        .collection("shops")
        .doc(input.shopId)
        .collection("knowledge")
        .where("isActive", "==", true)
        .get();

      let menuCount = 0;
      let faqCount = 0;
      let policyCount = 0;
      let promotionCount = 0;
      let hasBusinessHours = false;
      let hasDeliveryInfo = false;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        switch (data.type) {
          case "menu": menuCount++; break;
          case "faq": faqCount++; break;
          case "policy":
            policyCount++;
            if (data.title?.includes("จัดส่ง") || data.title?.includes("delivery")) {
              hasDeliveryInfo = true;
            }
            break;
          case "promotion": promotionCount++; break;
          case "about":
            if (data.title?.includes("เวลา") || data.title?.includes("เปิด")) {
              hasBusinessHours = true;
            }
            break;
        }
      });

      const totalDocs = snapshot.size;
      // Calculate completion: menu(30%) + faq(25%) + policy(15%) + promo(10%) + hours(10%) + delivery(10%)
      const menuScore = Math.min(menuCount / 5, 1) * 30;
      const faqScore = Math.min(faqCount / 3, 1) * 25;
      const policyScore = Math.min(policyCount / 2, 1) * 15;
      const promoScore = promotionCount > 0 ? 10 : 0;
      const hoursScore = hasBusinessHours ? 10 : 0;
      const deliveryScore = hasDeliveryInfo ? 10 : 0;
      const completionPercent = Math.round(menuScore + faqScore + policyScore + promoScore + hoursScore + deliveryScore);

      return {
        totalDocs,
        menuCount,
        faqCount,
        policyCount,
        promotionCount,
        hasBusinessHours,
        hasDeliveryInfo,
        completionPercent,
      };
    }),

  /**
   * เพิ่ม knowledge doc ใหม่
   */
  create: protectedProcedure
    .input(z.object({
      shopId: z.string(),
      data: KnowledgeCreateSchema,
    }))
    .mutation(async ({ input }) => {
      // Check knowledge doc quota
      const { enforceQuota } = await import("@/lib/billing/guard");
      await enforceQuota(input.shopId, "knowledge_doc");

      const docRef = getDb()
        .collection("shops")
        .doc(input.shopId)
        .collection("knowledge")
        .doc();

      const docData = {
        ...input.data,
        id: docRef.id,
        source: "manual" as const,
        isActive: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      await docRef.set(docData);
      return { id: docRef.id };
    }),

  /**
   * อัปเดต knowledge doc
   */
  update: protectedProcedure
    .input(z.object({
      shopId: z.string(),
      docId: z.string(),
      data: KnowledgeCreateSchema.partial(),
    }))
    .mutation(async ({ input }) => {
      await getDb()
        .collection("shops")
        .doc(input.shopId)
        .collection("knowledge")
        .doc(input.docId)
        .update({
          ...input.data,
          updatedAt: FieldValue.serverTimestamp(),
        });
      return { success: true };
    }),

  /**
   * ลบ knowledge doc (soft delete — set isActive=false)
   */
  delete: protectedProcedure
    .input(z.object({ shopId: z.string(), docId: z.string() }))
    .mutation(async ({ input }) => {
      await getDb()
        .collection("shops")
        .doc(input.shopId)
        .collection("knowledge")
        .doc(input.docId)
        .update({
          isActive: false,
          updatedAt: FieldValue.serverTimestamp(),
        });
      return { success: true };
    }),

  /**
   * Freeform: รับ text ยาวแล้วบันทึกเป็น knowledge type "freeform"
   */
  addFreeform: protectedProcedure
    .input(z.object({
      shopId: z.string(),
      content: z.string().min(5, "กรุณากรอกข้อมูลอย่างน้อย 5 ตัวอักษร"),
    }))
    .mutation(async ({ input }) => {
      const docRef = getDb()
        .collection("shops")
        .doc(input.shopId)
        .collection("knowledge")
        .doc();

      await docRef.set({
        id: docRef.id,
        type: "freeform",
        title: input.content.substring(0, 60) + (input.content.length > 60 ? "..." : ""),
        content: input.content,
        keywords: [],
        language: "th",
        source: "manual",
        isActive: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { id: docRef.id };
    }),
});
