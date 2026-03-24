import { UtensilsCrossed, ShoppingBag, Briefcase } from "lucide-react";

/**
 * Business Type Configuration
 * ประเภทธุรกิจกำหนดโครงสร้างทั้งระบบ: terminology, fields, default categories
 */

export type BusinessType = "food" | "retail" | "service";

export interface BusinessConfig {
  type: BusinessType;
  label: string;
  description: string;
  examples: string;
  icon: typeof UtensilsCrossed;
  itemLabel: string;         // "เมนู" / "สินค้า" / "บริการ"
  itemLabelPlural: string;   // "เมนูและสินค้า" / "สินค้า" / "รายการบริการ"
  addItemLabel: string;      // "เพิ่มเมนู" / "เพิ่มสินค้า" / "เพิ่มบริการ"
  unitLabel: string;         // "จาน/แก้ว" / "ชิ้น" / "ครั้ง"
  defaultCategories: string[];
  fields: {
    allergens: boolean;
    calories: boolean;
    sku: boolean;
    unit: boolean;
    duration: boolean;
  };
}

export const BUSINESS_CONFIGS: Record<BusinessType, BusinessConfig> = {
  food: {
    type: "food",
    label: "ร้านอาหาร / เครื่องดื่ม",
    description: "ร้านอาหาร, คาเฟ่, เบเกอรี่, บาร์",
    examples: "ร้านอาหาร, คาเฟ่, เบเกอรี่, ชานม, ไอศกรีม",
    icon: UtensilsCrossed,
    itemLabel: "เมนู",
    itemLabelPlural: "เมนูและสินค้า",
    addItemLabel: "เพิ่มเมนู",
    unitLabel: "จาน/แก้ว",
    defaultCategories: ["เครื่องดื่ม", "อาหาร", "ของหวาน", "อื่นๆ"],
    fields: { allergens: true, calories: true, sku: false, unit: false, duration: false },
  },
  retail: {
    type: "retail",
    label: "ร้านค้า / ค้าปลีก",
    description: "ร้านค้าปลีก, ร้านส่ง, ออนไลน์",
    examples: "เสื้อผ้า, เครื่องสำอาง, อุปกรณ์ IT, ของชำ",
    icon: ShoppingBag,
    itemLabel: "สินค้า",
    itemLabelPlural: "สินค้า",
    addItemLabel: "เพิ่มสินค้า",
    unitLabel: "ชิ้น",
    defaultCategories: ["สินค้าทั่วไป", "สินค้าใหม่", "โปรโมชัน", "อื่นๆ"],
    fields: { allergens: false, calories: false, sku: true, unit: true, duration: false },
  },
  service: {
    type: "service",
    label: "ธุรกิจบริการ",
    description: "ครอบคลุมทุกประเภทบริการ ตั้งแต่ช่าง, สุขภาพ, ความงาม, ที่พัก, การศึกษา ฯลฯ",
    examples: "เสริมสวย, สปา, ซ่อมมือถือ, ล้างรถ, ทำเล็บ, ฟิตเนส, สอนพิเศษ, ที่พัก",
    icon: Briefcase,
    itemLabel: "บริการ",
    itemLabelPlural: "รายการบริการ",
    addItemLabel: "เพิ่มบริการ",
    unitLabel: "ครั้ง",
    defaultCategories: [
      "บริการหลัก",
      "แพ็คเกจ",
      "ซ่อม/บำรุง",
      "สุขภาพ/ความงาม",
      "ทำความสะอาด",
      "ที่พัก/ห้องพัก",
      "คอร์สเรียน",
      "ให้เช่า",
      "เสริม",
      "อื่นๆ",
    ],
    fields: { allergens: false, calories: false, sku: false, unit: true, duration: true },
  },
};

/**
 * Get business config from shop category
 * Maps legacy categories (restaurant, cafe, bakery) → food
 */
export function getBusinessConfig(category: string): BusinessConfig {
  if (["restaurant", "cafe", "bakery", "food"].includes(category)) return BUSINESS_CONFIGS.food;
  if (["retail"].includes(category)) return BUSINESS_CONFIGS.retail;
  if (["service"].includes(category)) return BUSINESS_CONFIGS.service;
  // fallback: other → food
  return BUSINESS_CONFIGS.food;
}
