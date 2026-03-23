import { router } from "../server";
import { authRouter } from "./auth";
import { shopRouter } from "./shop";
import { menuRouter } from "./menu";
import { knowledgeRouter } from "./knowledge";
import { chatLogRouter } from "./chatLog";
import { analyticsRouter } from "./analytics";
import { customerRouter } from "./customer";
import { contentRouter } from "./content";
import { billingRouter } from "./billing";
import { aiRouter } from "./ai";

/**
 * SAMART Root Router — 10 modules
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
  billing: billingRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
