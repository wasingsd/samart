import { generateFlash } from "./gemini";
import { getDb } from "@/lib/firebase/admin";

/**
 * Auto Knowledge Builder
 * แปลงข้อมูลเมนู + onboarding → knowledge docs อัตโนมัติ
 */

/**
 * Build knowledge docs from all menu items
 * แปลงแต่ละเมนูเป็น knowledge doc ที่ AI ค้นหาได้
 */
export async function buildFromMenu(shopId: string): Promise<{ created: number }> {
  const db = getDb();

  // Get all menu items
  const menuSnap = await db
    .collection("shops").doc(shopId).collection("menuItems").get();

  if (menuSnap.empty) return { created: 0 };

  // Group by category
  const categories: Record<string, { name: string; price: number; description?: string }[]> = {};

  menuSnap.docs.forEach((doc) => {
    const d = doc.data();
    const cat = d.category || "ทั่วไป";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push({
      name: d.name,
      price: d.price,
      description: d.description,
    });
  });

  let created = 0;

  // Create a knowledge doc for each category
  for (const [category, items] of Object.entries(categories)) {
    const itemList = items
      .map((i) => `- ${i.name}: ${i.price} บาท${i.description ? ` (${i.description})` : ""}`)
      .join("\n");

    // Use Gemini to create natural language description
    let content: string;
    try {
      content = await generateFlash(
        "สรุปเมนูร้านค้าเป็นภาษาธรรมชาติ สั้นกระชับ ให้ AI chatbot ใช้ตอบลูกค้าได้ ไม่ต้องมี prefix หรือ suffix",
        `หมวด: ${category}\n${itemList}`
      );
    } catch {
      content = `หมวด ${category}:\n${itemList}`;
    }

    const docRef = db.collection("shops").doc(shopId).collection("knowledge").doc();
    await docRef.set({
      id: docRef.id,
      type: "menu",
      title: `เมนูหมวด ${category}`,
      content,
      keywords: [category, ...items.map((i) => i.name)],
      language: "th",
      source: "auto",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    created++;
  }

  return { created };
}

/**
 * Build knowledge docs from shop onboarding data
 * สร้าง docs จากข้อมูลร้าน: เวลาเปิดปิด, ที่อยู่, เบอร์โทร
 */
export async function buildFromOnboarding(shopId: string): Promise<{ created: number }> {
  const db = getDb();
  const shopDoc = await db.collection("shops").doc(shopId).get();

  if (!shopDoc.exists) return { created: 0 };

  const shop = shopDoc.data()!;
  let created = 0;

  // Business hours doc
  if (shop.businessHours) {
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const thaiDays = ["จันทร์", "อังคาร", "พุธ", "พฤหัส", "ศุกร์", "เสาร์", "อาทิตย์"];

    const hours = days.map((d, i) => {
      const h = shop.businessHours[d];
      if (!h || h.closed) return `${thaiDays[i]}: ปิด`;
      return `${thaiDays[i]}: ${h.open} - ${h.close}`;
    }).join("\n");

    const docRef = db.collection("shops").doc(shopId).collection("knowledge").doc();
    await docRef.set({
      id: docRef.id,
      type: "about",
      title: "เวลาเปิด-ปิดร้าน",
      content: `ร้าน ${shop.name} เวลาเปิดให้บริการ:\n${hours}`,
      keywords: ["เวลา", "เปิด", "ปิด", "ชั่วโมง", "วันหยุด"],
      language: "th",
      source: "auto",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    created++;
  }

  // Contact info doc
  if (shop.phone || shop.address) {
    const docRef = db.collection("shops").doc(shopId).collection("knowledge").doc();
    await docRef.set({
      id: docRef.id,
      type: "about",
      title: "ข้อมูลติดต่อร้าน",
      content: [
        shop.phone ? `โทรศัพท์: ${shop.phone}` : "",
        shop.address ? `ที่อยู่: ${shop.address}` : "",
        shop.name ? `ชื่อร้าน: ${shop.name}` : "",
      ].filter(Boolean).join("\n"),
      keywords: ["ติดต่อ", "โทร", "ที่อยู่", "แผนที่", "สถานที่"],
      language: "th",
      source: "auto",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    created++;
  }

  return { created };
}
