# ✍️ Content Brain Skill — Panya AI

> **Module:** Create (สร้าง)
> **Models:** Gemini 2.0 Pro (text), Gemini Imagen 3 (image)
> **Trigger:** เจ้าของร้านขอให้ AI สร้าง Content สำหรับโพสต์โซเชียลมีเดีย
> **Goal:** สร้าง caption + รูปภาพ ที่ตรงกับแบรนด์ของร้าน พร้อมโพสต์ได้เลย

---

## Skill Overview

Content Brain ช่วยเจ้าของร้านสร้าง content สำหรับ Facebook, LINE, Instagram โดย AI จะเข้าใจ "สไตล์" ของแต่ละร้าน (จาก brandStyle + styleProfile) และสร้าง content ที่ดูสม่ำเสมอและมืออาชีพโดยไม่ต้องจ้าง content creator

---

## Input Schema

```typescript
interface ContentBrainInput {
  contentType:
    | 'promotion'        // โปรโมชั่น ลดราคา
    | 'new_menu'         // เมนูใหม่
    | 'daily_special'    // เมนูประจำวัน
    | 'seasonal'         // เทศกาล / ฤดูกาล
    | 'behind_scenes'    // behind the scenes
    | 'testimonial'      // รีวิวลูกค้า
    | 'announcement'     // ประกาศทั่วไป

  product?: {
    name: string
    price: number
    description?: string
    tags: string[]       // ['bestseller', 'seasonal', 'new']
    imageUrl?: string    // ถ้ามีรูปเดิมอยู่แล้ว
  }

  tone:
    | 'fun'              // สนุกสนาน ไม่เป็นทางการ
    | 'warm'             // อบอุ่น ใกล้ชิด
    | 'premium'          // หรูหรา มืออาชีพ
    | 'urgent'           // เร่งด่วน limited time
    | 'informative'      // ให้ข้อมูล

  platforms: ('facebook' | 'line' | 'instagram')[]

  shop: {
    name: string
    category: string
    brandStyle: 'modern' | 'warm' | 'minimal' | 'traditional'
    brandColors: string[]    // ['#1A237E', '#00B4D8']
    botName: string
    styleProfile: StyleProfile
  }

  // context เพิ่มเติม (optional)
  context?: {
    season?: string          // "สงกรานต์" | "คริสต์มาส"
    event?: string           // "วันเปิดร้านครบรอบ 1 ปี"
    targetAudience?: string  // "นักเรียน ม.เชียงใหม่"
    callToAction?: string    // "โทรจองล่วงหน้า"
  }
}
```

---

## Text Generation Prompts

### Prompt Template — Post Caption

```
คุณคือ Content Creator มืออาชีพสำหรับธุรกิจขนาดเล็กในไทย

สร้างโพสต์ {platform} สำหรับ:
ร้าน: {shopName} (ประเภท: {category})
สไตล์แบรนด์: {brandStyle}
บุคลิกแบรนด์: {botPersonality}

ประเภทโพสต์: {contentType}
{product ? `สินค้า: ${product.name} — ${product.price}฿` : ''}
{product?.description ? `รายละเอียด: ${product.description}` : ''}
น้ำเสียง: {tone}
{context?.season ? `เทศกาล/ฤดูกาล: ${context.season}` : ''}
{context?.event ? `Event: ${context.event}` : ''}
{context?.targetAudience ? `กลุ่มเป้าหมาย: ${context.targetAudience}` : ''}
{context?.callToAction ? `Call to Action: ${context.callToAction}` : ''}

กฎการสร้าง:
1. ความยาว caption สำหรับ {platform}: {lengthGuide}
2. ใช้ emoji ตาม style ของร้าน: {emojiGuide}
3. ต้องมี hook ที่ดึงดูดในบรรทัดแรก
4. ใส่ราคาถ้ามีสินค้า
5. ปิดด้วย Call to Action ที่ชัดเจน
6. Hashtags: {hashtagCount} อัน เน้นไทย + local เชียงใหม่

ตอบในรูปแบบ JSON:
{
  "caption": "<caption text>",
  "hashtags": ["#tag1", "#tag2"],
  "altVersions": ["<version 2>", "<version 3>"]
}
```

---

### Platform-Specific Guidelines

```typescript
const PLATFORM_GUIDELINES = {
  facebook: {
    captionLength: '150-300 ตัวอักษร',
    hashtagCount: '3-5 อัน',
    imageRatio: '1:1 หรือ 4:5',
    tips: 'เพิ่ม emoji ตอนต้นเพื่อดึงสายตา, ใส่ราคาชัดเจน'
  },
  line: {
    captionLength: '80-150 ตัวอักษร',
    hashtagCount: '0-2 อัน (LINE ไม่นิยม hashtag)',
    imageRatio: '1:1',
    tips: 'ตรงไปตรงมา, ใส่ลิงก์สั่งออนไลน์หรือเบอร์โทร'
  },
  instagram: {
    captionLength: '150-400 ตัวอักษร',
    hashtagCount: '10-20 อัน',
    imageRatio: '1:1 หรือ 4:5',
    tips: 'เน้น aesthetic, hashtag ที่เฉพาะเจาะจง เช่น #ChiangMaiCafe'
  }
}
```

---

### Content Type Templates

#### 🔥 Promotion / Flash Sale

```
HOOK OPTIONS (เลือกตามสไตล์):
- Fun:      "⚡ ลดแล้ว! {product} วันนี้เท่านั้น!"
- Warm:     "🎁 ของขวัญจากร้าน — {product} ราคาพิเศษ"
- Premium:  "คัดพิเศษให้คุณ — {product} เฉพาะสัปดาห์นี้"
- Urgent:   "🚨 เหลือแค่วันนี้! {product} ลด {discount}%"

BODY:
- ราคาปกติ vs ราคาพิเศษ
- เงื่อนไข (ถ้ามี)
- ช่วงเวลา

CTA OPTIONS:
- "สั่งได้เลยผ่าน LINE 👇"
- "มาได้เลย! {businessHours}"
- "ทักมาจองก่อนหมด ⬇️"
```

#### 🆕 New Menu

```
HOOK: "เพิ่งมา! {product} 🎉"

BODY:
- รายละเอียดเมนู (ส่วนผสมหลัก)
- จุดเด่นที่ต้องลอง
- ราคา

CTA: "ลองแล้วบอกด้วยนะ!"
```

#### ☀️ Daily Special

```
HOOK: "วันนี้มีพิเศษ! {day} {product}"

BODY:
- เมนูประจำวัน + ราคา
- ทำไมต้องมาวันนี้

CTA: "เปิด {open} - {close} น. รีบมาก่อนหมดนะ!"
```

---

## Image Generation Prompts

### Template

```
สร้างรูปภาพคุณภาพสูงสำหรับโซเชียลมีเดีย:

Product: {productName}
Style: {imageStyle}
Color palette: {brandColors joined as "warm earthy tones"}
Mood: {moodFromTone}
Setting: Thai {category} aesthetic

Required elements:
- {productName} เป็น hero ของภาพ อยู่ตรงกลาง/foreground
- Background: clean, on-brand ({brandStyle})
- Props: เหมาะกับ {category} เช่น cups, plants, wooden table
- Lighting: {lightingStyle}

Technical specs:
- Aspect ratio: 1:1 (square for social)
- Style: food photography, professional
- No text overlay (จะ overlay caption แยก)
- Sharp focus on product

Avoid:
- ภาพเบลอ
- สีไม่ match brand
- Background รกและดึงสายตาจาก product
```

### Style Mapping

```typescript
const BRAND_STYLE_TO_IMAGE_STYLE = {
  modern: {
    background: 'clean white marble or concrete',
    lighting: 'bright studio lighting, minimal shadows',
    props: 'minimal geometric props',
    mood: 'clean, crisp, contemporary'
  },
  warm: {
    background: 'rustic wood table, warm bokeh',
    lighting: 'golden hour warm lighting',
    props: 'flowers, vintage cups, natural elements',
    mood: 'cozy, inviting, homestyle'
  },
  minimal: {
    background: 'pure white or pale pastel',
    lighting: 'soft diffused natural light',
    props: 'none or single elegant element',
    mood: 'zen, simple, sophisticated'
  },
  traditional: {
    background: 'Thai traditional elements, wooden texture',
    lighting: 'warm ambient light',
    props: 'Thai ceramics, bamboo, herbs',
    mood: 'authentic, cultural, nostalgic'
  }
}

const TONE_TO_MOOD = {
  fun:         'vibrant, energetic, colorful',
  warm:        'cozy, inviting, soft',
  premium:     'luxurious, elegant, refined',
  urgent:      'dynamic, bold, eye-catching',
  informative: 'clean, clear, professional'
}
```

---

## Output Schema

```typescript
interface ContentBrainOutput {
  text: {
    caption: string
    hashtags: string[]
    altVersions: string[]    // 2 alternative captions
  }
  image: {
    url: string              // Firebase Storage URL
    prompt: string           // prompt ที่ใช้ generate
    altText: string          // accessibility
  }
  scheduleSuggestion: {
    bestTime: string         // "วันอังคาร 18:00-20:00 น."
    reason: string           // "ช่วง peak engagement ของ Facebook ไทย"
  }
  tokensUsed: number
  imageGenerationMs: number
}
```

---

## Post Scheduling Strategy

```typescript
// Best posting times (based on Thai social media research)
const BEST_POST_TIMES = {
  facebook: [
    { day: 'weekday', time: '07:00-09:00', reason: 'เช้าก่อนทำงาน' },
    { day: 'weekday', time: '12:00-13:00', reason: 'พักกลางวัน' },
    { day: 'weekday', time: '18:00-20:00', reason: 'เลิกงาน' },
    { day: 'weekend', time: '10:00-12:00', reason: 'เช้าวันหยุด' },
  ],
  line: [
    { day: 'any', time: '08:00-09:00', reason: 'เช้าเช็คมือถือ' },
    { day: 'any', time: '21:00-22:00', reason: 'ก่อนนอน' },
  ]
}

// เลือก best time ตาม content type
const CONTENT_TYPE_TIMING = {
  promotion:     'weekday 12:00 หรือ 18:00',
  new_menu:      'weekday 10:00 (ช่วงก่อนเที่ยง)',
  daily_special: 'ทุกวัน 07:00-08:00',
  seasonal:      '2-3 วันก่อนเทศกาล',
  behind_scenes: 'weekend 10:00-12:00',
}
```

---

## Performance Examples

### ตัวอย่างผลลัพธ์ที่ดี — Promotion (Facebook, ร้านคาเฟ่ Warm Style)

```
Input:
  contentType: 'promotion'
  product: { name: 'Signature Latte', price: 85, originalPrice: 95 }
  tone: 'warm'
  platform: 'facebook'

Output caption:
  "☕ วันนี้พิเศษสำหรับทุกคน!

  Signature Latte ของเรา เหลือแค่ 79฿ ทั้งวัน!
  (จากปกติ 85฿)

  รสชาติที่เราภูมิใจ — กาแฟ Single Origin จากดอยอ่างขาง
  ลองแล้วบอกด้วยนะคะ 🤍

  📍 เปิด 08:00 - 18:00 น. ทุกวัน
  📲 สั่ง take away ทักมาได้เลย!"

Hashtags:
  ["#ดอยคอฟฟี่", "#คาเฟ่เชียงใหม่", "#SignatureLatte", "#กาแฟดอย", "#CaffeChiangMai"]
```

---

### ตัวอย่างผลลัพธ์ที่ดี — New Menu (Instagram, ร้านอาหาร Modern Style)

```
Input:
  contentType: 'new_menu'
  product: { name: 'Khao Soi Wagyu', price: 350 }
  tone: 'premium'
  platform: 'instagram'

Output caption:
  "เมนูใหม่ที่รอคอย ✨

  Khao Soi Wagyu — ข้าวซอยเชียงใหม่ต้นตำรับ
  กับเนื้อ Wagyu A5 จากญี่ปุ่น

  น้ำแกงกะทิสูตรโบราณ 50 ปี
  ผสมผสานกับความพรีเมียมที่คุ้มค่าทุกคำ

  ราคา 350฿ | Available now"

Hashtags: (20 อัน)
  ["#KhaoSoiChiangMai", "#ข้าวซอยเชียงใหม่", "#WagyuBeef",
   "#ChiangMaiFood", "#ThaiFood", "#เชียงใหม่", "#ร้านอาหารเชียงใหม่",
   "#FoodieChiangMai", "#ข้าวซอย", "#อาหารเชียงใหม่", ...]
```

---

## Quality Checklist

ก่อน deliver content ให้ตรวจสอบ:

```typescript
function validateContent(content: ContentBrainOutput, input: ContentBrainInput): ValidationResult {
  const checks = [
    // Text checks
    content.text.caption.length >= 50,                          // ไม่สั้นเกินไป
    content.text.caption.length <= 500,                         // ไม่ยาวเกินไป
    content.text.caption.includes(input.product?.price + '฿'), // มีราคา
    !content.text.caption.includes('undefined'),               // ไม่มี template vars หลุด
    content.text.hashtags.length >= 3,                          // มี hashtags
    content.text.hashtags.some(h => h.includes('เชียงใหม่')), // มี local hashtag

    // Image checks
    content.image.url.startsWith('https://'),                  // URL ถูกต้อง
    content.image.url.includes('firebasestorage'),             // เป็น Firebase Storage
  ]

  return {
    passed: checks.every(Boolean),
    failedChecks: checks.map((c, i) => c ? null : i).filter(Boolean)
  }
}
```
