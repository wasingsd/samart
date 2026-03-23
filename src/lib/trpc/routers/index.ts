import { router } from "../server";
import { authRouter } from "./auth";
import { shopRouter } from "./shop";
import { menuRouter } from "./menu";

/**
 * Root Router — merge ทุก sub-router
 * เพิ่ม knowledge, chatLog, analytics, customers, ai ทีหลัง
 */
export const appRouter = router({
  auth: authRouter,
  shop: shopRouter,
  menu: menuRouter,
});

export type AppRouter = typeof appRouter;
