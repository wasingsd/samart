import { getDb } from "@/lib/firebase/admin";

/**
 * RAG (Retrieval-Augmented Generation)
 * ค้นหา knowledge docs ที่เกี่ยวข้องกับคำถามลูกค้า
 */

interface RetrievedDoc {
  id: string;
  type: string;
  title: string;
  content: string;
  score: number;
}

/**
 * Keyword search — fallback ที่ทำงานได้เลยโดยไม่ต้องมี embedding
 * ค้นจาก title + content ด้วย keyword matching
 */
export async function keywordSearch(
  shopId: string,
  query: string,
  topK: number = 5
): Promise<RetrievedDoc[]> {
  // Get all active knowledge docs
  const snapshot = await getDb()
    .collection("shops")
    .doc(shopId)
    .collection("knowledge")
    .where("isActive", "==", true)
    .get();

  if (snapshot.empty) return [];

  // Tokenize query into keywords
  const keywords = query
    .toLowerCase()
    .replace(/[?!.,]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 1);

  // Score each doc by keyword matches
  const scored: RetrievedDoc[] = snapshot.docs.map((doc) => {
    const data = doc.data();
    const text = `${data.title || ""} ${data.content || ""}`.toLowerCase();

    let score = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        score += 1;
        // Bonus for title match
        if ((data.title || "").toLowerCase().includes(keyword)) {
          score += 0.5;
        }
      }
    }

    return {
      id: doc.id,
      type: data.type || "freeform",
      title: data.title || "",
      content: data.content || "",
      score,
    };
  });

  // Return top-K by score
  return scored
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Retrieve context — combine results into a formatted string
 * ใช้ส่งเป็น context ให้ Gemini
 */
export async function retrieveContext(
  shopId: string,
  query: string,
  topK: number = 3
): Promise<string> {
  const docs = await keywordSearch(shopId, query, topK);

  if (docs.length === 0) {
    return "(ไม่พบข้อมูลที่เกี่ยวข้องใน knowledge base)";
  }

  return docs
    .map((doc, i) => `[${i + 1}] ${doc.type}: ${doc.title}\n${doc.content}`)
    .join("\n\n");
}

/**
 * Get dynamic context — real-time shop info
 * เวลาปัจจุบัน, สถานะร้าน, โปรโมชันที่กำลังใช้งาน
 */
export async function getDynamicContext(shopId: string): Promise<string> {
  const now = new Date();
  const thaiTime = now.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
  const dayOfWeek = now.toLocaleDateString("th-TH", { weekday: "long", timeZone: "Asia/Bangkok" });

  const parts: string[] = [
    `เวลาปัจจุบัน: ${thaiTime} (${dayOfWeek})`,
  ];

  // Get active promotions
  try {
    const promoSnap = await getDb()
      .collection("shops")
      .doc(shopId)
      .collection("knowledge")
      .where("type", "==", "promotion")
      .where("isActive", "==", true)
      .get();

    if (!promoSnap.empty) {
      const promos = promoSnap.docs.map((d) => d.data().content).join("; ");
      parts.push(`โปรโมชันที่กำลังใช้: ${promos}`);
    }
  } catch {
    // Ignore if Firestore not available
  }

  return parts.join("\n");
}

/**
 * Get learned patterns — ตัวอย่างการตอบที่เคยอนุมัติ/แก้ไข
 */
export async function getLearnedPatterns(
  shopId: string,
  topK: number = 3
): Promise<string> {
  try {
    const snapshot = await getDb()
      .collection("shops")
      .doc(shopId)
      .collection("learnedPatterns")
      .orderBy("score", "desc")
      .limit(topK)
      .get();

    if (snapshot.empty) return "";

    return snapshot.docs
      .map((doc) => {
        const d = doc.data();
        return `ลูกค้าถาม: "${d.customerMessage}"\nตอบ: "${d.finalReply}"`;
      })
      .join("\n\n");
  } catch {
    return "";
  }
}
