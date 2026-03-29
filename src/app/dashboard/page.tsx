"use client";

import { useMemo } from "react";
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  UserPlus,
  MessageCircle,
  Sparkles,
  ArrowRight,
  Package,
  Brain,
  Zap,
  Loader2,
  Sun,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { useShopStore } from "@/stores/useShopStore";

export default function DashboardPage() {
  const shop = useShopStore((s) => s.shop);
  const shopId = shop?.id || "";

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

  // --- Queries ---
  const { data: todayStats, isLoading: statsLoading } = trpc.analytics.overview.useQuery(
    { shopId, period: "1d" },
    { enabled: !!shopId }
  );

  const { data: chatStats } = trpc.chatLog.stats.useQuery(
    { shopId },
    { enabled: !!shopId }
  );

  const { data: recentChats } = trpc.chatLog.list.useQuery(
    { shopId, status: "all", limit: 5 },
    { enabled: !!shopId }
  );

  const { data: knowledgeHealth } = trpc.knowledge.health.useQuery(
    { shopId },
    { enabled: !!shopId }
  );

  const { data: briefing, isLoading: briefingLoading } = trpc.ai.getDailyBriefing.useQuery(
    { shopId },
    { enabled: !!shopId }
  );

  // --- Computed ---
  const quickStats = useMemo(() => [
    {
      label: "ยอดขายวันนี้",
      value: todayStats ? `฿${todayStats.totalRevenue.toLocaleString()}` : "—",
      subtitle: todayStats?.orderCount ? `${todayStats.orderCount} ออเดอร์` : "รอออเดอร์แรก",
      icon: DollarSign,
      color: "text-emerald-600",
      iconBg: "bg-emerald-100",
    },
    {
      label: "ออเดอร์",
      value: todayStats ? todayStats.orderCount.toString() : "—",
      subtitle: todayStats?.avgOrderValue ? `เฉลี่ย ฿${todayStats.avgOrderValue}` : "รอออเดอร์แรก",
      icon: ShoppingCart,
      color: "text-sky-600",
      iconBg: "bg-sky-100",
    },
    {
      label: "ลูกค้าใหม่",
      value: todayStats ? todayStats.newCustomers.toString() : "—",
      subtitle: "วันนี้",
      icon: UserPlus,
      color: "text-violet-600",
      iconBg: "bg-violet-100",
    },
    {
      label: "แชทวันนี้",
      value: chatStats ? chatStats.total.toString() : "—",
      subtitle: chatStats?.pending ? `${chatStats.pending} รอตรวจสอบ` : "ไม่มีรอตรวจ",
      icon: MessageCircle,
      color: "text-amber-600",
      iconBg: "bg-amber-100",
    },
  ], [todayStats, chatStats]);

  const actionItems = useMemo(() => {
    const items = [];
    if (!knowledgeHealth || knowledgeHealth.menuCount === 0) {
      items.push({
        icon: Package,
        title: "เพิ่มเมนูสินค้า",
        description: "เพิ่มเมนูให้ AI รู้จักสินค้าของร้านคุณ",
        href: "/dashboard/menu",
        priority: "สำคัญ",
        priorityColor: "bg-red-50 text-red-600 border border-red-200",
        iconColor: "text-red-500",
        iconBg: "bg-red-50",
      });
    }
    if (!knowledgeHealth || knowledgeHealth.completionPercent < 30) {
      items.push({
        icon: Sparkles,
        title: "เพิ่มความรู้ให้ AI",
        description: "เพิ่ม FAQ, นโยบาย, โปรโมชัน เพื่อให้ AI ตอบได้ดีขึ้น",
        href: "/dashboard/knowledge",
        priority: "แนะนำ",
        priorityColor: "bg-sky-50 text-sky-600 border border-sky-200",
        iconColor: "text-sky-500",
        iconBg: "bg-sky-50",
      });
    }
    if (!shop?.lineConnected) {
      items.push({
        icon: MessageCircle,
        title: "เชื่อมต่อ LINE OA",
        description: "เชื่อม LINE Official Account เพื่อเปิดใช้แชทบอท",
        href: "/dashboard/settings",
        priority: "แนะนำ",
        priorityColor: "bg-emerald-50 text-emerald-600 border border-emerald-200",
        iconColor: "text-emerald-500",
        iconBg: "bg-emerald-50",
      });
    }
    return items;
  }, [knowledgeHealth, shop]);

  const completionPercent = knowledgeHealth?.completionPercent || 0;
  const chatItems = (recentChats?.items || []) as Array<{
    id: string;
    customerName?: string;
    customerMessage?: string;
    aiReply?: string;
    status?: string;
    createdAt?: { toDate?: () => Date } | string;
  }>;

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A237E] via-[#283593] to-[#00B4D8] p-6 lg:p-10 text-white">
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
        {quickStats.map(({ label, value, subtitle, icon: Icon, color, iconBg }) => (
          <div
            key={label}
            className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-5">
              <div className={`w-11 h-11 lg:w-12 lg:h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 lg:w-6 lg:h-6 ${color}`} />
              </div>
              {statsLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-300" />}
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1.5">{label}</p>
            <p className="text-3xl lg:text-4xl font-display font-bold text-gray-900 tracking-tight">
              {value}
            </p>
            <p className="text-xs lg:text-sm text-gray-400 mt-2">{subtitle}</p>
          </div>
        ))}
      </div>

      {/* Action Items */}
      {actionItems.length > 0 && (
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
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#1A237E] group-hover:translate-x-1 transition-all flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Daily Briefing */}
      {briefing && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1A237E] to-[#00B4D8] flex items-center justify-center">
              <Sun className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-display font-semibold text-gray-900">AI Daily Briefing</h3>
          </div>
          <div className="p-5">
            {briefingLoading ? (
              <div className="flex items-center gap-3 py-4">
                <Loader2 className="w-5 h-5 animate-spin text-[#00B4D8]" />
                <p className="text-sm text-gray-500">กำลังสรุปข้อมูลวันนี้...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {briefing.summary && (
                  <p className="text-sm text-gray-700 leading-relaxed">{briefing.summary}</p>
                )}
                {briefing.actionItems && briefing.actionItems.length > 0 && (
                  <div className="space-y-2 mt-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Action Items</p>
                    {briefing.actionItems.map((item: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                        <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

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
              {chatStats && chatStats.pending > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-bold">
                  {chatStats.pending} รอตรวจ
                </span>
              )}
            </div>
            <Link
              href="/dashboard/chat-logs"
              className="text-xs font-medium text-sky-600 hover:text-sky-700 transition-colors"
            >
              ดูทั้งหมด →
            </Link>
          </div>
          {chatItems.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {chatItems.slice(0, 5).map((chat) => (
                <Link
                  key={chat.id}
                  href="/dashboard/chat-logs"
                  className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {chat.customerName || "ลูกค้า"}
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {chat.customerMessage || "—"}
                    </p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                    chat.status === "approved"
                      ? "bg-emerald-50 text-emerald-600"
                      : chat.status === "corrected"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {chat.status === "approved" ? "อนุมัติ" : chat.status === "corrected" ? "แก้ไข" : "รอ"}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 lg:p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-600">ยังไม่มีบทสนทนา</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                เชื่อมต่อ LINE OA เพื่อเริ่มรับแชท
              </p>
            </div>
          )}
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
                <span className="text-sm font-bold text-gray-900">{completionPercent}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-400 to-amber-500 rounded-full h-2.5 transition-all duration-700"
                  style={{ width: `${Math.max(completionPercent, 2)}%` }}
                />
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-2.5">
              <CheckItem
                done={(knowledgeHealth?.menuCount || 0) > 0}
                label={`เมนู: ${knowledgeHealth?.menuCount || 0} รายการ`}
              />
              <CheckItem
                done={(knowledgeHealth?.faqCount || 0) > 0}
                label={`FAQ: ${knowledgeHealth?.faqCount || 0} รายการ`}
              />
              <CheckItem
                done={knowledgeHealth?.hasBusinessHours || false}
                label={`เวลาเปิด-ปิด: ${knowledgeHealth?.hasBusinessHours ? "ตั้งค่าแล้ว" : "ยังไม่ได้ตั้ง"}`}
              />
              <CheckItem
                done={(knowledgeHealth?.promotionCount || 0) > 0}
                label={`โปรโมชัน: ${knowledgeHealth?.promotionCount || 0} รายการ`}
              />
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

function CheckItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      {done ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
      ) : (
        <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex items-center justify-center shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
        </div>
      )}
      <span className={done ? "text-gray-700" : "text-gray-500"}>{label}</span>
    </div>
  );
}
