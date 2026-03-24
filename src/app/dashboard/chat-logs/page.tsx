"use client";

import { useState } from "react";
import {
  MessageCircle, Search, Star, Bot, User, ThumbsUp,
  Pencil, Loader2, Send, X, Globe,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useShopStore } from "@/stores/useShopStore";

type FilterType = "all" | "pending" | "approved" | "corrected" | "featured";
type ChannelType = "all" | "line" | "facebook" | "instagram" | "web";

const channelConfig: Record<string, { label: string; color: string; bg: string; textColor: string; icon: string }> = {
  line: { label: "LINE", color: "#06C755", bg: "bg-[#06C755]/10", textColor: "text-[#06C755]", icon: "L" },
  facebook: { label: "Facebook", color: "#1877F2", bg: "bg-[#1877F2]/10", textColor: "text-[#1877F2]", icon: "f" },
  instagram: { label: "Instagram", color: "#E4405F", bg: "bg-[#E4405F]/10", textColor: "text-[#E4405F]", icon: "IG" },
  web: { label: "เว็บไซต์", color: "#6B7280", bg: "bg-gray-100", textColor: "text-gray-500", icon: "W" },
};

export default function ChatLogsPage() {
  const shop = useShopStore((s) => s.shop);
  const shopId = shop?.id ?? "";

  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [channelFilter, setChannelFilter] = useState<ChannelType>("all");
  const [search, setSearch] = useState("");
  const [correctingId, setCorrectingId] = useState<string | null>(null);
  const [correctedReply, setCorrectedReply] = useState("");

  const { data: conversations, isLoading } = trpc.chatLog.list.useQuery(
    { shopId, status: activeFilter, limit: 50 },
    { enabled: !!shopId }
  );
  const { data: stats } = trpc.chatLog.stats.useQuery({ shopId }, { enabled: !!shopId });

  const utils = trpc.useUtils();
  const inv = () => { utils.chatLog.list.invalidate(); utils.chatLog.stats.invalidate(); };

  const approveM = trpc.chatLog.approve.useMutation({ onSuccess: inv });
  const correctM = trpc.chatLog.correct.useMutation({ onSuccess: () => { inv(); setCorrectingId(null); setCorrectedReply(""); } });
  const featureM = trpc.chatLog.feature.useMutation({ onSuccess: inv });

  const filters: { id: FilterType; label: string; count: number }[] = [
    { id: "all", label: "ทั้งหมด", count: stats?.total ?? 0 },
    { id: "pending", label: "ต้องตรวจ", count: stats?.pending ?? 0 },
    { id: "approved", label: "ถูกต้อง", count: stats?.approved ?? 0 },
    { id: "corrected", label: "แก้ไขแล้ว", count: stats?.corrected ?? 0 },
    { id: "featured", label: "ตัวอย่างดี", count: stats?.featured ?? 0 },
  ];

  const channels: { id: ChannelType; label: string }[] = [
    { id: "all", label: "ทุกช่องทาง" },
    { id: "line", label: "LINE" },
    { id: "facebook", label: "Facebook" },
    { id: "instagram", label: "Instagram" },
    { id: "web", label: "เว็บไซต์" },
  ];

  const items = (conversations?.items ?? []) as Array<{
    id: string; customerName: string; customerMessage: string;
    aiReply: string; status: string; correctedReply?: string;
    channel?: string; createdAt: { seconds?: number } | string | Date;
  }>;

  const filteredItems = items.filter((c) => {
    const matchSearch = !search || c.customerMessage.includes(search) || c.aiReply.includes(search) || (c.customerName || "").includes(search);
    const matchChannel = channelFilter === "all" || (c.channel || "line") === channelFilter;
    return matchSearch && matchChannel;
  });

  const channelCounts = items.reduce((acc, i) => {
    const ch = i.channel || "line";
    acc[ch] = (acc[ch] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const formatTime = (ts: { seconds?: number } | string | Date) => {
    try {
      const d = typeof ts === "object" && ts !== null && "seconds" in ts ? new Date((ts.seconds ?? 0) * 1000) : new Date(ts as string | Date);
      return d.toLocaleString("th-TH", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" });
    } catch { return ""; }
  };

  const ChannelBadge = ({ channel }: { channel: string }) => {
    const cfg = channelConfig[channel] || channelConfig.web;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.textColor}`}>
        <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-white text-[8px] font-bold" style={{ backgroundColor: cfg.color }}>{cfg.icon}</span>
        {cfg.label}
      </span>
    );
  };

  if (!shopId) return <div className="flex items-center justify-center min-h-[400px] text-gray-400"><p>กรุณาสร้างร้านก่อนใช้งาน</p></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-dark">ประวัติแชทและการเรียนรู้</h1>
        <p className="text-sm text-dark-muted mt-1">ตรวจสอบบทสนทนาจาก LINE, Facebook, Instagram · อนุมัติ / แก้ไข เพื่อสอน AI</p>
      </div>

      {/* Stats with channel breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-surface-container">
          <p className="text-xs text-dark-muted">บทสนทนาทั้งหมด</p>
          <p className="text-2xl font-display font-bold text-dark mt-1">{stats?.total ?? 0}</p>
          <div className="flex gap-2 mt-2">
            {Object.entries(channelCounts).map(([ch, n]) => {
              const cfg = channelConfig[ch]; if (!cfg) return null;
              return <span key={ch} className={`text-[10px] font-medium ${cfg.textColor}`}>{cfg.label} {n}</span>;
            })}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-surface-container">
          <p className="text-xs text-dark-muted">อนุมัติ</p>
          <p className="text-2xl font-display font-bold text-success mt-1">{stats?.approved ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-surface-container">
          <p className="text-xs text-dark-muted">แก้ไข</p>
          <p className="text-2xl font-display font-bold text-amber mt-1">{stats?.corrected ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-surface-container">
          <p className="text-xs text-dark-muted">ตัวอย่างดี</p>
          <p className="text-2xl font-display font-bold text-primary mt-1">{stats?.featured ?? 0}</p>
        </div>
      </div>

      {/* Channel Filter */}
      <div className="flex gap-2 flex-wrap">
        {channels.map(({ id, label }) => {
          const cfg = id !== "all" ? channelConfig[id] : null;
          const active = channelFilter === id;
          return (
            <button key={id} onClick={() => setChannelFilter(id)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${active ? "border-[#1A237E] bg-[#1A237E] text-white shadow-sm" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}>
              {cfg && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cfg.color }} />}
              {id === "all" && <Globe className="w-3 h-3" />}
              {label}
              {id !== "all" && <span className={`text-[10px] ${active ? "text-white/70" : "text-gray-400"}`}>({channelCounts[id] || 0})</span>}
            </button>
          );
        })}
      </div>

      {/* Status Filter + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-surface-container rounded-xl p-1 overflow-x-auto flex-1">
          {filters.map(({ id, label, count }) => (
            <button key={id} onClick={() => setActiveFilter(id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeFilter === id ? "bg-white text-primary shadow-sm" : "text-dark-muted hover:text-dark"}`}>
              {label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeFilter === id ? "bg-primary/10 text-primary" : "bg-surface-container-high text-dark-muted"}`}>{count}</span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
          <input type="text" placeholder="ค้นหาบทสนทนา..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full sm:w-64 pl-10 pr-4 py-2.5 rounded-xl bg-white border border-surface-container-high text-sm text-dark outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-surface-container p-12 text-center">
          <Loader2 className="w-8 h-8 text-gray-300 mx-auto mb-3 animate-spin" />
          <p className="text-sm text-dark-muted">กำลังโหลดบทสนทนา...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-surface-container p-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-surface-dim flex items-center justify-center mx-auto mb-4"><MessageCircle className="w-10 h-10 text-dark-muted/20" /></div>
          <h3 className="text-lg font-display font-semibold text-dark mb-2">ยังไม่มีบทสนทนา</h3>
          <p className="text-sm text-dark-muted mb-4 max-w-md mx-auto">เชื่อมต่อ LINE OA, Facebook Messenger หรือ Instagram เพื่อให้ AI เริ่มตอบลูกค้า</p>
          {/* Channel connection hints */}
          <div className="flex flex-wrap justify-center gap-3 mb-4">
            {(["line", "facebook", "instagram"] as const).map((ch) => {
              const cfg = channelConfig[ch];
              return (
                <div key={ch} className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${cfg.bg} ${cfg.textColor}`}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: cfg.color }}>{cfg.icon}</span>
                  <span className="text-xs font-medium">{cfg.label}</span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-dark-muted/70">อนุมัติคำตอบที่ถูกต้อง · แก้ไขคำตอบที่ผิด · บันทึกเป็นตัวอย่าง</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((conv) => {
            const isCorrecting = correctingId === conv.id;
            const ch = conv.channel || "line";
            const statusColors: Record<string, string> = { pending: "bg-amber-100 text-amber-700", approved: "bg-emerald-100 text-emerald-700", corrected: "bg-blue-100 text-blue-700", featured: "bg-purple-100 text-purple-700" };
            const statusLabels: Record<string, string> = { pending: "รอตรวจ", approved: "อนุมัติ", corrected: "แก้ไขแล้ว", featured: "ตัวอย่างดี" };

            return (
              <div key={conv.id} className="bg-white rounded-2xl shadow-sm border border-surface-container overflow-hidden">
                <div className="px-5 py-3 border-b border-surface-container flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChannelBadge channel={ch} />
                    <span className="text-sm font-medium text-dark">{conv.customerName || "ลูกค้า"}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[conv.status] || statusColors.pending}`}>{statusLabels[conv.status] || "รอตรวจ"}</span>
                  </div>
                  <span className="text-[11px] text-dark-muted">{formatTime(conv.createdAt)}</span>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0"><User className="w-3.5 h-3.5 text-dark-muted" /></div>
                    <div className="bg-surface-dim rounded-xl rounded-tl-sm px-3 py-2 text-sm text-dark max-w-[80%]">{conv.customerMessage}</div>
                  </div>
                  <div className="flex items-start gap-2 justify-end">
                    <div className="bg-primary/10 rounded-xl rounded-tr-sm px-3 py-2 text-sm text-dark max-w-[80%]">
                      {conv.correctedReply || conv.aiReply}
                      {conv.correctedReply && <p className="text-[10px] text-primary mt-1 italic">✏️ แก้ไขจาก: {conv.aiReply}</p>}
                    </div>
                    <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center shrink-0"><Bot className="w-3.5 h-3.5 text-white" /></div>
                  </div>
                </div>

                {isCorrecting && (
                  <div className="px-5 pb-4 space-y-2">
                    <textarea value={correctedReply} onChange={(e) => setCorrectedReply(e.target.value)} placeholder="พิมพ์คำตอบที่ถูกต้อง..." rows={3} className="w-full px-4 py-3 rounded-xl bg-surface-dim border border-surface-container-high text-sm text-dark outline-none focus:ring-2 focus:ring-primary/20 resize-none" autoFocus />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setCorrectingId(null); setCorrectedReply(""); }} className="px-3 py-1.5 rounded-lg text-sm text-dark-muted hover:bg-surface-dim">ยกเลิก</button>
                      <button onClick={() => correctM.mutate({ shopId, correction: { conversationId: conv.id, correctedReply, saveAsExample: true, addToKnowledge: false } })} disabled={!correctedReply.trim() || correctM.isPending} className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50">
                        {correctM.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} บันทึกและสอน AI
                      </button>
                    </div>
                  </div>
                )}

                {!isCorrecting && conv.status === "pending" && (
                  <div className="px-5 pb-4 flex items-center gap-2">
                    <button onClick={() => approveM.mutate({ shopId, conversationId: conv.id })} disabled={approveM.isPending} className="text-xs text-success flex items-center gap-1 px-3 py-1.5 rounded-lg bg-success/10 hover:bg-success/20 font-medium disabled:opacity-50"><ThumbsUp className="w-3 h-3" /> ถูกต้อง</button>
                    <button onClick={() => { setCorrectingId(conv.id); setCorrectedReply(conv.aiReply); }} className="text-xs text-amber flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber/10 hover:bg-amber/20 font-medium"><Pencil className="w-3 h-3" /> แก้ไข</button>
                    <button onClick={() => featureM.mutate({ shopId, conversationId: conv.id })} disabled={featureM.isPending} className="text-xs text-primary flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 font-medium disabled:opacity-50"><Star className="w-3 h-3" /> ตัวอย่าง</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
