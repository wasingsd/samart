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
  MessageCircle,
  Eye,
  Filter,
  MoreVertical,
} from "lucide-react";

type Segment = "all" | "vip" | "regular" | "new" | "dormant";

const segments: { id: Segment; label: string; icon: React.ElementType; count: number; color: string }[] = [
  { id: "all", label: "ทั้งหมด", icon: Users, count: 0, color: "text-dark" },
  { id: "vip", label: "VIP", icon: Crown, count: 0, color: "text-amber" },
  { id: "regular", label: "ประจำ", icon: UserCheck, count: 0, color: "text-success" },
  { id: "new", label: "ใหม่", icon: UserPlus, count: 0, color: "text-secondary" },
  { id: "dormant", label: "หายไป", icon: UserMinus, count: 0, color: "text-danger" },
];

export default function CustomersPage() {
  const [activeSegment, setActiveSegment] = useState<Segment>("all");
  const [search, setSearch] = useState("");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-dark">จัดการลูกค้า</h1>
          <p className="text-sm text-dark-muted mt-1">ดูข้อมูลลูกค้า แบ่งกลุ่ม และส่งข้อความติดตาม</p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white gradient-primary hover:opacity-90 transition-opacity shadow-md">
          <Send className="w-4 h-4" />
          ส่ง Broadcast
        </button>
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
            <Icon className={`w-4 h-4 ${activeSegment === id ? color : "text-dark-muted"}`} />
            {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeSegment === id ? "bg-primary/10 text-primary" : "bg-surface-container text-dark-muted"
            }`}>
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
          placeholder="ค้นหาชื่อ, LINE ID, หรือหมายเหตุ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-surface-container-high text-sm text-dark outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-2xl shadow-sm border border-surface-container p-12 text-center">
        <div className="w-20 h-20 rounded-2xl bg-surface-dim flex items-center justify-center mx-auto mb-4">
          <Users className="w-10 h-10 text-dark-muted/20" />
        </div>
        <h3 className="text-lg font-display font-semibold text-dark mb-2">ยังไม่มีข้อมูลลูกค้า</h3>
        <p className="text-sm text-dark-muted mb-2 max-w-md mx-auto">
          เมื่อลูกค้าเริ่มแชทผ่าน LINE OA ระบบจะจำข้อมูลและแบ่งกลุ่มให้อัตโนมัติ
        </p>
        <div className="mt-6 max-w-sm mx-auto grid grid-cols-2 gap-3 opacity-50">
          <div className="bg-surface-dim rounded-xl p-3 text-left">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-amber/20 flex items-center justify-center">
                <Crown className="w-4 h-4 text-amber" />
              </div>
              <div>
                <p className="text-xs font-semibold text-dark">VIP</p>
                <p className="text-[10px] text-dark-muted">ซื้อ &gt; 5 ครั้ง</p>
              </div>
            </div>
          </div>
          <div className="bg-surface-dim rounded-xl p-3 text-left">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="text-xs font-semibold text-dark">ประจำ</p>
                <p className="text-[10px] text-dark-muted">ซื้อ 2-5 ครั้ง</p>
              </div>
            </div>
          </div>
          <div className="bg-surface-dim rounded-xl p-3 text-left">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-secondary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-dark">ใหม่</p>
                <p className="text-[10px] text-dark-muted">ซื้อ 1 ครั้ง</p>
              </div>
            </div>
          </div>
          <div className="bg-surface-dim rounded-xl p-3 text-left">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-danger/20 flex items-center justify-center">
                <UserMinus className="w-4 h-4 text-danger" />
              </div>
              <div>
                <p className="text-xs font-semibold text-dark">หายไป</p>
                <p className="text-[10px] text-dark-muted">&gt; 30 วัน</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
