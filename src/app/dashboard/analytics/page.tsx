"use client";

import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  ArrowUpRight,
  Calendar,
  Plus,
  Download,
  Package,
} from "lucide-react";

type Period = "7d" | "14d" | "30d";

const periods: { id: Period; label: string }[] = [
  { id: "7d", label: "7 วัน" },
  { id: "14d", label: "14 วัน" },
  { id: "30d", label: "30 วัน" },
];

const quickStats = [
  { label: "รายได้รวม", value: "฿0", change: "-", trend: "neutral", icon: DollarSign, color: "text-success", bg: "bg-success/10" },
  { label: "จำนวนออเดอร์", value: "0", change: "-", trend: "neutral", icon: ShoppingCart, color: "text-secondary", bg: "bg-secondary/10" },
  { label: "ค่าเฉลี่ย/ออเดอร์", value: "฿0", change: "-", trend: "neutral", icon: BarChart3, color: "text-primary", bg: "bg-primary/10" },
  { label: "ลูกค้าใหม่", value: "0", change: "-", trend: "neutral", icon: Users, color: "text-amber", bg: "bg-amber/10" },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("7d");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-dark">วิเคราะห์ยอดขาย</h1>
          <p className="text-sm text-dark-muted mt-1">ดูผลประกอบการและเทรนด์ของร้าน</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-surface-container rounded-xl p-1">
            {periods.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setPeriod(id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  period === id
                    ? "bg-white text-primary shadow-sm"
                    : "text-dark-muted hover:text-dark"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white gradient-primary hover:opacity-90 transition-opacity shadow-sm">
            <Plus className="w-4 h-4" />
            บันทึกยอด
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickStats.map(({ label, value, change, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-surface-container">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <p className="text-2xl font-display font-bold text-dark">{value}</p>
            <p className="text-xs text-dark-muted mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Chart Placeholder */}
      <div className="bg-white rounded-xl shadow-sm border border-surface-container overflow-hidden">
        <div className="p-5 border-b border-surface-container flex items-center justify-between">
          <h3 className="font-display font-semibold text-dark">กราฟยอดขาย</h3>
          <button className="text-xs text-dark-muted flex items-center gap-1 hover:text-dark transition-colors">
            <Download className="w-3.5 h-3.5" />
            ส่งออก CSV
          </button>
        </div>
        <div className="p-8 flex items-center justify-center min-h-[280px]">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-dark-muted/15 mx-auto mb-4" />
            <p className="text-sm text-dark-muted font-medium">ยังไม่มีข้อมูลยอดขาย</p>
            <p className="text-xs text-dark-muted/70 mt-1">เพิ่มยอดขายด้วยปุ่ม "บันทึกยอด" หรือ import CSV</p>
            <div className="flex justify-center gap-2 mt-4">
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 transition-colors">
                <Plus className="w-3.5 h-3.5" /> บันทึกยอดแรก
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-dark-muted bg-surface-dim hover:bg-surface-container transition-colors">
                <Download className="w-3.5 h-3.5" /> Import CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-xl shadow-sm border border-surface-container overflow-hidden">
        <div className="p-5 border-b border-surface-container">
          <h3 className="font-display font-semibold text-dark">สินค้าขายดี</h3>
        </div>
        <div className="p-8 text-center">
          <Package className="w-12 h-12 text-dark-muted/15 mx-auto mb-3" />
          <p className="text-sm text-dark-muted">จะแสดงเมื่อมีข้อมูลยอดขาย</p>
        </div>
      </div>
    </div>
  );
}
