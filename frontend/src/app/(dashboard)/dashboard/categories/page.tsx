'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, Save, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/merchant/categories')
      .then((response) => setCategories(response.data?.data || []))
      .catch(() => toast.error('Master kategori gagal dimuat.'))
      .finally(() => setLoading(false));
  }, []);

  const addCategory = (event: React.FormEvent) => {
    event.preventDefault();
    const category = categoryInputRef.current?.value.trim() || '';
    if (!category) return;
    if (categories.some((item) => item.toLowerCase() === category.toLowerCase())) {
      toast.error('Kategori sudah ada.');
      return;
    }
    setCategories((current) => [...current, category]);
    if (categoryInputRef.current) categoryInputRef.current.value = '';
  };

  const saveCategories = async () => {
    setSaving(true);
    try {
      await api.put('/merchant/categories', { categories });
      toast.success('Master kategori tersimpan.');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Master kategori gagal disimpan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-10 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
            Master Kategori
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Atur kategori yang tersedia saat membuat produk.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
          <Tag className="w-3.5 h-3.5 text-lime-700" />
          {categories.length} Kategori
        </span>
      </div>

      {/* Add Category Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <p className="text-xs font-semibold text-slate-700 mb-3">Tambah Kategori Baru</p>
        <form onSubmit={addCategory} className="flex flex-col sm:flex-row gap-2.5">
          <input
            name="category"
            ref={categoryInputRef}
            placeholder="Contoh: Kopi, Fashion, Elektronik"
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-slate-800 focus:ring-2 focus:ring-[#C8FF3D]/30 transition-all"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#111111] text-[#FAFAF8] rounded-full text-xs font-semibold hover:bg-[#000000] transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Kategori
          </button>
        </form>
      </div>

      {/* Category List Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-slate-700">Daftar Kategori</p>
          <span className="text-[11px] text-slate-400">Klik hapus untuk menyingkirkan kategori</span>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400">Memuat kategori...</p>
        ) : categories.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center">
            <Tag className="w-6 h-6 mx-auto text-slate-300 mb-2" />
            <p className="text-xs text-slate-400">Belum ada kategori. Tambahkan kategori pertama.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((category, index) => (
              <span
                key={`${category}-${index}`}
                className="group inline-flex items-center gap-2 border border-slate-200 bg-[#FAFAF8] rounded-xl pl-3.5 pr-2 py-2 text-xs font-medium text-slate-700 hover:border-slate-400 hover:bg-white transition-all"
              >
                {category}
                <button
                  type="button"
                  onClick={() => setCategories((current) => current.filter((_, i) => i !== index))}
                  className="p-1 rounded-full text-slate-300 group-hover:text-red-600 group-hover:bg-red-50 transition-colors"
                  title="Hapus kategori"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={saveCategories}
          disabled={saving || loading}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#C8FF3D] hover:bg-[#b8f02e] text-[#111111] rounded-full text-xs font-bold disabled:opacity-50 shadow-sm transition-colors"
        >
          <Save className="w-3.5 h-3.5" /> {saving ? 'Menyimpan...' : 'Simpan Master Kategori'}
        </button>
      </div>
    </div>
  );
}
