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
  stock?: number;
  weightGrams?: number;
  storeSlug?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem & { storeSlug: string }) => void;
  removeItem: (productId: string, variantId?: string, storeSlug?: string) => void;
  updateQuantity: (
    productId: string,
    variantId: string | undefined,
    qty: number,
    storeSlug?: string
  ) => void;
  clearCart: (storeSlug?: string) => void;
  getItemsByStore: (storeSlug: string) => CartItem[];
  getTotalItems: (storeSlug?: string) => number;
  getSubtotal: (storeSlug?: string) => number;
}

// Strict per-store scope: without a storeSlug nothing is scoped, with a storeSlug
// only items tagged with that exact slug count (storeless items never show up).
const byStore = (items: CartItem[], storeSlug?: string): CartItem[] =>
  storeSlug === undefined ? items : items.filter((i) => i.storeSlug === storeSlug);

export const useCartStore = create<CartState>()(persist((set, get) => ({
  items: [],
  addItem: (newItem) => {
    set((state) => {
      const existingIndex = state.items.findIndex(
        (i) =>
          i.productId === newItem.productId &&
          i.variantId === newItem.variantId &&
          i.storeSlug === newItem.storeSlug
      );

      const clamp = (qty: number) =>
        typeof newItem.stock === 'number' ? Math.min(qty, newItem.stock) : qty;

      if (existingIndex > -1) {
        const updated = [...state.items];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: clamp(updated[existingIndex].quantity + newItem.quantity),
          stock: newItem.stock ?? updated[existingIndex].stock,
        };
        return { items: updated };
      }

      return { items: [...state.items, { ...newItem, quantity: clamp(newItem.quantity) }] };
    });
  },
  removeItem: (productId, variantId, storeSlug) => {
    set((state) => ({
      items: state.items.filter(
        (i) =>
          !(
            i.productId === productId &&
            i.variantId === variantId &&
            (storeSlug === undefined || i.storeSlug === storeSlug)
          )
      ),
    }));
  },
  updateQuantity: (productId, variantId, qty, storeSlug) => {
    if (qty <= 0) {
      get().removeItem(productId, variantId, storeSlug);
      return;
    }

    set((state) => ({
      items: state.items.map((i) => {
        if (
          i.productId !== productId ||
          i.variantId !== variantId ||
          (storeSlug !== undefined && i.storeSlug !== storeSlug)
        ) {
          return i;
        }
        const nextQty = typeof i.stock === 'number' ? Math.min(qty, i.stock) : qty;
        return { ...i, quantity: nextQty };
      }),
    }));
  },
  clearCart: (storeSlug) =>
    set((state) => ({
      items: storeSlug === undefined
        ? []
        : state.items.filter((i) => i.storeSlug !== storeSlug),
    })),
  getItemsByStore: (storeSlug) => byStore(get().items, storeSlug),
  getTotalItems: (storeSlug) =>
    byStore(get().items, storeSlug).reduce((acc, item) => acc + item.quantity, 0),
  getSubtotal: (storeSlug) =>
    byStore(get().items, storeSlug).reduce((acc, item) => acc + item.price * item.quantity, 0),
}), {
  name: 'alurelab_cart_storage',
}));
