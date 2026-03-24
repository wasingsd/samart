"use client";

import { useState, useMemo } from "react";
import {
  Search, Plus, Minus, Trash2, ShoppingCart, Receipt, CreditCard,
  Banknote, ImageIcon, Loader2, Package, ChevronDown,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useShopStore } from "@/stores/useShopStore";
import { getBusinessConfig } from "@/lib/businessConfig";

type MenuItem = {
  id: string; name: string; price: number; category: string;
  description: string; imageURL?: string; inStock: boolean;
};

type OrderItem = MenuItem & { qty: number };

export default function POSPage() {
  const shop = useShopStore((s) => s.shop);
  const biz = getBusinessConfig(shop?.category || "food");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ทั้งหมด");
  const [order, setOrder] = useState<OrderItem[]>([]);
  const [paymentModal, setPaymentModal] = useState(false);

  const { data: items = [], isLoading } = trpc.menu.list.useQuery(undefined);
  const typedItems = (items as MenuItem[]).filter((i) => i.inStock);

  const categories = useMemo(() => {
    const cats = new Set(typedItems.map((i) => i.category).filter(Boolean));
    return ["ทั้งหมด", ...Array.from(cats).sort()];
  }, [typedItems]);

  const filteredItems = typedItems.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "ทั้งหมด" || item.category === categoryFilter;
    return matchSearch && matchCat;
  });

  // Order functions
  const addToOrder = (item: MenuItem) => {
    setOrder((prev) => {
      const existing = prev.find((o) => o.id === item.id);
      if (existing) return prev.map((o) => o.id === item.id ? { ...o, qty: o.qty + 1 } : o);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setOrder((prev) =>
      prev.map((o) => o.id === id ? { ...o, qty: Math.max(0, o.qty + delta) } : o).filter((o) => o.qty > 0)
    );
  };

  const removeItem = (id: string) => setOrder((prev) => prev.filter((o) => o.id !== id));
  const clearOrder = () => setOrder([]);

  const subtotal = order.reduce((sum, o) => sum + o.price * o.qty, 0);
  const totalItems = order.reduce((sum, o) => sum + o.qty, 0);

  const handlePayment = () => {
    setPaymentModal(false);
    clearOrder();
  };

  return (
    <div className="flex h-[calc(100vh-80px)] gap-5 -mb-5 lg:-mb-8">
      {/* Left: Product Grid */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder={`ค้นหา${biz.itemLabel}...`} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
          </div>
        </div>

        {/* Category Chips */}
        <div className="flex gap-2 flex-wrap mb-4">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${categoryFilter === cat ? "bg-[#1A237E] text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pb-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Package className="w-12 h-12 mb-3" />
              <p className="text-sm">ไม่พบ{biz.itemLabel}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredItems.map((item) => {
                const inOrder = order.find((o) => o.id === item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => addToOrder(item)}
                    className={`relative bg-white rounded-xl border overflow-hidden text-left transition-all hover:shadow-md active:scale-[0.98] ${
                      inOrder ? "border-blue-300 ring-2 ring-blue-100" : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    {/* Image */}
                    <div className="aspect-square bg-gray-50 overflow-hidden">
                      {item.imageURL ? (
                        <img src={item.imageURL} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-gray-200" /></div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="p-3">
                      <p className="text-xs font-semibold text-gray-900 truncate">{item.name}</p>
                      <p className="text-sm font-display font-bold text-[#1A237E] mt-0.5">฿{item.price.toLocaleString()}</p>
                    </div>
                    {/* Qty badge */}
                    {inOrder && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#1A237E] text-white text-xs font-bold flex items-center justify-center shadow-lg">
                        {inOrder.qty}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: Order Panel */}
      <div className="hidden lg:flex w-80 xl:w-96 flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Order Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#1A237E]" />
            <h2 className="font-display font-bold text-gray-900">ออเดอร์</h2>
            {totalItems > 0 && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{totalItems}</span>}
          </div>
          {order.length > 0 && (
            <button onClick={clearOrder} className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">ล้าง</button>
          )}
        </div>

        {/* Order Items */}
        <div className="flex-1 overflow-y-auto">
          {order.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-300 p-6">
              <Receipt className="w-12 h-12 mb-3" />
              <p className="text-sm text-gray-400">ยังไม่มีรายการ</p>
              <p className="text-xs text-gray-300 mt-1">กดเลือก{biz.itemLabel}เพื่อเพิ่ม</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {order.map((item) => (
                <div key={item.id} className="px-5 py-3 flex items-center gap-3 group">
                  {/* Thumbnail */}
                  <div className="w-10 h-10 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0">
                    {item.imageURL ? (
                      <img src={item.imageURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-4 h-4 text-gray-200" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">฿{item.price.toLocaleString()} × {item.qty}</p>
                  </div>
                  {/* Qty controls */}
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                    <span className="text-sm font-bold text-gray-900 w-6 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                  </div>
                  <p className="text-sm font-bold text-gray-900 w-16 text-right">฿{(item.price * item.qty).toLocaleString()}</p>
                  <button onClick={() => removeItem(item.id)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Summary */}
        {order.length > 0 && (
          <div className="border-t border-gray-100 p-5 space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>รวม ({totalItems} รายการ)</span>
              <span>฿{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-lg font-display font-bold text-gray-900">
              <span>ยอดรวม</span>
              <span className="text-[#1A237E]">฿{subtotal.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button onClick={() => setPaymentModal(true)} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-colors shadow-sm">
                <Banknote className="w-4 h-4" /> เงินสด
              </button>
              <button onClick={() => setPaymentModal(true)} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#1A237E] to-[#00B4D8] text-white font-semibold text-sm hover:opacity-90 transition-all shadow-sm">
                <CreditCard className="w-4 h-4" /> QR / โอน
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile: floating order summary */}
      {order.length > 0 && (
        <div className="lg:hidden fixed bottom-20 left-4 right-4 z-40">
          <button onClick={() => setPaymentModal(true)} className="w-full flex items-center justify-between py-4 px-6 rounded-2xl bg-[#1A237E] text-white shadow-xl shadow-blue-900/30">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-5 h-5" />
              <span className="font-semibold">{totalItems} รายการ</span>
            </div>
            <span className="font-display font-bold text-lg">฿{subtotal.toLocaleString()}</span>
          </button>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setPaymentModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="font-display font-bold text-xl text-gray-900 mb-1">ยืนยันชำระเงิน</h3>
            <p className="text-sm text-gray-500 mb-6">{totalItems} รายการ</p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="space-y-2">
                {order.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.name} × {item.qty}</span>
                    <span className="font-medium text-gray-900">฿{(item.price * item.qty).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between">
                <span className="font-bold text-gray-900">รวมทั้งสิ้น</span>
                <span className="font-display font-bold text-xl text-[#1A237E]">฿{subtotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setPaymentModal(false)} className="py-3 rounded-xl text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors">ยกเลิก</button>
              <button onClick={handlePayment} className="py-3 rounded-xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors shadow-sm">ชำระเงิน</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
