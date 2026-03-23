"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  MessageCircle,
  BarChart3,
  Settings,
} from "lucide-react";

const mobileNavItems = [
  { href: "/dashboard", label: "หน้าหลัก", icon: LayoutDashboard },
  { href: "/dashboard/menu", label: "เมนู", icon: UtensilsCrossed },
  { href: "/dashboard/chat-logs", label: "แชท", icon: MessageCircle },
  { href: "/dashboard/analytics", label: "ยอดขาย", icon: BarChart3 },
  { href: "/dashboard/settings", label: "ตั้งค่า", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-surface-container-high lg:hidden safe-area-bottom">
      <div className="grid grid-cols-5 h-16">
        {mobileNavItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                active
                  ? "text-primary"
                  : "text-dark-muted hover:text-dark"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "text-primary" : ""}`} />
              <span className="text-[10px] font-medium leading-tight">{label}</span>
              {active && (
                <div className="absolute top-0 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
