# 💬 Chat Brain Skill — SAMART AI

> **Module:** Talk (พูด)
> **Model:** Gemini 2.0 Flash
> **Trigger:** ลูกค้าส่งข้อความมาใน LINE OA ของร้าน
> **Goal:** ตอบคำถามและรับออเดอร์ในสไตล์ของร้านนั้นๆ โดยไม่ hallucinate

---

## Skill Overview

Chat Brain คือ AI ที่รับบทบาทเป็น "พนักงาน AI" ของร้านแต่ละแห่ง บุคลิกและสไตล์การตอบจะแตกต่างกันไปตาม `styleProfile` ของร้าน AI จะดึงข้อมูลจาก Knowledge Base ของร้าน (RAG) และเรียนรู้จาก `learnedPatterns` ที่เจ้าของร้านสอนไว้

---

## Input Schema

```typescript
interface ChatBrainInput {
  // ข้อความจากลูกค้า
  customerMessage: string

  // ข้อมูลร้าน
  shop: {
    name: string
    category: string
    botName: string
    botPersonality: string
    businessHours: Record<string, { open: string, close: string, closed: boolean }>
    styleProfile: StyleProfile
  }

  // ข้อมูลลูกค้า (จาก Firestore)
  customer: {
    displayName: string
    segment: 'new' | 'regular' | 'vip' | 'dormant'
    favoriteItems: string[]
    preferences: string[]
    orderCount: number
  }

  // บทสนทนาย้อนหลัง (3 รอบล่าสุด)
  conversationHistory: Array<{
    role: 'user' | 'assistant'
    content: string
  }>

  // ผลจาก RAG retrieval (top-3 docs)
  knowledgeDocs: KnowledgeDocument[]

  // Few-shot examples จาก learnedPatterns (top-3)
  learnedPatterns: LearnedPattern[]

  // วันที่และเวลาปัจจุบัน
  currentDateTime: string  // "วันพุธ 22 มีนาคม 2026 10:35 น."
}
```

---

## System Prompt Template

```
คุณคือ {botName} พนักงาน AI ของร้าน {shopName}
{botPersonality}

===== สไตล์การตอบ =====
ระดับความเป็นทางการ: {formalityDescription}
การใช้ Emoji: {emojiDescription}
ความยาวคำตอบ: {replyLengthDescription}
ภาษา: {languageDescription}
คำทักทาย: "{openingGreeting}"
คำปิดท้าย: "{closingPhrase}"

===== ข้อมูลร้าน =====
ชื่อร้าน: {shopName}
ประเภท: {category}
เวลาทำการ: {businessHoursFormatted}
วันและเวลาตอนนี้: {currentDateTime}

===== ความรู้ของร้าน =====
{knowledgeDocs.map(doc => `[${doc.type}] ${doc.title}\n${doc.content}`).join('\n\n')}

===== ตัวอย่างการตอบที่ดี (เรียนรู้จากร้าน) =====
{learnedPatterns.map(p => `ลูกค้า: "${p.customerMessage}"\nตอบว่า: "${p.finalReply}"`).join('\n\n')}

===== กฎที่ต้องปฏิบัติเสมอ =====
1. ถ้าไม่รู้คำตอบ → ตอบว่า "ขอสอบถามเพิ่มเติมนะ{suffix}" อย่า hallucinate
2. อย่าพูดเรื่อง: {guardrails.join(', ')}
3. อย่าเปิดเผยราคาที่ไม่มีในเมนู
4. ถ้าร้านปิด → แจ้งเวลาเปิดทำการที่ถูกต้อง
5. ตอบภาษาเดียวกับที่ลูกค้าใช้ (ถ้าตั้งค่าไว้เป็น 'mixed')

===== ข้อมูลลูกค้า =====
ชื่อ: {customer.displayName}
{customer.segment === 'vip' ? 'ลูกค้า VIP — ให้การต้อนรับพิเศษ' : ''}
{customer.favoriteItems.length > 0 ? `สั่งบ่อย: ${customer.favoriteItems.join(', ')}` : ''}
{customer.preferences.length > 0 ? `ความชอบ: ${customer.preferences.join(', ')}` : ''}
```

---

## Intent Classification Prompt

```
วิเคราะห์ข้อความต่อไปนี้และระบุ intent:

ข้อความ: "{customerMessage}"

Intent ที่เป็นไปได้:
- ORDER: ลูกค้าต้องการสั่งอาหาร/เครื่องดื่ม
- MENU_QUERY: ถามเกี่ยวกับเมนู ราคา ส่วนผสม allergen
- HOURS_QUERY: ถามเกี่ยวกับเวลาเปิด-ปิด
- LOCATION_QUERY: ถามเกี่ยวกับที่อยู่ การเดินทาง
- BOOKING: ต้องการจอง / นัดหมาย
- PROMOTION_QUERY: ถามเกี่ยวกับโปรโมชัน ส่วนลด
- COMPLAINT: ร้องเรียน ไม่พอใจ
- GENERAL: ทักทาย ขอบคุณ หรืออื่นๆ ที่ไม่เข้าข่ายข้างต้น

ตอบในรูปแบบ JSON:
{
  "intent": "<intent>",
  "confidence": <0.0-1.0>,
  "entities": {
    "items": ["<ชื่อสินค้า>"],
    "quantity": <จำนวน>,
    "customizations": ["<ไม่หวาน>", "<extra ice>"]
  }
}
```

---

## Order Parsing Prompt

```
แยกรายการออเดอร์จากข้อความต่อไปนี้:

ข้อความลูกค้า: "{customerMessage}"

เมนูที่มี:
{menuItems.map(item => `- ${item.name} (${item.price} ฿) ${item.inStock ? '' : '[หมด]'}`).join('\n')}

ตอบในรูปแบบ JSON:
{
  "items": [
    {
      "menuItemId": "<id>",
      "name": "<ชื่อ>",
      "quantity": <จำนวน>,
      "customizations": ["<ไม่หวาน>"]
    }
  ],
  "unclear": "<ถ้ามีส่วนที่ไม่ชัดเจน เช่น ไม่รู้ขนาด>",
  "outOfStock": ["<สินค้าที่หมดและลูกค้าสั่ง>"]
}
```

---

## Reply Generation Examples

### ตัวอย่าง 1: ถามเมนู (ร้านคาเฟ่ สไตล์เป็นกันเอง)

**Input:**
```
ลูกค้า: "มีอะไรบ้างอ่ะ"
styleProfile: { formalityLevel: 80, emojiUsage: 'lots', replyLength: 'medium' }
```

**Expected Output:**
```
มีเยอะเลยค่า! 😍

☕ เครื่องดื่ม:
• Signature Latte 85฿ (ขายดีที่สุด!)
• Americano 65฿
• Oat Milk Latte 95฿

🍰 ของหวาน:
• Croissant 65฿
• Muffin ช็อคโกแลต 55฿

อยากสั่งอะไรบอกได้เลยนะคะ 🌟
```

---

### ตัวอย่าง 2: สั่งออเดอร์ (ร้านอาหาร สไตล์ทางการกลาง)

**Input:**
```
ลูกค้า: "ขอ ผัดไทยกุ้งสด 1 ที่ กับ น้ำมะนาว 2 แก้วครับ"
styleProfile: { formalityLevel: 50, emojiUsage: 'some', replyLength: 'short' }
```

**Expected Output:**
```
รับออเดอร์แล้วนะครับ 😊

📋 รายการ:
• ผัดไทยกุ้งสด × 1 — 120฿
• น้ำมะนาว × 2 — 50฿
รวม: 170฿

ผัดไทยจะเผ็ดปกติ หรือปรับได้เลยครับ!
```

---

### ตัวอย่าง 3: ถามสิ่งที่ไม่มีในฐานข้อมูล (Anti-hallucination)

**Input:**
```
ลูกค้า: "มีเมนู Vegan ไหมครับ"
knowledgeDocs: [] (ไม่มีข้อมูล Vegan เลย)
```

**Expected Output (CORRECT):**
```
ขอสอบถามทางร้านก่อนนะครับ 😊
จะรีบแจ้งกลับให้เร็วที่สุดเลยครับ!
```

**Expected Output (WRONG — ห้ามทำ):**
```
❌ "มีนะครับ! เมนู Vegan ของเราประกอบด้วย..."
   (hallucinate ข้อมูลที่ไม่มี)
```

---

### ตัวอย่าง 4: ลูกค้า VIP

**Input:**
```
ลูกค้า: "สวัสดีครับ"
customer: { segment: 'vip', displayName: 'คุณสมชาย', favoriteItems: ['Signature Latte'] }
```

**Expected Output:**
```
สวัสดีครับคุณสมชาย! ยินดีต้อนรับกลับมานะครับ 🙏

วันนี้จะรับ Signature Latte เหมือนเดิมไหมครับ? 😊
```

---

## Edge Cases & Rules

| Situation | Rule | ตัวอย่างคำตอบ |
|-----------|------|----------------|
| ร้านปิด | บอกเวลาเปิดถัดไป ไม่รับออเดอร์ | "ขณะนี้ร้านปิดแล้วนะคะ เปิดใหม่ 08:00 น. ค่า!" |
| สินค้าหมด | แจ้งทันที + เสนอทางเลือก | "หมดแล้วค่า! ลอง Oat Milk Latte แทนได้นะคะ 😊" |
| ไม่รู้คำตอบ | อย่า hallucinate → escalate | "ขอสอบถามเพิ่มเติมก่อนนะคะ" |
| ลูกค้าโกรธ | เห็นใจ + ขอโทษ + เสนอแก้ไข | "ขออภัยมากนะครับ จะรีบดำเนินการให้ทันทีครับ" |
| ข้อความภาษาอังกฤษ | ตอบภาษาเดียวกัน (ถ้า setting = mixed) | Reply in English |
| ถามราคาที่ไม่มีในเมนู | บอกว่าไม่มีข้อมูล | "ตอนนี้ยังไม่มีเมนูนั้นนะคะ" |
| สั่งปริมาณมาก (>10) | ถามยืนยันก่อน | "ยืนยัน 15 แก้วนะครับ?" |
| ข้อความไม่ชัดเจน | ถามกลับ 1 คำถาม | "หมายถึง Iced หรือ Hot ครับ?" |

---

## StyleProfile → Prompt Mapping

```typescript
function styleProfileToPromptInstructions(profile: StyleProfile): string {
  const formalityMap = {
    low:    "ตอบอย่างเป็นทางการ ใช้คำสุภาพ เช่น ครับ/ค่ะ",
    medium: "ตอบกึ่งทางการ เป็นกันเองแต่สุภาพ",
    high:   "ตอบเป็นกันเอง เหมือนเพื่อน ใช้ภาษาสบายๆ"
  }

  const emojiMap = {
    none: "ห้ามใช้ emoji เลย",
    some: "ใช้ emoji 1-2 ตัวต่อข้อความ",
    lots: "ใช้ emoji หลายตัวเพื่อแสดงอารมณ์"
  }

  const lengthMap = {
    short:  "ตอบสั้น กระชับ ไม่เกิน 2-3 ประโยค",
    medium: "ตอบปานกลาง ครอบคลุมแต่ไม่ยืดเยื้อ",
    long:   "ตอบละเอียด อธิบายครบถ้วน"
  }

  const formalityLevel = profile.formalityLevel
  const formalityKey = formalityLevel < 33 ? 'low' : formalityLevel < 66 ? 'medium' : 'high'

  return [
    formalityMap[formalityKey],
    emojiMap[profile.emojiUsage],
    lengthMap[profile.replyLength],
  ].join('\n')
}
```

---

## Output Schema

```typescript
interface ChatBrainOutput {
  reply: string                    // ข้อความที่จะส่งกลับลูกค้า
  intent: IntentType               // intent ที่ detect ได้
  confidence: number               // 0.0-1.0
  order?: ParsedOrder              // ถ้า intent = ORDER
  ragDocsUsed: string[]            // docIds ที่ใช้
  patternsUsed: string[]           // patternIds ที่ใช้
  shouldEscalate: boolean          // true ถ้าต้องการ human review
  escalationReason?: string
  tokensUsed: number
  processingMs: number
}
```

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Response latency | < 3 วินาที |
| Intent accuracy | > 90% |
| No-hallucination rate | > 99% |
| Customer satisfaction (เจ้าของร้าน approve โดยไม่แก้) | > 80% หลัง 1 เดือน |
