'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { CmsBuyerCopy } from '@/components/templates/types';

export const DEFAULT_BUYER_COPY: Required<CmsBuyerCopy> = {
  productBack: 'Kembali ke katalog', productAddToCart: 'Tambah ke keranjang', productBuyNow: 'Beli sekarang', productDetails: 'Detail produk',
  cartTitle: 'Keranjang belanja', cartEmptyTitle: 'Keranjang masih kosong', cartEmptyDescription: 'Pilih produk untuk mulai berbelanja.', cartContinueShopping: 'Lanjut belanja', cartCheckout: 'Lanjut checkout',
  checkoutTitle: 'Checkout', checkoutSubmit: 'Buat pesanan', checkoutSuccessTitle: 'Pesanan diterima', checkoutSuccessDescription: 'Pesanan Anda sudah tercatat.',
  accountTitle: 'Akun saya', accountSignIn: 'Masuk untuk melihat pesanan dan alamat.', accountActiveOrders: 'Pesanan aktif', accountOrderHistory: 'Riwayat pesanan', accountSettings: 'Pengaturan',
  footerNote: 'Belanja aman dengan pembayaran dan pengiriman terpercaya.',
};

export function useBuyerCms(storeSlug: string): Required<CmsBuyerCopy> {
  const [copy, setCopy] = useState(DEFAULT_BUYER_COPY);
  useEffect(() => {
    axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/store`, { headers: { 'X-Store-Slug': storeSlug } })
      .then(({ data }) => setCopy({ ...DEFAULT_BUYER_COPY, ...(data?.data?.settings?.buyerCopy || {}) }))
      .catch(() => undefined);
  }, [storeSlug]);
  return copy;
}
