import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Protected procedure — ต้อง login ก่อนถึงจะเรียกได้
 * ถ้าไม่มี user → throw UNAUTHORIZED
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "กรุณาเข้าสู่ระบบก่อน",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // guaranteed non-null
    },
  });
});
