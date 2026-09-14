import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BuyerProfile {
  id: string;
  phoneNumber: string;
  fullName: string;
  email?: string | null;
  defaultAddress?: {
    detail?: string;
    areaId?: string;
    areaName?: string;
    postalCode?: string;
  } | null;
  riskScore?: string | number;
}

interface BuyerState {
  buyer: BuyerProfile | null;
  token: string | null;
  setBuyer: (buyer: BuyerProfile, token?: string) => void;
  updateAddress: (address: BuyerProfile['defaultAddress']) => void;
  logout: () => void;
}

export const useBuyerStore = create<BuyerState>()(
  persist(
    (set) => ({
      buyer: null,
      token: null,
      setBuyer: (buyer, token) =>
        set((state) => ({
          buyer,
          token: token ?? state.token,
        })),
      updateAddress: (defaultAddress) =>
        set((state) => ({
          buyer: state.buyer ? { ...state.buyer, defaultAddress } : null,
        })),
      logout: () => set({ buyer: null, token: null }),
    }),
    {
      name: 'alurelab_buyer_session',
    }
  )
);
