"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  UtensilsCrossed,
  X,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Package,
  Filter,
  Sparkles,
} from "lucide-react";

type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  inStock: boolean;
  tags: string[];
};

const demoCategories = ["ทั้งหมด", "เครื่องดื่ม", "อาหาร", "ของหวาน", "อื่นๆ"];

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ทั้งหมด");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategory, setFormCategory] = useState("เครื่องดื่ม");
  const [formDescription, setFormDescription] = useState("");

  const filteredItems = items.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "ทั้งหมด" || item.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const groupedItems = filteredItems.reduce<Record<string, MenuItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const openAddModal = () => {
    setEditingItem(null);
    setFormName("");
    setFormPrice("");
    setFormCategory("เครื่องดื่ม");
    setFormDescription("");
    setModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormPrice(item.price.toString());
    setFormCategory(item.category);
    setFormDescription(item.description);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!formName || !formPrice) return;
    if (editingItem) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === editingItem.id
            ? { ...i, name: formName, price: parseFloat(formPrice), category: formCategory, description: formDescription }
            : i
        )
      );
    } else {
      const newItem: MenuItem = {
        id: Date.now().toString(),
        name: formName,
        price: parseFloat(formPrice),
        category: formCategory,
        description: formDescription,
        inStock: true,
        tags: [],
      };
      setItems((prev) => [...prev, newItem]);
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const toggleStock = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, inStock: !i.inStock } : i)));
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-display font-bold text-gray-900">เมนูและสินค้า</h1>
          <p className="text-sm text-gray-500 mt-1">จัดการเมนูที่ AI จะแนะนำให้ลูกค้า ({items.length} รายการ)</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#1A237E] to-[#00B4D8] hover:brightness-110 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" /> เพิ่มเมนู
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาเมนู..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="pl-10 pr-10 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all appearance-none cursor-pointer"
          >
            {demoCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Menu Items */}
      {items.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 lg:py-20 px-6 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-5">
            <UtensilsCrossed className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-display font-semibold text-gray-900 mb-2">ยังไม่มีเมนู</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto leading-relaxed">
            เพิ่มเมนูสินค้าเพื่อให้ AI รู้จักและแนะนำให้ลูกค้าได้อย่างถูกต้อง
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#1A237E] to-[#00B4D8] hover:brightness-110 transition-all shadow-md"
          >
            <Plus className="w-4 h-4" /> เพิ่มเมนูแรก
          </button>

          {/* Quick tips */}
          <div className="mt-8 max-w-sm mx-auto text-left">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 text-center">เคล็ดลับ</p>
            <div className="space-y-2">
              <div className="flex items-start gap-2.5 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                <span>ยิ่งกรอกรายละเอียดมาก AI ยิ่งแนะนำได้ดี เช่น ส่วนผสม, ตัวเลือกน้ำตาล</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                <Package className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>จัดหมวดหมู่เมนู เช่น เครื่องดื่ม, อาหาร, ของหวาน เพื่อความเป็นระเบียบ</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedItems).map(([category, catItems]) => (
            <div key={category} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-display font-semibold text-gray-800">{category}</h3>
                <span className="text-xs text-gray-400 ml-1">({catItems.length})</span>
              </div>
              <div className="divide-y divide-gray-50">
                {catItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors ${
                      !item.inStock ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                        {!item.inStock && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-500 font-semibold border border-red-100">
                            หมด
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-md">{item.description}</p>
                      )}
                    </div>
                    <p className="text-sm font-display font-bold text-gray-900 whitespace-nowrap">
                      <span className="text-xs text-gray-400 font-normal">฿</span>
                      {item.price.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => toggleStock(item.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          item.inStock
                            ? "text-emerald-500 hover:bg-emerald-50"
                            : "text-gray-400 hover:bg-gray-100"
                        }`}
                        title={item.inStock ? "ปิดขาย" : "เปิดขาย"}
                      >
                        {item.inStock ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-blue-500 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-display font-semibold text-gray-900 text-lg">
                {editingItem ? "แก้ไขเมนู" : "เพิ่มเมนูใหม่"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold tracking-wider text-gray-500 mb-1.5 uppercase">
                  ชื่อเมนู <span className="text-red-500">*</span>
                </label>
                <input
                  autoFocus
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="เช่น กาแฟ Signature"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold tracking-wider text-gray-500 mb-1.5 uppercase">
                    ราคา (฿) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="85"
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-wider text-gray-500 mb-1.5 uppercase">
                    หมวดหมู่
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all appearance-none cursor-pointer"
                  >
                    {demoCategories.filter((c) => c !== "ทั้งหมด").map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold tracking-wider text-gray-500 mb-1.5 uppercase">
                  คำอธิบาย
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="รายละเอียดเมนู (AI จะใช้ข้อมูลนี้แนะนำลูกค้า)"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
              <button
                onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={!formName || !formPrice}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#1A237E] to-[#00B4D8] hover:brightness-110 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
