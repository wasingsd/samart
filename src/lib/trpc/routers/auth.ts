import { z } from "zod";
import { router, protectedProcedure } from "../server";
import { getDb } from "@/lib/firebase/admin";
import { CreateUserSchema } from "@/types";
import { FieldValue } from "firebase-admin/firestore";

export const authRouter = router({
  /**
   * สร้าง user document หลัง Firebase Auth register
   */
  createUserDoc: protectedProcedure
    .input(CreateUserSchema)
    .mutation(async ({ input }) => {
      const userRef = getDb().collection("users").doc(input.uid);
      const userData: Record<string, unknown> = {
        uid: input.uid,
        email: input.email,
        displayName: input.displayName,
        shopId: null,
        role: "owner",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      await userRef.set(userData);
      return { uid: input.uid, email: input.email, displayName: input.displayName };
    }),

  /**
   * ดึงข้อมูล user ปัจจุบัน
   */
  getMe: protectedProcedure.query(async ({ ctx }) => {
    const userDoc = await getDb().collection("users").doc(ctx.user.uid).get();
    if (!userDoc.exists) {
      return null;
    }
    return { id: userDoc.id, ...userDoc.data() };
  }),

  /**
   * เชื่อม LINE Login
   */
  connectLine: protectedProcedure
    .input(z.object({ lineUserId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await getDb().collection("users").doc(ctx.user.uid).update({
        lineUserId: input.lineUserId,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { success: true };
    }),
});
