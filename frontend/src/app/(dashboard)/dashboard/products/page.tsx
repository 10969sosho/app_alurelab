'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import api from '@/lib/api';
import { formatRupiah } from '@/lib/utils';

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Fetch products
  const { data, isLoading } = useQuery({
    queryKey: ['merchant-products', search, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', page.toString());
      params.append('per_page', '10');

      const res = await api.get(`/merchant/products?${params.toString()}`);
      return res.data;
    },
  });

  // Toggle status mutation
  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/merchant/products/${id}/toggle-status`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Status produk diperbarui');
      queryClient.invalidateQueries({ queryKey: ['merchant-products'] });
    },
    onError: () => {
      toast.error('Gagal memperbarui status');
    },
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/merchant/products/${id}`);
    },
    onSuccess: () => {
      toast.success('Produk berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['merchant-products'] });
    },
    onError: () => {
      toast.error('Gagal menghapus produk');
    },
  });

  const products = data?.data || [];
  const total = data?.total || 0;
  const lastPage = data?.last_page || 1;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Katalog Produk</h1>
          <p className="text-sm text-slate-500">
            Total {total} produk terdaftar di toko Anda
          </p>
        </div>

        <Link
          href="/dashboard/products/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Produk
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari nama produk atau SKU..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-emerald-500"
          >
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Product List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
              <Package className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-800">Tidak ada produk ditemukan</h3>
            <p className="text-sm text-slate-500 max-w-sm mt-1">
              Mulai tambahkan produk ke etalase toko Anda untuk mulai menerima pesanan.
            </p>
            <Link
              href="/dashboard/products/new"
              className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl"
            >
              Tambah Produk Sekarang
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Produk</th>
                  <th className="px-6 py-3.5">Kategori</th>
                  <th className="px-6 py-3.5">Harga</th>
                  <th className="px-6 py-3.5">Varian & Stok</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((item: any) => {
                  const coverImage = item.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';
                  const totalStock = item.variants?.length
                    ? item.variants.reduce((acc: number, v: any) => acc + (v.stock || 0), 0)
                    : 10;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={coverImage}
                            alt={item.title}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-100"
                          />
                          <div>
                            <p className="font-medium text-slate-800 line-clamp-1">{item.title}</p>
                            <span className="text-xs text-slate-400">Slug: {item.slug}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg">
                          {item.category_name || 'Umum'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">{formatRupiah(Number(item.price))}</p>
                        {item.compare_at_price && (
                          <p className="text-xs text-slate-400 line-through">
                            {formatRupiah(Number(item.compare_at_price))}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <span className="text-xs text-slate-600">
                            {item.variants?.length ? `${item.variants.length} Varian` : 'Tanpa Varian'}
                          </span>
                          <p className="text-xs font-semibold text-slate-800">
                            Stok: {totalStock}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => toggleMutation.mutate(item.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                            item.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {item.is_active ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              Aktif
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-slate-400" />
                              Nonaktif
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/products/${item.id}/edit`}
                            className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Hapus produk "${item.title}"?`)) {
                                deleteMutation.mutate(item.id);
                              }
                            }}
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 10 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
            <span>
              Halaman {page} dari {lastPage}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={page >= lastPage}
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
