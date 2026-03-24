"use client";

import { useState } from "react";
import {
  Users,
  Search,
  Crown,
  UserCheck,
  UserPlus,
  UserMinus,
  Send,
  Plus,
  Phone,
  Eye,
  X,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useShopStore } from "@/stores/useShopStore";

type Segment = "all" | "vip" | "regular" | "new" | "dormant";

const segmentConfig: {
  id: Segment;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { id: "all", label: "ทั้งหมด", icon: Users, color: "text-dark" },
  { id: "vip", label: "VIP", icon: Crown, color: "text-amber" },
  { id: "regular", label: "ประจำ", icon: UserCheck, color: "text-success" },
  { id: "new", label: "ใหม่", icon: UserPlus, color: "text-secondary" },
  { id: "dormant", label: "หายไป", icon: UserMinus, color: "text-danger" },
];

const channelConfig: Record<
  string,
  { label: string; color: string; bg: string; textColor: string; icon: string }
> = {
  line: {
    label: "LINE",
    color: "#06C755",
    bg: "bg-[#06C755]/10",
    textColor: "text-[#06C755]",
    icon: "L",
  },
  facebook: {
    label: "Facebook",
    color: "#1877F2",
    bg: "bg-[#1877F2]/10",
    textColor: "text-[#1877F2]",
    icon: "f",
  },
  instagram: {
    label: "Instagram",
    color: "#E4405F",
    bg: "bg-[#E4405F]/10",
    textColor: "text-[#E4405F]",
    icon: "IG",
  },
};

type ChannelData = {
  userId?: string;
  displayName?: string;
  pictureURL?: string;
  connectedAt?: unknown;
  lastContactAt?: unknown;
};

type CustomerItem = {
  id: string;
  phone?: string;
  displayName?: string;
  pictureURL?: string;
  segment?: string;
  source?: string;
  totalSpent?: number;
  orderCount?: number;
  notes?: string;
  channels?: Record<string, ChannelData>;
  firstContactAt?: { seconds?: number } | string | Date;
  updatedAt?: { seconds?: number } | string | Date;
};

export default function CustomersPage() {
  const shop = useShopStore((s) => s.shop);
  const shopId = shop?.id ?? "";

  const [activeSegment, setActiveSegment] = useState<Segment>("all");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);

  // Form state
  const [formPhone, setFormPhone] = useState("");
  const [formName, setFormName] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // tRPC queries
  const { data: customers, isLoading } = trpc.customer.list.useQuery(
    { shopId, segment: activeSegment, search: search || undefined },
    { enabled: !!shopId }
  );
  const { data: counts } = trpc.customer.segmentCounts.useQuery(
    { shopId },
    { enabled: !!shopId }
  );

  const utils = trpc.useUtils();
  const invalidate = () => {
    utils.customer.list.invalidate();
    utils.customer.segmentCounts.invalidate();
  };

  const createM = trpc.customer.create.useMutation({
    onSuccess: () => {
      invalidate();
      setShowAddModal(false);
      setFormPhone("");
      setFormName("");
      setFormNotes("");
    },
  });

  const segments = segmentConfig.map((s) => ({
    ...s,
    count: s.id === "all" ? counts?.all ?? 0 : counts?.[s.id] ?? 0,
  }));

  const items = (customers ?? []) as CustomerItem[];

  const formatTime = (ts?: { seconds?: number } | string | Date) => {
    if (!ts) return "";
    try {
      const d =
        typeof ts === "object" && ts !== null && "seconds" in ts
          ? new Date((ts.seconds ?? 0) * 1000)
          : new Date(ts as string | Date);
      return d.toLocaleDateString("th-TH", {
        timeZone: "Asia/Bangkok",
        day: "numeric",
        month: "short",
        year: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const ChannelBadges = ({ channels }: { channels?: Record<string, ChannelData> }) => {
    if (!channels) return null;
    return (
      <div className="flex gap-1">
        {Object.entries(channels).map(([ch, info]) => {
          if (!info?.userId) return null;
          const cfg = channelConfig[ch];
          if (!cfg) return null;
          return (
            <span
              key={ch}
              title={`${cfg.label}: ${info.displayName || "—"}`}
              className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[8px] font-bold cursor-help`}
              style={{ backgroundColor: cfg.color }}
            >
              {cfg.icon}
            </span>
          );
        })}
      </div>
    );
  };

  const segmentColors: Record<string, string> = {
    new: "bg-secondary/10 text-secondary",
    regular: "bg-success/10 text-success",
    vip: "bg-amber/10 text-amber",
    dormant: "bg-danger/10 text-danger",
  };

  const segmentLabels: Record<string, string> = {
    new: "ใหม่",
    regular: "ประจำ",
    vip: "VIP",
    dormant: "หายไป",
  };

  if (!shopId)
    return (
      <div className="flex items-center justify-center min-h-[400px] text-gray-400">
        <p>กรุณาสร้างร้านก่อนใช้งาน</p>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-dark">
            จัดการลูกค้า
          </h1>
          <p className="text-sm text-dark-muted mt-1">
            ดูข้อมูลลูกค้า แบ่งกลุ่ม เบอร์โทร และข้อมูลช่องทาง LINE / Facebook /
            Instagram
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white gradient-primary hover:opacity-90 transition-opacity shadow-md"
          >
            <Plus className="w-4 h-4" />
            เพิ่มลูกค้า
          </button>
        </div>
      </div>

      {/* Segment Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {segments.map(({ id, label, icon: Icon, count, color }) => (
          <button
            key={id}
            onClick={() => setActiveSegment(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap border ${
              activeSegment === id
                ? "bg-white text-dark border-primary/30 shadow-sm"
                : "bg-white/50 text-dark-muted border-surface-container hover:border-surface-container-high"
            }`}
          >
            <Icon
              className={`w-4 h-4 ${activeSegment === id ? color : "text-dark-muted"}`}
            />
            {label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeSegment === id
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-container text-dark-muted"
              }`}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
        <input
          type="text"
          placeholder="ค้นหาชื่อ, เบอร์โทร, หมายเหตุ, หรือชื่อช่องทาง..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-surface-container-high text-sm text-dark outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-surface-container p-12 text-center">
          <Loader2 className="w-8 h-8 text-gray-300 mx-auto mb-3 animate-spin" />
          <p className="text-sm text-dark-muted">กำลังโหลดข้อมูลลูกค้า...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-surface-container p-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-surface-dim flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-dark-muted/20" />
          </div>
          <h3 className="text-lg font-display font-semibold text-dark mb-2">
            ยังไม่มีข้อมูลลูกค้า
          </h3>
          <p className="text-sm text-dark-muted mb-2 max-w-md mx-auto">
            กดปุ่ม &quot;เพิ่มลูกค้า&quot; เพื่อเพิ่มด้วยตัวเอง
            หรือเมื่อลูกค้าเริ่มแชทผ่าน LINE / Facebook / Instagram
            ระบบจะบันทึกให้อัตโนมัติ
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white gradient-primary hover:opacity-90 transition-opacity shadow-md"
          >
            <Plus className="w-4 h-4" />
            เพิ่มลูกค้าคนแรก
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-surface-container overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_140px_100px_100px_80px_50px] gap-3 px-5 py-3 border-b border-surface-container bg-surface-dim/50 text-xs font-semibold text-dark-muted uppercase tracking-wider">
            <span>ลูกค้า</span>
            <span>เบอร์โทร</span>
            <span>ช่องทาง</span>
            <span>ยอดรวม</span>
            <span>กลุ่ม</span>
            <span />
          </div>

          {items.map((cust) => (
            <div
              key={cust.id}
              className="grid grid-cols-1 sm:grid-cols-[1fr_140px_100px_100px_80px_50px] gap-3 px-5 py-4 border-b border-surface-container last:border-b-0 hover:bg-surface-dim/30 transition-colors items-center"
            >
              {/* Name + avatar */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {cust.pictureURL ? (
                    <img
                      src={cust.pictureURL}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-primary">
                      {(cust.displayName || "?")[0]}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-dark truncate">
                    {cust.displayName || "—"}
                  </p>
                  <p className="text-[11px] text-dark-muted">
                    สั่ง {cust.orderCount ?? 0} ครั้ง · {formatTime(cust.updatedAt)}
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-1.5 text-sm text-dark">
                {cust.phone ? (
                  <>
                    <Phone className="w-3.5 h-3.5 text-dark-muted" />
                    <span>{cust.phone}</span>
                  </>
                ) : (
                  <span className="text-xs text-dark-muted/50 italic">
                    ยังไม่มีเบอร์
                  </span>
                )}
              </div>

              {/* Channel badges */}
              <ChannelBadges channels={cust.channels} />

              {/* Total spent */}
              <p className="text-sm font-medium text-dark">
                ฿{(cust.totalSpent ?? 0).toLocaleString()}
              </p>

              {/* Segment badge */}
              <span
                className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-semibold w-fit ${
                  segmentColors[cust.segment || "new"]
                }`}
              >
                {segmentLabels[cust.segment || "new"]}
              </span>

              {/* View button */}
              <button
                onClick={() => setSelectedCustomer(cust)}
                className="text-dark-muted hover:text-primary transition-colors"
                title="ดูรายละเอียด"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ===== Add Customer Modal ===== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-container">
              <h2 className="text-lg font-display font-bold text-dark">
                เพิ่มลูกค้าใหม่
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-dark-muted hover:text-dark transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-1.5">
                  เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
                  <input
                    type="tel"
                    placeholder="0812345678"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-surface-container-high text-sm text-dark outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1.5">
                  ชื่อลูกค้า <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="ชื่อ-นามสกุล หรือชื่อเล่น"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-surface-container-high text-sm text-dark outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-1.5">
                  หมายเหตุ
                </label>
                <textarea
                  placeholder="ข้อมูลเพิ่มเติม เช่น สิ่งที่ชอบ, แพ้อาหาร..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-surface-container-high text-sm text-dark outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                />
              </div>
              {createM.error && (
                <p className="text-sm text-red-500">
                  {createM.error.message}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-surface-container bg-surface-dim/30">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-sm text-dark-muted hover:bg-surface-dim transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={() =>
                  createM.mutate({
                    shopId,
                    customer: {
                      phone: formPhone,
                      displayName: formName,
                      notes: formNotes || undefined,
                    },
                  })
                }
                disabled={!formPhone.trim() || !formName.trim() || createM.isPending}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white gradient-primary hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {createM.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Customer Detail Modal ===== */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-container">
              <h2 className="text-lg font-display font-bold text-dark">
                ข้อมูลลูกค้า
              </h2>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-dark-muted hover:text-dark transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Profile header */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {selectedCustomer.pictureURL ? (
                    <img
                      src={selectedCustomer.pictureURL}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-bold text-primary">
                      {(selectedCustomer.displayName || "?")[0]}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-dark">
                    {selectedCustomer.displayName || "—"}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedCustomer.phone ? (
                      <span className="text-sm text-dark-muted flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {selectedCustomer.phone}
                      </span>
                    ) : (
                      <span className="text-xs text-dark-muted/50 italic">
                        ยังไม่มีเบอร์โทร
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        segmentColors[selectedCustomer.segment || "new"]
                      }`}
                    >
                      {segmentLabels[selectedCustomer.segment || "new"]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-surface-dim rounded-xl p-3 text-center">
                  <p className="text-xs text-dark-muted">ยอดรวม</p>
                  <p className="text-lg font-bold text-dark mt-1">
                    ฿{(selectedCustomer.totalSpent ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-surface-dim rounded-xl p-3 text-center">
                  <p className="text-xs text-dark-muted">สั่งซื้อ</p>
                  <p className="text-lg font-bold text-dark mt-1">
                    {selectedCustomer.orderCount ?? 0} ครั้ง
                  </p>
                </div>
                <div className="bg-surface-dim rounded-xl p-3 text-center">
                  <p className="text-xs text-dark-muted">แหล่งที่มา</p>
                  <p className="text-sm font-bold text-dark mt-1.5">
                    {selectedCustomer.source === "manual"
                      ? "เพิ่มเอง"
                      : selectedCustomer.source?.toUpperCase() || "—"}
                  </p>
                </div>
              </div>

              {/* Channel details */}
              <div>
                <h4 className="text-sm font-semibold text-dark mb-3">
                  ช่องทางที่เชื่อมต่อ
                </h4>
                {selectedCustomer.channels &&
                Object.entries(selectedCustomer.channels).some(
                  ([, v]) => v?.userId
                ) ? (
                  <div className="space-y-2">
                    {Object.entries(selectedCustomer.channels).map(
                      ([ch, info]) => {
                        if (!info?.userId) return null;
                        const cfg = channelConfig[ch];
                        if (!cfg) return null;
                        return (
                          <div
                            key={ch}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl ${cfg.bg}`}
                          >
                            <span
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: cfg.color }}
                            >
                              {cfg.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-semibold ${cfg.textColor}`}
                              >
                                {cfg.label}
                              </p>
                              <p className="text-xs text-dark-muted truncate">
                                {info.displayName || "—"}
                              </p>
                            </div>
                            <MessageCircle
                              className={`w-4 h-4 ${cfg.textColor} opacity-50`}
                            />
                          </div>
                        );
                      }
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-dark-muted/50 italic">
                    ยังไม่ได้เชื่อมต่อช่องทางใดๆ
                  </p>
                )}
              </div>

              {/* Notes */}
              {selectedCustomer.notes && (
                <div>
                  <h4 className="text-sm font-semibold text-dark mb-2">
                    หมายเหตุ
                  </h4>
                  <p className="text-sm text-dark-muted bg-surface-dim rounded-xl px-4 py-3">
                    {selectedCustomer.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-surface-container bg-surface-dim/30">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-dark-muted hover:bg-surface-dim transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
