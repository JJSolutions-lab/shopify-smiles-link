import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ShopifyProduct } from "@/lib/shopify";

export interface CartItem {
  productId: string;
  productHandle: string;
  productTitle: string;
  image: string | null;
  variantId: string;
  variantTitle: string;
  selectedOptions: Array<{ name: string; value: string }>;
  price: { amount: string; currencyCode: string };
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: ShopifyProduct, variantIndex?: number, qty?: number) => void;
  removeItem: (variantId: string) => void;
  setQuantity: (variantId: string, qty: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
  totalItems: () => number;
  totalAmount: () => number;
  currency: () => string;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (product, variantIndex = 0, qty = 1) => {
        const variant = product.variants.edges[variantIndex]?.node;
        if (!variant) return;
        const items = [...get().items];
        const existing = items.find((i) => i.variantId === variant.id);
        if (existing) {
          existing.quantity += qty;
        } else {
          items.push({
            productId: product.id,
            productHandle: product.handle,
            productTitle: product.title,
            image: product.featuredImage?.url ?? null,
            variantId: variant.id,
            variantTitle: variant.title,
            selectedOptions: variant.selectedOptions,
            price: variant.price,
            quantity: qty,
          });
        }
        set({ items, isOpen: true });
      },
      removeItem: (variantId) => set({ items: get().items.filter((i) => i.variantId !== variantId) }),
      setQuantity: (variantId, qty) => {
        if (qty <= 0) return set({ items: get().items.filter((i) => i.variantId !== variantId) });
        set({ items: get().items.map((i) => (i.variantId === variantId ? { ...i, quantity: qty } : i)) });
      },
      clear: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set({ isOpen: !get().isOpen }),
      totalItems: () => get().items.reduce((s, i) => s + i.quantity, 0),
      totalAmount: () => get().items.reduce((s, i) => s + parseFloat(i.price.amount) * i.quantity, 0),
      currency: () => get().items[0]?.price.currencyCode ?? "USD",
    }),
    {
      name: "elegantero-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
    },
  ),
);
