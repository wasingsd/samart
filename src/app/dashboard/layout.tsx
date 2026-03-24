"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { useAuth } from "@/hooks/useAuth";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { trpc } from "@/lib/trpc/client";
import { useShopStore } from "@/stores/useShopStore";
import { Loader2, ChevronRight } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const setShop = useShopStore((s) => s.setShop);
  const setShopLoading = useShopStore((s) => s.setLoading);

  // Fetch shop data when user is authenticated
  const { data: shopData, isLoading: shopLoading, isFetched } = trpc.shop.getByOwner.useQuery(
    undefined,
    { enabled: !!user && !loading }
  );

  // Sync shop data to store
  useEffect(() => {
    if (isFetched) {
      setShop(shopData ? (shopData as any) : null);
      setShopLoading(false);
    } else {
      setShopLoading(shopLoading);
    }
  }, [shopData, shopLoading, isFetched, setShop, setShopLoading]);

  // Redirect to login if not authenticated (skip when Firebase not configured)
  useEffect(() => {
    if (!loading && !user && isFirebaseConfigured) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!user && isFirebaseConfigured) return null;

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Expand button — rendered OUTSIDE sidebar so it's never clipped */}
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="hidden lg:flex fixed top-5 left-[56px] z-50 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-lg items-center justify-center text-gray-500 hover:text-gray-800 hover:shadow-xl transition-all"
          title="เปิดเมนู"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuToggle={() => setSidebarOpen(true)} />

        <main className="flex-1 p-5 lg:p-8 pb-20 lg:pb-8 overflow-y-auto">
          {children}
        </main>

        <MobileNav />
      </div>
    </div>
  );
}
