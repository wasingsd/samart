"use client";

import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  UserPlus,
  AlertTriangle,
  MessageCircle,
  Sparkles,
  ArrowRight,
  Package,
  Clock,
  Brain,
  CheckCircle2,
  Zap,
} from "lucide-react";
import Link from "next/link";

const quickStats = [
  {
    label: "ยอดขายวันนี้",
    value: "0",
    prefix: "฿",
    subtitle: "เริ่มต้นใหม่",
    icon: DollarSign,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    iconBg: "bg-emerald-100",
  },
  {
    label: "ออเดอร์",
    value: "0",
    prefix: "",
    subtitle: "รอออเดอร์แรก",
    icon: ShoppingCart,
    color: "text-sky-600",
    bg: "bg-sky-50",
    iconBg: "bg-sky-100",
  },
  {
    label: "ลูกค้าใหม่",
    value: "0",
    prefix: "",
    subtitle: "เชื่อมต่อ LINE เพื่อเริ่ม",
    icon: UserPlus,
    color: "text-violet-600",
    bg: "bg-violet-50",
    iconBg: "bg-violet-100",
  },
  {
    label: "แชทวันนี้",
    value: "0",
    prefix: "",
    subtitle: "รอเชื่อมต่อ",
    icon: MessageCircle,
    color: "text-amber-600",
    bg: "bg-amber-50",
    iconBg: "bg-amber-100",
  },
];

const actionItems = [
  {
    icon: Package,
    title: "เพิ่มเมนูสินค้า",
    description: "เพิ่มเมนูให้ AI รู้จักสินค้าของร้านคุณ",
    href: "/dashboard/menu",
    priority: "สำคัญ",
    priorityColor: "bg-red-50 text-red-600 border border-red-200",
    iconColor: "text-red-500",
    iconBg: "bg-red-50",
  },
  {
    icon: Sparkles,
    title: "ตั้งค่าสไตล์ AI",
    description: "ปรับแต่งบุคลิกและน้ำเสียงของ AI ให้เหมาะกับร้าน",
    href: "/dashboard/settings",
    priority: "แนะนำ",
    priorityColor: "bg-sky-50 text-sky-600 border border-sky-200",
    iconColor: "text-sky-500",
    iconBg: "bg-sky-50",
  },
  {
    icon: MessageCircle,
    title: "เชื่อมต่อ LINE OA",
    description: "เชื่อม LINE Official Account เพื่อเปิดใช้แชทบอท",
    href: "/dashboard/settings",
    priority: "แนะนำ",
    priorityColor: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-50",
  },
];

export default function DashboardPage() {
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "สวัสดีตอนเช้า" : hour < 17 ? "สวัสดีตอนบ่าย" : "สวัสดีตอนเย็น";
  const dateStr = now.toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A237E] via-[#283593] to-[#00B4D8] p-6 lg:p-10 text-white">
        {/* Decorative */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/[0.06] rounded-full blur-sm" />
        <div className="absolute -bottom-8 left-1/3 w-36 h-36 bg-white/[0.04] rounded-full blur-sm" />
        <div className="absolute top-4 right-8 w-20 h-20 bg-white/[0.03] rounded-full" />

        <div className="relative z-10">
          <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">
            {greeting}
          </h1>
          <p className="text-white/60 text-sm lg:text-base mt-1">{dateStr}</p>
          <p className="mt-3 text-white/80 text-sm lg:text-base max-w-xl leading-relaxed">
            ยินดีต้อนรับสู่ <span className="font-semibold text-white">SAMART</span> — ผู้ช่วย AI ที่จะช่วยดูแลร้านค้าของคุณ
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        {quickStats.map(({ label, value, prefix, subtitle, icon: Icon, color, bg, iconBg }) => (
          <div
            key={label}
            className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-5">
              <div className={`w-11 h-11 lg:w-12 lg:h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 lg:w-6 lg:h-6 ${color}`} />
              </div>
              <TrendingUp className="w-4 h-4 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1.5">{label}</p>
            <p className="text-3xl lg:text-4xl font-display font-bold text-gray-900 tracking-tight">
              {prefix && <span className="text-xl lg:text-2xl font-semibold text-gray-400 mr-0.5">{prefix}</span>}
              {value}
            </p>
            <p className="text-xs lg:text-sm text-gray-400 mt-2">{subtitle}</p>
          </div>
        ))}
      </div>

      {/* Action Items */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Zap className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-base font-display font-semibold text-gray-900">สิ่งที่ต้องทำ</h3>
            <p className="text-sm text-gray-400">เริ่มตั้งค่าเพื่อเปิดใช้ AI</p>
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {actionItems.map(({ icon: Icon, title, description, href, priority, priorityColor, iconColor, iconBg }, idx) => (
            <Link
              key={title}
              href={href}
              className="flex items-center gap-4 px-6 py-5 hover:bg-gray-50/80 transition-colors group"
            >
              <div className="relative flex-shrink-0">
                <div className={`w-11 h-11 lg:w-12 lg:h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 lg:w-6 lg:h-6 ${iconColor}`} />
                </div>
                <div className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center">
                  {idx + 1}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1">
                  <p className="text-base font-semibold text-gray-900">{title}</p>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${priorityColor}`}>
                    {priority}
                  </span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
        {/* Recent Chats */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-sky-500" />
              </div>
              <h3 className="font-display font-semibold text-gray-900">แชทล่าสุด</h3>
            </div>
            <Link
              href="/dashboard/chat-logs"
              className="text-xs font-medium text-sky-600 hover:text-sky-700 transition-colors"
            >
              ดูทั้งหมด →
            </Link>
          </div>
          <div className="p-8 lg:p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-600">ยังไม่มีบทสนทนา</p>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              เชื่อมต่อ LINE OA เพื่อเริ่มรับแชท
            </p>
          </div>
        </div>

        {/* AI Brain Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Brain className="w-4 h-4 text-amber-500" />
              </div>
              <h3 className="font-display font-semibold text-gray-900">สถานะ AI Brain</h3>
            </div>
            <Link
              href="/dashboard/knowledge"
              className="text-xs font-medium text-sky-600 hover:text-sky-700 transition-colors"
            >
              จัดการ →
            </Link>
          </div>
          <div className="p-5 space-y-4">
            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 font-medium">ความพร้อม AI</span>
                <span className="text-sm font-bold text-gray-900">0%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-400 to-amber-500 rounded-full h-2.5 transition-all duration-700"
                  style={{ width: "2%" }}
                />
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex items-center justify-center flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                </div>
                <span className="text-gray-500">เมนู: ยังไม่ได้เพิ่ม</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex items-center justify-center flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                </div>
                <span className="text-gray-500">FAQ: ยังไม่ได้เพิ่ม</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex items-center justify-center flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                </div>
                <span className="text-gray-500">เวลาเปิด-ปิด: ยังไม่ได้ตั้ง</span>
              </div>
            </div>

            {/* CTA */}
            <Link
              href="/dashboard/knowledge"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#1A237E] to-[#00B4D8] hover:brightness-110 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              เพิ่มความรู้ให้ AI
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
