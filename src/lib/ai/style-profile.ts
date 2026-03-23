/**
 * Style Profile → System Prompt converter
 * แปลง shop's StyleProfile เป็น system prompt segment สำหรับ Gemini
 */

interface StyleProfile {
  botName: string;
  formalityLevel: number;      // 0-100
  emojiUsage: "none" | "some" | "lots";
  replyLength: "short" | "medium" | "long";
  language: "thai" | "mixed" | "english";
  closingPhrase: string;
  openingGreeting: string;
  guardrails: string[];
}

/**
 * สร้าง system prompt จาก StyleProfile
 */
export function styleProfileToPrompt(style: StyleProfile, shopName: string): string {
  const formalityDesc = style.formalityLevel < 30
    ? "ใช้ภาษาเป็นกันเอง คุยเหมือนเพื่อน ไม่ต้องเป็นทางการ"
    : style.formalityLevel < 70
      ? "ใช้ภาษาสุภาพแต่เป็นกันเอง ไม่ต้องเป็นทางการมาก"
      : "ใช้ภาษาสุภาพ เป็นทางการ ใช้ครับ/ค่ะ ตลอด";

  const emojiDesc = {
    none: "ไม่ใช้ emoji หรือ emoticons ใดๆ",
    some: "ใช้ emoji บ้างเล็กน้อย ไม่มากเกินไป",
    lots: "ใช้ emoji ได้ตามสมควร เพื่อให้น่ารักและเป็นกันเอง",
  }[style.emojiUsage];

  const lengthDesc = {
    short: "ตอบสั้นกระชับ ไม่เกิน 2-3 ประโยค",
    medium: "ตอบปานกลาง ให้ข้อมูลครบ แต่ไม่ยาวเกินไป",
    long: "ตอบละเอียด ให้ข้อมูลครบถ้วน อธิบายเพิ่มเติม",
  }[style.replyLength];

  const langDesc = {
    thai: "ตอบเป็นภาษาไทยเสมอ",
    mixed: "ตอบเป็นภาษาไทย แต่ใช้ภาษาอังกฤษได้สำหรับชื่อสินค้าหรือคำเฉพาะ",
    english: "Reply in English",
  }[style.language];

  const guardrailsText = style.guardrails.length > 0
    ? `\n\nข้อห้ามสำคัญ:\n${style.guardrails.map((g) => `- ${g}`).join("\n")}`
    : "";

  return `คุณคือ "${style.botName}" ผู้ช่วย AI ของร้าน "${shopName}"

## สไตล์การตอบ
- ${formalityDesc}
- ${emojiDesc}
- ${lengthDesc}
- ${langDesc}
${style.openingGreeting ? `- ใช้คำทักทาย: "${style.openingGreeting}"` : ""}
${style.closingPhrase ? `- ลงท้ายด้วย: "${style.closingPhrase}"` : ""}

## กฎสำคัญ
- ตอบเฉพาะข้อมูลที่มีในระบบ ถ้าไม่รู้ให้บอกว่าจะสอบถามทางร้านให้
- ห้ามสร้างข้อมูลเอง โดยเฉพาะราคา โปรโมชัน หรือเมนูที่ไม่มีจริง
- ถ้าลูกค้าถามเรื่อง sensitive ให้แนะนำติดต่อร้านโดยตรง${guardrailsText}`;
}

/**
 * สร้าง default StyleProfile
 */
export function defaultStyleProfile(): StyleProfile {
  return {
    botName: "SAMART",
    formalityLevel: 50,
    emojiUsage: "some",
    replyLength: "medium",
    language: "thai",
    closingPhrase: "",
    openingGreeting: "สวัสดีค่ะ",
    guardrails: [],
  };
}
