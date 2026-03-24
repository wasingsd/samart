import { z } from "zod";
import { router, protectedProcedure } from "../server";
import { getDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { CustomerCreateSchema, ChannelTypeSchema } from "@/types";

export const customerRouter = router({
  /**
   * ดึงรายการลูกค้า (filterable by segment, searchable by phone/name)
   */
  list: protectedProcedure
    .input(
      z.object({
        shopId: z.string(),
        segment: z.enum(["all", "vip", "regular", "new", "dormant"]).default("all"),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      let query = getDb()
        .collection("shops")
        .doc(input.shopId)
        .collection("customers")
        .orderBy("updatedAt", "desc")
        .limit(input.limit);

      if (input.segment !== "all") {
        query = query.where("segment", "==", input.segment);
      }

      const snapshot = await query.get();

      let results = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Client-side search (phone, displayName, notes, channel displayNames)
      if (input.search) {
        const s = input.search.toLowerCase();
        results = results.filter((c) => {
          const data = c as Record<string, unknown>;
          const phone = ((data.phone as string) || "").toLowerCase();
          const name = ((data.displayName as string) || "").toLowerCase();
          const notes = ((data.notes as string) || "").toLowerCase();

          // Search in channel display names
          const channels = (data.channels || {}) as Record<string, { displayName?: string }>;
          const channelMatch = Object.values(channels).some(
            (ch) => ch?.displayName?.toLowerCase().includes(s)
          );

          return phone.includes(s) || name.includes(s) || notes.includes(s) || channelMatch;
        });
      }

      return results;
    }),

  /**
   * นับจำนวนลูกค้าแยกตาม segment
   */
  segmentCounts: protectedProcedure
    .input(z.object({ shopId: z.string() }))
    .query(async ({ input }) => {
      const snapshot = await getDb()
        .collection("shops")
        .doc(input.shopId)
        .collection("customers")
        .get();

      const counts = { all: 0, vip: 0, regular: 0, new: 0, dormant: 0 };
      snapshot.docs.forEach((doc) => {
        const segment = doc.data().segment as string;
        counts.all++;
        if (segment in counts) {
          counts[segment as keyof typeof counts]++;
        }
      });
      return counts;
    }),

  /**
   * ดึงข้อมูล customer profile (รวม order history + conversations)
   */
  getProfile: protectedProcedure
    .input(z.object({ shopId: z.string(), customerId: z.string() }))
    .query(async ({ input }) => {
      const customerDoc = await getDb()
        .collection("shops")
        .doc(input.shopId)
        .collection("customers")
        .doc(input.customerId)
        .get();

      if (!customerDoc.exists) return null;

      // Recent orders — ค้นหาด้วย customerId
      const ordersSnap = await getDb()
        .collection("shops")
        .doc(input.shopId)
        .collection("orders")
        .where("customerId", "==", input.customerId)
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();

      // Recent conversations — ค้นหาด้วย customerId
      const convsSnap = await getDb()
        .collection("shops")
        .doc(input.shopId)
        .collection("conversations")
        .where("customerId", "==", input.customerId)
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();

      return {
        customer: { id: customerDoc.id, ...customerDoc.data() },
        recentOrders: ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        recentConversations: convsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      };
    }),

  /**
   * สร้างลูกค้าใหม่ — เจ้าของร้านเพิ่มเอง (manual)
   * ใช้ phone เป็น document ID
   */
  create: protectedProcedure
    .input(
      z.object({
        shopId: z.string(),
        customer: CustomerCreateSchema,
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { shopId, customer } = input;

      // Normalize phone: remove spaces, dashes
      const phone = customer.phone.replace(/[\s-]/g, "");

      // Check duplicate phone
      const existing = await db
        .collection("shops")
        .doc(shopId)
        .collection("customers")
        .doc(phone)
        .get();

      if (existing.exists) {
        throw new Error("ลูกค้าเบอร์นี้มีอยู่แล้ว");
      }

      const now = FieldValue.serverTimestamp();
      await db
        .collection("shops")
        .doc(shopId)
        .collection("customers")
        .doc(phone)
        .set({
          phone,
          displayName: customer.displayName,
          pictureURL: "",
          channels: {},
          source: "manual",
          segment: "new",
          totalSpent: 0,
          orderCount: 0,
          lastVisitAt: null,
          preferences: [],
          notes: customer.notes || "",
          firstContactAt: now,
          updatedAt: now,
        });

      return { success: true, id: phone };
    }),

  /**
   * สร้างหรืออัปเดตลูกค้าจากช่องทาง chat (เรียกจาก webhook)
   * ค้นหาด้วย channel.userId → ถ้าเจอ update → ถ้าไม่เจอ สร้าง auto-ID doc
   */
  upsertFromChannel: protectedProcedure
    .input(
      z.object({
        shopId: z.string(),
        channel: ChannelTypeSchema,
        userId: z.string(),
        displayName: z.string(),
        pictureURL: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { shopId, channel, userId, displayName, pictureURL } = input;
      const now = FieldValue.serverTimestamp();

      // Search for existing customer with this channel userId
      const snapshot = await db
        .collection("shops")
        .doc(shopId)
        .collection("customers")
        .where(`channels.${channel}.userId`, "==", userId)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        // Found — update lastContactAt and display info
        const doc = snapshot.docs[0];
        const updateData: Record<string, unknown> = {
          [`channels.${channel}.lastContactAt`]: now,
          [`channels.${channel}.displayName`]: displayName,
          updatedAt: now,
        };
        if (pictureURL) {
          updateData[`channels.${channel}.pictureURL`] = pictureURL;
        }

        await doc.ref.update(updateData);
        return { success: true, customerId: doc.id, isNew: false };
      }

      // Not found — create new customer with auto-generated ID
      const newRef = db
        .collection("shops")
        .doc(shopId)
        .collection("customers")
        .doc(); // auto-ID

      await newRef.set({
        phone: "",
        displayName,
        pictureURL: pictureURL || "",
        channels: {
          [channel]: {
            userId,
            displayName,
            pictureURL: pictureURL || "",
            connectedAt: now,
            lastContactAt: now,
          },
        },
        source: channel,
        segment: "new",
        totalSpent: 0,
        orderCount: 0,
        lastVisitAt: null,
        preferences: [],
        notes: "",
        firstContactAt: now,
        updatedAt: now,
      });

      return { success: true, customerId: newRef.id, isNew: true };
    }),

  /**
   * อัปเดต customer — segment, notes, phone, preferences
   */
  update: protectedProcedure
    .input(
      z.object({
        shopId: z.string(),
        customerId: z.string(),
        data: z.object({
          phone: z.string().optional(),
          displayName: z.string().optional(),
          segment: z.enum(["new", "regular", "vip", "dormant"]).optional(),
          notes: z.string().optional(),
          preferences: z.array(z.string()).optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const updateData: Record<string, unknown> = {
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (input.data.phone !== undefined) updateData.phone = input.data.phone;
      if (input.data.displayName !== undefined) updateData.displayName = input.data.displayName;
      if (input.data.segment) updateData.segment = input.data.segment;
      if (input.data.notes !== undefined) updateData.notes = input.data.notes;
      if (input.data.preferences) updateData.preferences = input.data.preferences;

      await db
        .collection("shops")
        .doc(input.shopId)
        .collection("customers")
        .doc(input.customerId)
        .update(updateData);

      return { success: true };
    }),

  /**
   * รวมลูกค้า 2 doc เป็น 1 (merge)
   * เก็บ doc primaryId เป็นหลัก + รวม channels จาก secondaryId
   */
  merge: protectedProcedure
    .input(
      z.object({
        shopId: z.string(),
        primaryId: z.string(),   // doc ที่จะเก็บไว้
        secondaryId: z.string(), // doc ที่จะลบ
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { shopId, primaryId, secondaryId } = input;

      const [primaryDoc, secondaryDoc] = await Promise.all([
        db.collection("shops").doc(shopId).collection("customers").doc(primaryId).get(),
        db.collection("shops").doc(shopId).collection("customers").doc(secondaryId).get(),
      ]);

      if (!primaryDoc.exists || !secondaryDoc.exists) {
        throw new Error("ไม่พบข้อมูลลูกค้าที่ต้องการรวม");
      }

      const primary = primaryDoc.data()!;
      const secondary = secondaryDoc.data()!;

      // Merge channels: keep primary's channels, add missing from secondary
      const mergedChannels = { ...(primary.channels || {}) };
      const secondaryChannels = secondary.channels || {};
      for (const [ch, info] of Object.entries(secondaryChannels)) {
        if (!mergedChannels[ch] && info) {
          mergedChannels[ch] = info;
        }
      }

      // Merge stats
      const mergedData: Record<string, unknown> = {
        channels: mergedChannels,
        totalSpent: (primary.totalSpent || 0) + (secondary.totalSpent || 0),
        orderCount: (primary.orderCount || 0) + (secondary.orderCount || 0),
        updatedAt: FieldValue.serverTimestamp(),
      };

      // If primary has no phone but secondary does, use secondary's
      if (!primary.phone && secondary.phone) {
        mergedData.phone = secondary.phone;
      }

      // Merge preferences (deduplicate)
      const mergedPrefs = [...new Set([
        ...(primary.preferences || []),
        ...(secondary.preferences || []),
      ])];
      mergedData.preferences = mergedPrefs;

      // Merge notes
      if (secondary.notes && secondary.notes !== primary.notes) {
        mergedData.notes = [primary.notes, secondary.notes].filter(Boolean).join("\n");
      }

      // Update primary doc
      await primaryDoc.ref.update(mergedData);

      // Re-link orders from secondary to primary
      const ordersSnap = await db
        .collection("shops")
        .doc(shopId)
        .collection("orders")
        .where("customerId", "==", secondaryId)
        .get();

      const batch = db.batch();
      ordersSnap.docs.forEach((doc) => {
        batch.update(doc.ref, { customerId: primaryId });
      });

      // Re-link conversations from secondary to primary
      const convsSnap = await db
        .collection("shops")
        .doc(shopId)
        .collection("conversations")
        .where("customerId", "==", secondaryId)
        .get();

      convsSnap.docs.forEach((doc) => {
        batch.update(doc.ref, { customerId: primaryId });
      });

      // Delete secondary doc
      batch.delete(secondaryDoc.ref);

      await batch.commit();

      return { success: true, mergedId: primaryId };
    }),
});
