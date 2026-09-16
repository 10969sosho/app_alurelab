import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  variantId?: string;
  title: string;
  variantTitle?: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, variantId: string | undefined, qty: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(persist((set, get) => ({
  items: [],
  addItem: (newItem) => {
    set((state) => {
      const existingIndex = state.items.findIndex(
        (i) => i.productId === newItem.productId && i.variantId === newItem.variantId
      );

      if (existingIndex > -1) {
        const updated = [...state.items];
        updated[existingIndex].quantity += newItem.quantity;
        return { items: updated };
      }

      return { items: [...state.items, newItem] };
    });
  },
  removeItem: (productId, variantId) => {
    set((state) => ({
      items: state.items.filter(
        (i) => !(i.productId === productId && i.variantId === variantId)
      ),
    }));
  },
  updateQuantity: (productId, variantId, qty) => {
    if (qty <= 0) {
      get().removeItem(productId, variantId);
      return;
    }

    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId && i.variantId === variantId
          ? { ...i, quantity: qty }
          : i
      ),
    }));
  },
  clearCart: () => set({ items: [] }),
  getTotalItems: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
  getSubtotal: () => get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),
}), {
  name: 'alurelab_cart_storage',
}));
