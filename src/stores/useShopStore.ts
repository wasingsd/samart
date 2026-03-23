import { create } from "zustand";
import type { ShopDoc } from "@/types";

interface ShopStore {
  shop: ShopDoc | null;
  loading: boolean;
  setShop: (shop: ShopDoc | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useShopStore = create<ShopStore>((set) => ({
  shop: null,
  loading: true,
  setShop: (shop) => set({ shop }),
  setLoading: (loading) => set({ loading }),
}));
