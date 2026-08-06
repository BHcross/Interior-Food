import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/lib/types";

interface CartState {
  merchantId: string | null;
  merchantName: string | null;
  items: CartItem[];
  addItem: (merchantId: string, merchantName: string, item: CartItem) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      merchantId: null,
      merchantName: null,
      items: [],

      addItem: (merchantId, merchantName, item) => {
        const state = get();

        // Carrinho é de uma loja por vez: trocar de loja limpa o carrinho.
        if (state.merchantId && state.merchantId !== merchantId) {
          set({ merchantId, merchantName, items: [item] });
          return;
        }

        const existing = state.items.find((i) => i.productId === item.productId);
        if (existing) {
          set({
            merchantId,
            merchantName,
            items: state.items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i,
            ),
          });
        } else {
          set({ merchantId, merchantName, items: [...state.items, item] });
        }
      },

      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),

      setQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.productId !== productId)
              : state.items.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
        })),

      clear: () => set({ merchantId: null, merchantName: null, items: [] }),
    }),
    { name: "cart-storage" },
  ),
);
