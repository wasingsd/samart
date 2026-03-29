"use client";

import { useState } from "react";
import {
  BarChart3,
  DollarSign,
  ShoppingCart,
  Users,
  Plus,
  Download,
  Package,
  Loader2,
  X,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { trpc } from "@/lib/trpc/client";
import { useShopStore } from "@/stores/useShopStore";

type Period = "7d" | "14d" | "30d";

const periods: { id: Period; label: string }[] = [
  { id: "7d", label: "7 วัน" },
  { id: "14d", label: "14 วัน" },
  { id: "30d", label: "30 วัน" },
];

export default function AnalyticsPage() {
  const shop = useShopStore((s) => s.shop);
  const shopId = shop?.id || "";
  const [period, setPeriod] = useState<Period>("7d");
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [saleAmount, setSaleAmount] = useState("");
  const [saleNote, setSaleNote] = useState("");

  const utils = trpc.useUtils();

  // --- Queries ---
  const { data: overview, isLoading } = trpc.analytics.overview.useQuery(
    { shopId, period },
    { enabled: !!shopId }
  );

  const { data: chartData = [] } = trpc.analytics.dailyBreakdown.useQuery(
    { shopId, period },
    { enabled: !!shopId }
  );

  // --- Mutations ---
  const recordSaleM = trpc.analytics.recordSale.useMutation({
    onSuccess: () => {
      utils.analytics.overview.invalidate();
      utils.analytics.dailyBreakdown.invalidate();
      setShowRecordModal(false);
      setSaleAmount("");
      setSaleNote("");
    },
  });

  const handleRecordSale = () => {
    const amount = parseFloat(saleAmount);
    if (!shopId || isNaN(amount) || amount <= 0) return;
    recordSaleM.mutate({ shopId, amount, note: saleNote || undefined });
  };

  const fmt = (n: number) => `฿${n.toLocaleString()}`;

  const quickStats = [
    {
      label: "รายได้รวม",
      value: overview ? fmt(overview.totalRevenue) : "—",
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "จำนวนออเดอร์",
      value: overview ? overview.orderCount.toString() : "—",
      icon: ShoppingCart,
      color: "text-sky-600",
      bg: "bg-sky-50",
    },
    {
      label: "ค่าเฉลี่ย/ออเดอร์",
      value: overview ? fmt(overview.avgOrderValue) : "—",
      icon: BarChart3,
      color: "text-[#1A237E]",
      bg: "bg-[#1A237E]/5",
    },
    {
      label: "ลูกค้าใหม่",
      value: overview ? overview.newCustomers.toString() : "—",
      icon: Users,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">วิเคราะห์ยอดขาย</h1>
          <p className="text-sm text-gray-500 mt-1">ดูผลประกอบการและเทรนด์ของร้าน</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {periods.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setPeriod(id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  period === id
                    ? "bg-white text-[#1A237E] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowRecordModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-[#1A237E] to-[#00B4D8] hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus className="w-4 h-4" />
            บันทึกยอด
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickStats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              {isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-300" />}
            </div>
            <p className="text-2xl font-display font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-display font-semibold text-gray-900">กราฟยอดขาย</h3>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded-full bg-gradient-to-r from-[#1A237E] to-[#00B4D8]" />
              รายได้
            </span>
          </div>
        </div>
        <div className="p-5">
          {chartData.length > 0 && chartData.some((d) => d.revenue > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1A237E" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1A237E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `฿${v.toLocaleString()}`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 text-sm">
                        <p className="font-semibold text-gray-800 mb-1">{label}</p>
                        <p className="text-[#1A237E]">รายได้: ฿{(payload[0].value as number).toLocaleString()}</p>
                        <p className="text-gray-500">ออเดอร์: {payload[0].payload.orders}</p>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1A237E"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[280px]">
              <BarChart3 className="w-16 h-16 text-gray-200 mb-4" />
              <p className="text-sm text-gray-500 font-medium">ยังไม่มีข้อมูลยอดขาย</p>
              <p className="text-xs text-gray-400 mt-1">เพิ่มยอดขายด้วยปุ่ม &quot;บันทึกยอด&quot; หรือรับออเดอร์จาก LINE</p>
              <button
                onClick={() => setShowRecordModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-[#1A237E] bg-[#1A237E]/5 hover:bg-[#1A237E]/10 transition-colors mt-4"
              >
                <Plus className="w-3.5 h-3.5" /> บันทึกยอดแรก
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-display font-semibold text-gray-900">สินค้าขายดี</h3>
        </div>
        {overview && overview.topProducts.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {overview.topProducts.map((product, idx) => (
              <div key={idx} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                  <p className="text-xs text-gray-400">{product.quantity} ชิ้น</p>
                </div>
                <p className="text-sm font-display font-bold text-gray-900">
                  ฿{product.revenue.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500">จะแสดงเมื่อมีข้อมูลยอดขาย</p>
          </div>
        )}
      </div>

      {/* Record Sale Modal */}
      {showRecordModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowRecordModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-display font-semibold text-gray-900 text-lg">บันทึกยอดขาย</h3>
              <button onClick={() => setShowRecordModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold tracking-wider text-gray-500 mb-1.5 uppercase">
                  จำนวนเงิน (฿) *
                </label>
                <input
                  autoFocus
                  type="number"
                  value={saleAmount}
                  onChange={(e) => setSaleAmount(e.target.value)}
                  placeholder="เช่น 1500"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold tracking-wider text-gray-500 mb-1.5 uppercase">
                  หมายเหตุ
                </label>
                <input
                  type="text"
                  value={saleNote}
                  onChange={(e) => setSaleNote(e.target.value)}
                  placeholder="เช่น ยอดขายหน้าร้าน"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
              </div>
              {recordSaleM.isError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  เกิดข้อผิดพลาด กรุณาลองอีกครั้ง
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
              <button
                onClick={() => setShowRecordModal(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleRecordSale}
                disabled={!saleAmount || parseFloat(saleAmount) <= 0 || recordSaleM.isPending}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#1A237E] to-[#00B4D8] hover:opacity-90 shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {recordSaleM.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
