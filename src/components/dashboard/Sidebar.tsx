"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Brain,
  MessageCircle,
  Pencil,
  BarChart3,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  X,
  Sparkles,
  ShoppingCart,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useShopStore } from "@/stores/useShopStore";
import { getBusinessConfig } from "@/lib/businessConfig";
import { trpc } from "@/lib/trpc/client";

/*
  UX/UI Guidelines applied:
  - Touch targets: 48px min height (Material Design 3)
  - Visual grouping: Primary nav / Secondary nav separated
  - Consistent icon size: 20px
  - Active state: solid background + left accent bar
  - Hover: subtle bg change
  - Sidebar width: 256px (Material standard)
*/

const secondaryNav = [
  { href: "/dashboard/content", label: "โพสต์", icon: Pencil },
  { href: "/dashboard/analytics", label: "ยอดขาย", icon: BarChart3 },
  { href: "/dashboard/customers", label: "ลูกค้า", icon: Users },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ isOpen, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const shop = useShopStore((s) => s.shop);
  const biz = getBusinessConfig(shop?.category || "food");

  const primaryNav = [
    { href: "/dashboard", label: "หน้าหลัก", icon: LayoutDashboard },
    { href: "/dashboard/menu", label: biz.itemLabel, icon: biz.icon },
    { href: "/dashboard/pos", label: "POS", icon: ShoppingCart },
    { href: "/dashboard/knowledge", label: "ศูนย์ AI", icon: Brain },
    { href: "/dashboard/chat-logs", label: "แชท", icon: MessageCircle },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const renderNavItem = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) => {
    const active = isActive(href);
    return (
      <Link
        key={href}
        href={href}
        onClick={onClose}
        className={`
          relative flex items-center gap-3 h-11 rounded-lg text-sm font-medium
          transition-all duration-150 group
          ${collapsed ? "justify-center mx-auto w-11" : "px-3 mx-2"}
          ${active
            ? "bg-white/[0.12] text-white"
            : "text-gray-400 hover:bg-white/[0.06] hover:text-gray-200"
          }
        `}
      >
        {/* Active indicator bar */}
        {active && !collapsed && (
          <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[#00B4D8]" />
        )}

        <Icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-[#00B4D8]" : "text-gray-500 group-hover:text-gray-400"}`} />

        {!collapsed && (
          <span className={active ? "text-white" : ""}>{label}</span>
        )}

        {/* Tooltip for collapsed */}
        {collapsed && (
          <span className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-50 font-medium border border-white/10">
            {label}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen z-50 flex flex-col
          transition-all duration-300 ease-in-out
          bg-[#111827]
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:h-full lg:z-auto
          ${collapsed ? "lg:w-[68px]" : "lg:w-64"}
          w-72
        `}
      >
        {/* ─── Logo ─── */}
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} px-4 h-16 border-b border-white/[0.08]`}>
          <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3F51B5] to-[#00B4D8] flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
              <Brain className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-[15px] font-display font-bold text-white tracking-wide leading-tight">SAMART</h1>
                <p className="text-[10px] text-gray-500 leading-tight">AI สมองร้านค้า</p>
              </div>
            )}
          </Link>

          {/* Mobile close */}
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>

          {/* Desktop collapse */}
          {!collapsed && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex w-7 h-7 rounded-lg hover:bg-white/[0.08] items-center justify-center text-gray-500 hover:text-gray-300 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ─── Navigation ─── */}
        <nav className="flex-1 overflow-y-auto py-4">
          {/* Primary nav */}
          {!collapsed && (
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-[0.1em] px-5 mb-2">
              หลัก
            </p>
          )}
          <div className="space-y-0.5">
            {primaryNav.map(renderNavItem)}
          </div>

          {/* Divider */}
          <div className={`my-4 ${collapsed ? "mx-3" : "mx-5"} border-t border-white/[0.06]`} />

          {/* Secondary nav */}
          {!collapsed && (
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-[0.1em] px-5 mb-2">
              เครื่องมือ
            </p>
          )}
          <div className="space-y-0.5">
            {secondaryNav.map(renderNavItem)}
          </div>

          {/* Divider */}
          <div className={`my-4 ${collapsed ? "mx-3" : "mx-5"} border-t border-white/[0.06]`} />

          {/* Settings (standalone) */}
          {renderNavItem({ href: "/dashboard/settings", label: "ตั้งค่า", icon: Settings })}
        </nav>

        {/* ─── Bottom ─── */}
        <div className="border-t border-white/[0.08] p-3">
          {/* Credit balance */}
          {!collapsed && (
            <CreditIndicator shopId={shop?.id || ""} />
          )}

          {/* Logout */}
          <button
            onClick={() => signOut()}
            className={`
              flex items-center gap-3 h-11 rounded-lg text-sm font-medium w-full
              text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all
              ${collapsed ? "justify-center" : "px-3"}
            `}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>ออกจากระบบ</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

function CreditIndicator({ shopId }: { shopId: string }) {
  const { data } = trpc.billing.getBalance.useQuery(
    { shopId },
    { enabled: !!shopId, refetchInterval: 60000 }
  );

  const balance = data?.creditBalance ?? 0;
  const isLow = balance < 50;

  return (
    <Link
      href="/dashboard/settings?tab=credits"
      className={`mb-3 p-3 rounded-xl block transition-colors ${
        isLow
          ? "bg-gradient-to-r from-red-500/10 to-red-400/5 border border-red-500/15 hover:border-red-500/30"
          : "bg-gradient-to-r from-[#00B4D8]/10 to-[#00B4D8]/5 border border-[#00B4D8]/10 hover:border-[#00B4D8]/25"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className={`text-xs font-semibold flex items-center gap-1 ${isLow ? "text-red-400" : "text-[#00B4D8]"}`}>
          <Sparkles className="w-3 h-3" /> เครดิต
        </p>
        <p className={`text-sm font-bold ${isLow ? "text-red-300" : "text-white"}`}>
          {balance.toLocaleString()}
        </p>
      </div>
      {isLow && (
        <p className="text-[10px] text-red-400/80 mt-1">เครดิตเหลือน้อย — กดเพื่อเติม</p>
      )}
    </Link>
  );
}
