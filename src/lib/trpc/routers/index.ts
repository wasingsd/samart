import { router } from "../server";
import { authRouter } from "./auth";
import { shopRouter } from "./shop";
import { menuRouter } from "./menu";
import { knowledgeRouter } from "./knowledge";
import { chatLogRouter } from "./chatLog";
import { analyticsRouter } from "./analytics";
import { customerRouter } from "./customer";
import { contentRouter } from "./content";

/**
 * Root Router — ครบทุก sub-router
 */
export const appRouter = router({
  auth: authRouter,
  shop: shopRouter,
  menu: menuRouter,
  knowledge: knowledgeRouter,
  chatLog: chatLogRouter,
  analytics: analyticsRouter,
  customer: customerRouter,
  content: contentRouter,
});

export type AppRouter = typeof appRouter;
