import { z } from "zod";

// ===========================================
// User
// ===========================================

export const UserRoleSchema = z.enum(["owner", "staff"]);

export const UserSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  photoURL: z.string().optional(),
  shopId: z.string().nullable(),
  role: UserRoleSchema,
  lineUserId: z.string().optional(),
  createdAt: z.any(), // Firestore Timestamp
  updatedAt: z.any(),
});

export type UserDoc = z.infer<typeof UserSchema>;

export const CreateUserSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string().min(1, "กรุณากรอกชื่อ"),
});

// ===========================================
// Shop
// ===========================================

export const DayHoursSchema = z.object({
  open: z.string(),
  close: z.string(),
  isOpen: z.boolean(),
});

export const BusinessHoursSchema = z.object({
  monday: DayHoursSchema,
  tuesday: DayHoursSchema,
  wednesday: DayHoursSchema,
  thursday: DayHoursSchema,
  friday: DayHoursSchema,
  saturday: DayHoursSchema,
  sunday: DayHoursSchema,
});

export const StyleProfileSchema = z.object({
  botName: z.string().min(1, "กรุณาตั้งชื่อ Bot"),
  formalityLevel: z.number().min(0).max(100),
  emojiUsage: z.enum(["none", "some", "lots"]),
  replyLength: z.enum(["short", "medium", "long"]),
  language: z.enum(["thai", "mixed", "english"]),
  openingGreeting: z.string(),
  closingPhrase: z.string(),
  guardrails: z.array(z.string()),
});

export const ShopCategorySchema = z.enum([
  "food",
  "retail",
  "service",
  // Legacy values for backward compat
  "restaurant",
  "cafe",
  "bakery",
  "other",
]);

export const ShopCreateSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อร้าน"),
  category: ShopCategorySchema,
  phone: z.string(),
  address: z.string(),
  logoURL: z.string().optional(),
  businessHours: BusinessHoursSchema,
  styleProfile: StyleProfileSchema,
});

export const ShopSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: ShopCategorySchema,
  phone: z.string(),
  address: z.string(),
  logoURL: z.string().optional(),
  businessHours: BusinessHoursSchema,
  ownerId: z.string(),
  lineChannelId: z.string().optional(),
  lineChannelSecret: z.string().optional(),
  lineAccessToken: z.string().optional(),
  lineConnected: z.boolean(),
  styleProfile: StyleProfileSchema,
  plan: z.enum(["trial", "starter", "pro", "business"]),
  trialEndsAt: z.any().optional(),
  
  // Team Management
  inviteCode: z.string().optional(),
  staffIds: z.array(z.string()).default([]),
  
  createdAt: z.any(),
  updatedAt: z.any(),
});

export type ShopDoc = z.infer<typeof ShopSchema>;
export type ShopCreateInput = z.infer<typeof ShopCreateSchema>;
export type StyleProfile = z.infer<typeof StyleProfileSchema>;
export type BusinessHours = z.infer<typeof BusinessHoursSchema>;

// ===========================================
// Menu Item
// ===========================================

export const MenuCreateSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อ"),
  price: z.number().positive("ราคาต้องมากกว่า 0"),
  category: z.string().min(1, "กรุณาเลือกหมวดหมู่"),
  description: z.string(),
  imageURL: z.string().optional(),
  allergens: z.array(z.string()).default([]),
  calories: z.number().optional(),
  tags: z.array(z.string()).default([]),
  inStock: z.boolean().default(true),
  sortOrder: z.number().default(0),
  // Retail-specific
  sku: z.string().optional(),
  unit: z.string().optional(),
  // Service-specific
  duration: z.number().optional(), // minutes
});

export const MenuItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  category: z.string(),
  description: z.string(),
  imageURL: z.string().optional(),
  allergens: z.array(z.string()).default([]),
  calories: z.number().optional(),
  tags: z.array(z.string()).default([]),
  inStock: z.boolean(),
  sortOrder: z.number(),
  sku: z.string().optional(),
  unit: z.string().optional(),
  duration: z.number().optional(),
  createdAt: z.any(),
  updatedAt: z.any(),
});

export type MenuItemDoc = z.infer<typeof MenuItemSchema>;
export type MenuCreateInput = z.infer<typeof MenuCreateSchema>;

// ===========================================
// Knowledge Base
// ===========================================

export const KnowledgeTypeSchema = z.enum([
  "menu",
  "faq",
  "policy",
  "promotion",
  "about",
  "freeform",
]);

export const KnowledgeCreateSchema = z.object({
  type: KnowledgeTypeSchema,
  title: z.string().min(1),
  content: z.string().min(1),
  keywords: z.array(z.string()),
  language: z.enum(["th", "en", "both"]).default("th"),
});

export const KnowledgeDocSchema = z.object({
  id: z.string(),
  type: KnowledgeTypeSchema,
  title: z.string(),
  content: z.string(),
  embedding: z.array(z.number()).optional(),
  keywords: z.array(z.string()),
  language: z.enum(["th", "en", "both"]),
  source: z.enum(["manual", "import", "auto", "onboarding"]),
  isActive: z.boolean(),
  createdAt: z.any(),
  updatedAt: z.any(),
});

export type KnowledgeDoc = z.infer<typeof KnowledgeDocSchema>;

export const KnowledgeHealthSchema = z.object({
  totalDocs: z.number(),
  menuCount: z.number(),
  faqCount: z.number(),
  policyCount: z.number(),
  promotionCount: z.number(),
  hasBusinessHours: z.boolean(),
  hasDeliveryInfo: z.boolean(),
  completionPercent: z.number(),
});

export type KnowledgeHealth = z.infer<typeof KnowledgeHealthSchema>;

// ===========================================
// Customer
// ===========================================

export const CustomerSegmentSchema = z.enum(["new", "regular", "vip", "dormant"]);

export const ChannelTypeSchema = z.enum(["line", "facebook", "instagram", "web"]);

export const ChannelInfoSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  pictureURL: z.string().optional(),
  connectedAt: z.any(),   // Firestore Timestamp
  lastContactAt: z.any(), // Firestore Timestamp
});

export const CustomerChannelsSchema = z.object({
  line: ChannelInfoSchema.optional(),
  facebook: ChannelInfoSchema.optional(),
  instagram: ChannelInfoSchema.optional(),
});

export const CustomerSchema = z.object({
  phone: z.string(),
  displayName: z.string(),
  pictureURL: z.string().optional(),
  channels: CustomerChannelsSchema,
  source: z.enum(["line", "facebook", "instagram", "web", "manual"]),
  segment: CustomerSegmentSchema,
  totalSpent: z.number(),
  orderCount: z.number(),
  lastVisitAt: z.any().nullable(),
  preferences: z.array(z.string()),
  notes: z.string(),
  firstContactAt: z.any(),
  updatedAt: z.any(),
});

export type CustomerDoc = z.infer<typeof CustomerSchema>;
export type ChannelInfo = z.infer<typeof ChannelInfoSchema>;
export type CustomerChannels = z.infer<typeof CustomerChannelsSchema>;

export const CustomerCreateSchema = z.object({
  phone: z.string().min(9, "กรุณากรอกเบอร์โทร"),
  displayName: z.string().min(1, "กรุณากรอกชื่อ"),
  notes: z.string().optional(),
});

export type CustomerCreateInput = z.infer<typeof CustomerCreateSchema>;

// ===========================================
// Order
// ===========================================

export const OrderItemSchema = z.object({
  menuItemId: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
  options: z.string().optional(),
});

export const OrderSchema = z.object({
  id: z.string(),
  customerId: z.string(), // phone or autoId — links to customer doc
  items: z.array(OrderItemSchema),
  totalAmount: z.number(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
  source: z.enum(["line_chat", "facebook", "instagram", "manual", "public_menu"]),
  notes: z.string().optional(),
  createdAt: z.any(),
  updatedAt: z.any(),
});

export type OrderDoc = z.infer<typeof OrderSchema>;

// ===========================================
// Learned Pattern
// ===========================================

export const LearnedPatternSchema = z.object({
  id: z.string(),
  type: z.enum(["approved_reply", "corrected_reply", "featured"]),
  customerMessage: z.string(),
  aiDraftReply: z.string(),
  finalReply: z.string(),
  context: z.string(),
  embedding: z.array(z.number()).optional(),
  usageCount: z.number(),
  score: z.number(),
  createdAt: z.any(),
});

export type LearnedPatternDoc = z.infer<typeof LearnedPatternSchema>;

// ===========================================
// Conversation (Chat Log)
// ===========================================

export const ConversationSchema = z.object({
  id: z.string(),
  customerId: z.string(), // phone or autoId — links to customer doc
  customerName: z.string(),
  customerPicture: z.string().optional(),
  customerMessage: z.string(),
  aiReply: z.string(),
  channel: ChannelTypeSchema, // line | facebook | instagram | web
  intent: z.string().optional(),
  ragDocsUsed: z.number().optional(),
  status: z.enum(["pending", "approved", "corrected", "featured"]),
  correctedReply: z.string().optional(),
  createdAt: z.any(),
});

export type ConversationDoc = z.infer<typeof ConversationSchema>;

export const CorrectionInputSchema = z.object({
  conversationId: z.string(),
  correctedReply: z.string().min(1, "กรุณากรอกคำตอบที่ถูกต้อง"),
  addToKnowledge: z.boolean().default(false),
  saveAsExample: z.boolean().default(true),
});
