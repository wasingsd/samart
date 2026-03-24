# 🧬 SAMART — Per-Shop AI Personalization Architecture

> คำถามหลัก: เมื่อมีลูกค้า subscribe จริง ทำยังไงให้ AI "รู้จัก" ร้านนั้นๆ โดยเฉพาะ?

---

## ข้อเท็จจริงสำคัญ

```
❌ เราไม่ได้ fine-tune model ใหม่ต่อร้าน (ราคาหลักแสน/ร้าน ไม่คุ้ม)
✅ เราทำให้ Gemini "รู้จัก" ร้านผ่าน 4 ชั้น ที่ต้นทุนแทบ 0
```

---

## 4 Layers of Shop Intelligence

```
┌──────────────────────────────────────────────────────────┐
│                  AI Request ทุกครั้ง                      │
│                                                          │
│  Layer 4: Fine-tuning (Business tier เท่านั้น, Phase 3) │
│  ─────────────────────────────────────────────────────── │
│  Layer 3: Learned Patterns (จาก interaction history)     │
│  ─────────────────────────────────────────────────────── │
│  Layer 2: Dynamic Context (real-time ข้อมูลปัจจุบัน)    │
│  ─────────────────────────────────────────────────────── │
│  Layer 1: Static Knowledge Base (RAG — ทุก tier)         │
└──────────────────────────────────────────────────────────┘
```

---

## Layer 1: Static Knowledge Base (RAG)

**ทุก plan ได้ใช้ตั้งแต่วันแรก**

### คือ อะไร?
ข้อมูลพื้นฐานของร้านที่ AI ต้องรู้: เมนู, FAQ, นโยบาย, เวลาเปิด-ปิด, ที่อยู่ ทั้งหมดนี้เก็บใน Firestore และถูก embed เป็น vector เพื่อ semantic search

### โครงสร้างข้อมูล (knowledgeBase collection)

```typescript
// shops/{shopId}/knowledgeBase/{docId}
interface KnowledgeDocument {
  id: string
  type: 'menu' | 'faq' | 'policy' | 'promotion' | 'about'
  title: string
  content: string          // ข้อความที่จะใส่ใน context
  embedding: number[]      // vector จาก text-embedding-004
  keywords: string[]       // for keyword fallback search
  language: 'th' | 'en' | 'both'
  updatedAt: Timestamp
}
```

### ตัวอย่างข้อมูลที่เก็บ

```typescript
// เมนู
{
  type: 'menu',
  title: 'กาแฟ Signature',
  content: `
    ชื่อ: กาแฟ Signature
    ราคา: 85 บาท (เย็น), 75 บาท (ร้อน)
    วัตถุดิบ: เมล็ดกาแฟ Colombia 100%, นมสด
    แคลอรี: 180 kcal
    แพ้อาหาร: มีนม ไม่มีกลูเตน
    หมายเหตุ: ขายดีที่สุด, เพิ่มหวานได้ไม่มีค่าใช้จ่าย
    สถานะ: มีอยู่
  `
}

// FAQ
{
  type: 'faq',
  title: 'จอดรถที่ไหน',
  content: `
    ที่จอดรถ: ลานจอดด้านหลังร้าน ฟรี 2 ชั่วโมง
    ทางเข้า: ซอยข้างร้านสะดวกที่สุด
    รถไฟฟ้า: ไม่มีบริการรับส่ง
  `
}

// Policy
{
  type: 'policy',
  title: 'นโยบายการคืนสินค้า',
  content: `
    คืนได้ภายใน 15 นาทีหลังรับสินค้า
    กรณีสินค้าผิดหรือมีปัญหา: คืนได้ทันที ไม่มีค่าใช้จ่าย
    กรณีเปลี่ยนใจ: ไม่รับคืน
  `
}
```

### RAG Process (ทุกครั้งที่ลูกค้าส่งข้อความ)

```typescript
async function retrieveContext(shopId: string, query: string): Promise<string> {
  // 1. Embed คำถามลูกค้า
  const queryEmbedding = await embedText(query)  // text-embedding-004

  // 2. หาเอกสารที่เกี่ยวข้องที่สุด (top 3)
  const docs = await semanticSearch(shopId, queryEmbedding, topK=3)

  // 3. Fallback: keyword search ถ้า semantic score ต่ำเกิน
  if (docs[0].score < 0.75) {
    const keywordDocs = await keywordSearch(shopId, query)
    docs.push(...keywordDocs)
  }

  // 4. Format เป็น context string
  return formatContext(docs)
}
```

### เมื่อร้านค้า subscribe: Onboarding Knowledge Builder

```typescript
// Step 1: สมัครเสร็จ → trigger auto-build
async function buildInitialKnowledge(shopId: string) {
  const shop = await getShop(shopId)

  // Build จาก structured data ที่กรอกตอน onboarding
  const documents: KnowledgeDocument[] = [
    buildShopInfoDoc(shop),
    buildBusinessHoursDoc(shop.businessHours),
    buildLocationDoc(shop.address),
    ...shop.menuItems.map(buildMenuDoc),
    ...shop.faqs.map(buildFAQDoc),
    ...buildDefaultPolicies(shop.category),
  ]

  // Embed และบันทึกทั้งหมด (batch)
  await Promise.all(documents.map(doc => embedAndSave(shopId, doc)))
}

// Step 2: Auto-rebuild เมื่อข้อมูลเปลี่ยน
// เมื่อ shop อัปเดตเมนู → rebuild menu embeddings เฉพาะส่วนนั้น
onMenuUpdate(shopId, async (updatedItem) => {
  await rebuildEmbedding(shopId, 'menu', updatedItem)
})
```

---

## Layer 2: Dynamic Context (Real-time)

**ข้อมูลที่เปลี่ยนแปลงบ่อย inject เข้าทุก AI call แบบ real-time**

ไม่ต้องใช้ embedding เพราะข้อมูลมีน้อยและเปลี่ยนทุกวัน inject ตรงๆ ใน system prompt

```typescript
async function buildDynamicContext(shopId: string): Promise<string> {
  const [inventory, promotions, todayStats] = await Promise.all([
    getLowStockAlerts(shopId),
    getCurrentPromotions(shopId),
    getTodayRevenue(shopId),
  ])

  return `
    === สถานะวันนี้ (${formatDate(new Date())}) ===
    สินค้าหมด: ${inventory.outOfStock.map(i => i.name).join(', ') || 'ไม่มี'}
    สินค้าใกล้หมด: ${inventory.lowStock.map(i => i.name).join(', ') || 'ไม่มี'}

    โปรโมชันที่ใช้ได้ตอนนี้:
    ${promotions.map(p => `- ${p.title}: ${p.description} (หมดอายุ ${p.endsAt})`).join('\n')}

    เวลาปัจจุบัน: ${formatTime(new Date())}
    ร้านเปิด/ปิด: ${isOpen(shop.businessHours) ? 'เปิดอยู่' : 'ปิดแล้ว'}
  `
}
```

---

## Layer 3: Learned Patterns (Interaction History)

**AI เรียนรู้จาก pattern ของร้านจริงๆ โดยไม่ต้อง fine-tune**

### หลักการ: Few-shot Learning จากข้อมูลจริง

ทุกครั้งที่เจ้าของร้าน **แก้ไข** คำตอบ AI หรือ **กด approve** คำตอบดีๆ → ระบบเก็บเป็น few-shot examples

```typescript
// shops/{shopId}/learnedPatterns/{patternId}
interface LearnedPattern {
  type: 'approved_reply' | 'corrected_reply' | 'preferred_style'
  customerMessage: string      // สิ่งที่ลูกค้าพูด
  aiDraftReply: string         // AI ตอบแรก
  finalReply: string           // ที่เจ้าของร้าน approve/แก้ไข
  context: string              // บริบทของการสนทนา
  usageCount: number           // ถูกดึงมาใช้กี่ครั้งแล้ว
  score: number                // effectiveness score
  createdAt: Timestamp
}
```

### วิธี inject Few-shot ใน Prompt

```typescript
async function buildFewShotExamples(shopId: string, query: string): Promise<string> {
  // ดึง pattern ที่คล้ายกับ query ที่สุด (semantic search)
  const patterns = await findSimilarPatterns(shopId, query, topK=3)

  if (patterns.length === 0) return ''

  return `
    === ตัวอย่างการตอบที่เหมาะกับร้านนี้ ===
    ${patterns.map(p => `
    ลูกค้าถาม: "${p.customerMessage}"
    ตอบ: "${p.finalReply}"
    `).join('\n')}

    กรุณาตอบในสไตล์เดียวกัน
  `
}
```

### Pattern Collection Flow

```
ลูกค้าส่งข้อความ
    │
    ▼
AI ตอบ (draft)
    │
    ├──[เจ้าของร้านไม่แก้ไข]──▶ บันทึกเป็น "approved_reply" score +1
    │
    └──[เจ้าของร้านแก้ไข]────▶ บันทึก draft + final เป็น "corrected_reply"
                                ใช้ final reply เป็น ground truth
```

### Auto-learned Style Preferences

```typescript
// วิเคราะห์ reply ที่เจ้าของร้าน approve บ่อยๆ
// สรุปเป็น "style guidelines" ของร้านนั้น
interface ShopStyleProfile {
  preferredTone: 'formal' | 'casual' | 'fun'
  usesEmoji: boolean
  avgReplyLength: 'short' | 'medium' | 'long'
  endingStyle: string    // "ขอบคุณมากนะคะ 😊" | "ยินดีให้บริการครับ"
  languageMix: 'thai-only' | 'thai-english-mix'
}
```

---

## Layer 4: Fine-tuning (Business Tier — Phase 3)

**เฉพาะลูกค้า Business plan หลังใช้งาน 6 เดือนขึ้นไป**

### เมื่อไหรถึงจะ fine-tune?

| เงื่อนไข | ค่า |
|---------|-----|
| จำนวน approved conversations | > 500 ครั้ง |
| ระยะเวลาใช้งาน | > 6 เดือน |
| Plan | Business เท่านั้น |

### วิธีที่ใช้: Gemini Tuned Models API

```typescript
// สร้าง dataset จาก learned patterns ของร้าน
async function prepareTuningDataset(shopId: string): Promise<TuningExample[]> {
  const patterns = await getHighScorePatterns(shopId, minScore=4)

  return patterns.map(p => ({
    input: {
      role: 'user',
      parts: [{ text: buildTuningInput(p) }]
    },
    output: {
      role: 'model',
      parts: [{ text: p.finalReply }]
    }
  }))
}

// Submit tuning job ไปยัง Gemini
async function startFineTuning(shopId: string) {
  const dataset = await prepareTuningDataset(shopId)

  const tuningJob = await geminiClient.tunedModels.create({
    baseModel: 'models/gemini-1.5-flash-001',
    displayName: `samart-shop-${shopId}`,
    tuningTask: {
      trainingData: {
        examples: { examples: dataset }
      },
      hyperparameters: {
        epochCount: 5,
        batchSize: 4,
        learningRate: 0.001
      }
    }
  })

  // บันทึก model ID ใน shop document
  await updateShop(shopId, {
    tunedModelId: tuningJob.name,
    tuningStatus: 'training'
  })
}
```

### ต้นทุน Fine-tuning

```
Gemini 1.5 Flash Fine-tuning:
- Training: ~$2-5 per 1,000 examples
- Dataset ของ 1 ร้าน (500 examples): ~$3-10
- Inference: ราคาเท่ากับ base model

→ คุ้มสำหรับ Business plan (3,490 ฿/เดือน)
→ ทำทุก 3 เดือน (update model ตามข้อมูลใหม่)
```

---

## Full System Prompt Assembly

ทุกครั้งที่ Chat Brain รับข้อความ นี่คือ prompt ที่ประกอบขึ้นมา:

```typescript
async function buildFullPrompt(
  shopId: string,
  customerMessage: string,
  customer: CustomerProfile
): Promise<string> {

  const [
    staticContext,    // Layer 1: RAG
    dynamicContext,   // Layer 2: Real-time
    fewShots,         // Layer 3: Learned patterns
    shopStyle,        // Layer 3: Style profile
  ] = await Promise.all([
    retrieveContext(shopId, customerMessage),
    buildDynamicContext(shopId),
    buildFewShotExamples(shopId, customerMessage),
    getShopStyleProfile(shopId),
  ])

  return `
    ${CORE_SYSTEM_PROMPT}

    === ข้อมูลร้าน (ห้ามนอกเหนือจากนี้) ===
    ${staticContext}

    ${dynamicContext}

    === สไตล์การตอบของร้านนี้ ===
    - น้ำเสียง: ${shopStyle.preferredTone}
    - ใช้ emoji: ${shopStyle.usesEmoji ? 'ได้' : 'ไม่ใช้'}
    - ความยาว: ${shopStyle.avgReplyLength}
    - ปิดท้ายด้วย: "${shopStyle.endingStyle}"

    ${fewShots}

    === ข้อมูลลูกค้าคนนี้ ===
    ชื่อ: ${customer.displayName}
    ออเดอร์ล่าสุด: ${customer.lastOrder?.items.join(', ') || 'ยังไม่เคยสั่ง'}
    ความชอบ: ${customer.preferences.join(', ') || 'ไม่ทราบ'}

    === คำถามลูกค้า ===
    ${customerMessage}
  `
}
```

---

## Onboarding Timeline สำหรับลูกค้าใหม่

```
วันที่ 1: สมัคร + กรอก onboarding
    └──▶ Layer 1 build อัตโนมัติ (5-10 นาที)
         AI พร้อมตอบแชทได้เลย

สัปดาห์ที่ 1-2: เก็บ interactions
    └──▶ Layer 3 เริ่มเรียนรู้จาก corrections

เดือนที่ 1: Style profile ชัดเจน
    └──▶ AI ตอบได้ "สไตล์ร้าน" ชัดขึ้นเรื่อยๆ

เดือนที่ 3+: Pattern library แข็งแกร่ง
    └──▶ AI ตอบได้แม่นโดยแทบไม่ต้องแก้ไข

เดือนที่ 6+ (Business): Fine-tuned model
    └──▶ Model เฉพาะร้าน คุณภาพสูงสุด
```

---

## Data Isolation & Privacy

```typescript
// ข้อมูลทุกร้านแยกกันสมบูรณ์ ไม่ cross-contaminate

// Firestore path เป็น per-shop เสมอ
shops/{shopId}/knowledgeBase/...     // RAG ของร้านนี้เท่านั้น
shops/{shopId}/learnedPatterns/...   // Patterns ของร้านนี้เท่านั้น

// Fine-tuned model ก็แยกกัน
tunedModels/samart-shop-{shopId}      // Model เฉพาะของแต่ละร้าน

// Embeddings ไม่เคย share ข้ามร้าน
// ลูกค้าร้าน A ไม่มีทางเห็นข้อมูลร้าน B
```

---

## Summary: ต้นทุน AI ต่อร้านต่อเดือน

| Layer | Component | ต้นทุน |
|-------|-----------|--------|
| 1 | RAG embeddings (initial + updates) | ~5 ฿ |
| 1 | Semantic search (Firestore reads) | ~3 ฿ |
| 2 | Dynamic context (real-time) | ~0 ฿ |
| 3 | Few-shot retrieval | ~2 ฿ |
| 3+2+1 | Gemini Flash chat (1,000 msg) | ~15 ฿ |
| **รวม Starter/Pro** | | **~25 ฿/ร้าน/เดือน** |
| 4 | Fine-tuning (ทุก 3 เดือน) | ~15 ฿/เดือน |
| **รวม Business** | | **~40 ฿/ร้าน/เดือน** |

> Gross margin ยังสูงกว่า 98% ต่อร้าน ✅
