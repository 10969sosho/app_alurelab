'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Megaphone,
} from 'lucide-react';
import api from '@/lib/api';
import { formatRupiah } from '@/lib/utils';

export default function ProductsPage() {
  const queryClient = useQueryClient();

  // Filter & Search states
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'action_required' | 'review' | 'unlisted'>('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'need_ads' | 'low_stock' | 'top_selling'>('all');
  const [page, setPage] = useState(1);

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Derive API status filter from activeTab
  const derivedStatus = useMemo(() => {
    if (activeTab === 'live') return 'active';
    if (activeTab === 'unlisted') return 'inactive';
    return '';
  }, [activeTab]);

  // Fetch products
  const { data, isLoading } = useQuery({
    queryKey: ['merchant-products', activeSearch, derivedStatus, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeSearch) params.append('search', activeSearch);
      if (derivedStatus) params.append('status', derivedStatus);
      params.append('page', page.toString());
      params.append('per_page', '12');

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
      toast.success('Status produk berhasil diubah');
      queryClient.invalidateQueries({ queryKey: ['merchant-products'] });
    },
    onError: () => {
      toast.error('Gagal mengubah status');
    },
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/merchant/products/${id}`);
    },
    onSuccess: () => {
      toast.success('Produk berhasil dihapus');
      setSelectedIds((prev) => prev.filter((id) => !id));
      queryClient.invalidateQueries({ queryKey: ['merchant-products'] });
    },
    onError: () => {
      toast.error('Gagal menghapus produk');
    },
  });

  const rawProducts = data?.data || [];
  const total = data?.total || 0;
  const lastPage = data?.last_page || 1;

  // Client-side quick filter refinement
  const products = useMemo(() => {
    return rawProducts.filter((item: any) => {
      const totalStock = item.variants?.length
        ? item.variants.reduce((acc: number, v: any) => acc + (v.stock || 0), 0)
        : (item.stock ?? 10);

      if (categoryFilter && item.category_name !== categoryFilter) return false;
      if (stockFilter === 'low' && totalStock > 5) return false;
      if (stockFilter === 'out' && totalStock > 0) return false;
      if (quickFilter === 'low_stock' && totalStock > 5) return false;
      return true;
    });
  }, [rawProducts, categoryFilter, stockFilter, quickFilter]);

  // Unique categories from products for filter dropdown
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    rawProducts.forEach((p: any) => {
      if (p.category_name) set.add(p.category_name);
    });
    return Array.from(set);
  }, [rawProducts]);

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(products.map((p: any) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const isAllSelected = products.length > 0 && selectedIds.length === products.length;

  const handleApplyFilter = () => {
    setActiveSearch(searchInput.trim());
    setPage(1);
  };

  const handleResetFilter = () => {
    setSearchInput('');
    setActiveSearch('');
    setCategoryFilter('');
    setStockFilter('');
    setQuickFilter('all');
    setPage(1);
  };

  return (
    <div className="space-y-2.5 select-none font-sans pb-10">
      {/* ─── 1. Header Bar: Title + Bulk & Action Buttons ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
            Produk Saya
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Dropdown: Pengaturan Produk */}
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xs transition-colors shadow-2xs"
          >
            <span>Pengaturan Produk</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Dropdown: Pengaturan Massal */}
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xs transition-colors shadow-2xs"
          >
            <span>Pengaturan Massal</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Shopee Orange Button: + Tambah Produk Baru */}
          <Link
            href="/dashboard/products/new"
            className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-[#EE4D2D] hover:bg-[#d73f20] text-white text-xs font-semibold rounded-xs transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Tambah Produk Baru</span>
          </Link>
        </div>
      </div>

      {/* ─── 2. Top Tabs (Shopee Underline Tabs) ─── */}
      <div className="bg-white border-b border-slate-200 px-3 flex items-center gap-6 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => {
            setActiveTab('all');
            setPage(1);
          }}
          className={`py-2.5 font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'all'
              ? 'border-[#EE4D2D] text-[#EE4D2D] font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Semua ({total})
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('live');
            setPage(1);
          }}
          className={`py-2.5 font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'live'
              ? 'border-[#EE4D2D] text-[#EE4D2D] font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Live
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('action_required');
            setPage(1);
          }}
          className={`py-2.5 font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'action_required'
              ? 'border-[#EE4D2D] text-[#EE4D2D] font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Perlu Tindakan (0)
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('review');
            setPage(1);
          }}
          className={`py-2.5 font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'review'
              ? 'border-[#EE4D2D] text-[#EE4D2D] font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Sedang Ditinjau (0)
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('unlisted');
            setPage(1);
          }}
          className={`py-2.5 font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'unlisted'
              ? 'border-[#EE4D2D] text-[#EE4D2D] font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Belum Ditampilkan
        </button>
      </div>

      {/* ─── 3. Slim Promo Banner (Shopee Seller Centre Style) ─── */}
      <div className="bg-orange-50/90 border border-orange-200/80 px-3.5 py-2 rounded-xs flex items-center justify-between text-xs text-slate-700">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-xs bg-[#EE4D2D] text-white flex items-center justify-center shrink-0">
            <Megaphone className="w-3 h-3" />
          </div>
          <p className="truncate">
            <span className="font-semibold text-slate-900">Iklan Shopee:</span>{' '}
            Tingkatkan penjualan hingga 3x lipat dengan beriklan di halaman pencarian & rekomendasi terkait.
          </p>
        </div>
        <Link
          href="/dashboard/promotions"
          className="text-[#EE4D2D] hover:underline font-semibold shrink-0 ml-3 whitespace-nowrap text-xs"
        >
          Pelajari Lebih Lanjut &gt;
        </Link>
      </div>

      {/* ─── 4. Filter Toolbar Box ─── */}
      <div className="bg-white border border-slate-200 rounded-xs p-3 space-y-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
              placeholder="Cari Nama Produk, SKU Induk, ID Produk..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xs text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-[#EE4D2D] transition-colors"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xs text-xs text-slate-700 outline-none focus:border-[#EE4D2D]"
          >
            <option value="">Semua Kategori</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Stock Filter Dropdown */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xs text-xs text-slate-700 outline-none focus:border-[#EE4D2D]"
          >
            <option value="">Semua Stok</option>
            <option value="low">Stok Menipis (&lt; 5)</option>
            <option value="out">Stok Habis (0)</option>
          </select>

          {/* Buttons: Terapkan & Atur ulang */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplyFilter}
              className="px-3.5 py-1.5 bg-[#EE4D2D] hover:bg-[#d73f20] text-white text-xs font-semibold rounded-xs transition-colors shadow-2xs"
            >
              Terapkan
            </button>
            <button
              type="button"
              onClick={handleResetFilter}
              className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-medium rounded-xs transition-colors"
            >
              Atur ulang
            </button>
          </div>
        </div>

        {/* Quick Filter Pills Row */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-800 mr-2">
              {products.length} Produk
            </span>
            <button
              type="button"
              onClick={() => setQuickFilter('all')}
              className={`px-2 py-0.5 rounded-xs transition-colors ${
                quickFilter === 'all'
                  ? 'bg-slate-800 text-white font-medium'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setQuickFilter('need_ads')}
              className={`px-2 py-0.5 rounded-xs transition-colors ${
                quickFilter === 'need_ads'
                  ? 'bg-orange-600 text-white font-medium'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Perlu Diiklankan
            </button>
            <button
              type="button"
              onClick={() => setQuickFilter('low_stock')}
              className={`px-2 py-0.5 rounded-xs transition-colors ${
                quickFilter === 'low_stock'
                  ? 'bg-red-600 text-white font-medium'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Stok Menipis
            </button>
            <button
              type="button"
              onClick={() => setQuickFilter('top_selling')}
              className={`px-2 py-0.5 rounded-xs transition-colors ${
                quickFilter === 'top_selling'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Terlaris
            </button>
          </div>

          {/* Bulk Action Controls if items selected */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-orange-50 px-2 py-1 border border-orange-200 rounded-xs text-xs">
              <span className="text-slate-700 font-medium">
                {selectedIds.length} dipilih
              </span>
              <button
                type="button"
                onClick={() => {
                  toast.info(`Fitur massal untuk ${selectedIds.length} produk`);
                }}
                className="text-[#EE4D2D] font-bold hover:underline"
              >
                Ubah Massal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── 5. Compact Data Table (Space-Saving Grid) ─── */}
      <div className="bg-white border border-slate-200 rounded-xs overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#EE4D2D] mr-2" />
            <span className="text-xs">Memuat data produk...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-2">
              <SlidersHorizontal className="w-6 h-6 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-800 text-xs">Tidak ada produk ditemukan</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Coba gunakan kata kunci lain atau tambahkan produk baru.
            </p>
            <Link
              href="/dashboard/products/new"
              className="mt-3 px-3 py-1.5 bg-[#EE4D2D] hover:bg-[#d73f20] text-white text-xs font-semibold rounded-xs"
            >
              + Tambah Produk Sekarang
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              {/* Header */}
              <thead className="bg-[#FAFAFA] border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                <tr>
                  <th className="w-10 px-3 py-2.5 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded-xs border-slate-300 text-[#EE4D2D] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                  </th>
                  <th className="px-3 py-2.5 min-w-[280px]">Nama Produk</th>
                  <th className="px-3 py-2.5 min-w-[100px]">SKU Induk</th>
                  <th className="px-3 py-2.5 min-w-[90px]">Variasi</th>
                  <th className="px-3 py-2.5 min-w-[110px]">Harga</th>
                  <th className="px-3 py-2.5 min-w-[90px]">Stok</th>
                  <th className="px-3 py-2.5 min-w-[90px]">Penjualan</th>
                  <th className="px-3 py-2.5 w-[120px] text-right">Aksi</th>
                </tr>
              </thead>

              {/* Rows */}
              <tbody className="divide-y divide-slate-100">
                {products.map((item: any) => {
                  const coverImage =
                    item.images?.[0] ||
                    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';
                  const totalStock = item.variants?.length
                    ? item.variants.reduce((acc: number, v: any) => acc + (v.stock || 0), 0)
                    : (item.stock ?? 10);
                  const isChecked = selectedIds.includes(item.id);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-orange-50/30 transition-colors ${
                        isChecked ? 'bg-orange-50/50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleSelectOne(item.id, e.target.checked)}
                          className="rounded-xs border-slate-300 text-[#EE4D2D] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                      </td>

                      {/* Nama Produk + Image + IDs */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-start gap-2.5">
                          <img
                            src={coverImage}
                            alt={item.title}
                            className="w-11 h-11 rounded-xs object-cover border border-slate-200 bg-slate-50 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/dashboard/products/${item.id}/edit`}
                              className="font-medium text-slate-800 hover:text-[#EE4D2D] line-clamp-2 leading-tight transition-colors"
                            >
                              {item.title}
                            </Link>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 font-mono">
                              <span>ID: {item.id.slice(0, 8)}</span>
                              <span>•</span>
                              <span>Kategori: {item.category_name || 'Umum'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SKU Induk */}
                      <td className="px-3 py-2.5 text-slate-600 font-mono text-[11px]">
                        {item.sku || item.slug || '-'}
                      </td>

                      {/* Variasi */}
                      <td className="px-3 py-2.5 text-slate-600">
                        {item.variants?.length ? (
                          <span className="text-slate-700 font-medium">
                            {item.variants.length} Variasi
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Harga */}
                      <td className="px-3 py-2.5">
                        <p className="font-semibold text-slate-900">
                          {formatRupiah(Number(item.price))}
                        </p>
                        {item.compare_at_price && (
                          <p className="text-[10px] text-slate-400 line-through">
                            {formatRupiah(Number(item.compare_at_price))}
                          </p>
                        )}
                      </td>

                      {/* Stok & Status Indicator */}
                      <td className="px-3 py-2.5">
                        <p className="font-semibold text-slate-800">{totalStock}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {item.is_active ? (
                            <span className="text-[10px] font-medium text-emerald-600">
                              ● Live
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-400">
                              ● Nonaktif
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Penjualan */}
                      <td className="px-3 py-2.5 text-slate-500">
                        <span>0</span>
                      </td>

                      {/* Aksi: Link Ubah & Popover Lainnya */}
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <Link
                            href={`/dashboard/products/${item.id}/edit`}
                            className="text-[#1890FF] hover:underline font-medium text-xs"
                          >
                            Ubah
                          </Link>

                          {/* Quick Toggle Status */}
                          <button
                            type="button"
                            onClick={() => toggleMutation.mutate(item.id)}
                            title={item.is_active ? 'Nonaktifkan Produk' : 'Tampilkan Produk'}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded-xs hover:bg-slate-100 transition-colors"
                          >
                            {item.is_active ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Delete Action */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Hapus produk "${item.title}"? Tindakan ini tidak bisa dibatalkan.`)) {
                                deleteMutation.mutate(item.id);
                              }
                            }}
                            title="Hapus Produk"
                            className="p-1 text-slate-400 hover:text-red-600 rounded-xs hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* ─── 6. Pagination Footer (Shopee Style) ─── */}
        {total > 0 && (
          <div className="px-4 py-2.5 border-t border-slate-200 bg-[#FAFAFA] flex items-center justify-between text-xs text-slate-500">
            <span>
              Menampilkan {products.length} dari total {total} produk
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded-xs border border-slate-300 disabled:opacity-30 hover:bg-white bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 py-0.5 font-medium text-slate-700">
                {page} / {lastPage}
              </span>
              <button
                type="button"
                disabled={page >= lastPage}
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                className="p-1 rounded-xs border border-slate-300 disabled:opacity-30 hover:bg-white bg-slate-50 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
