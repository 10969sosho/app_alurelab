'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
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
    <div className="max-w-2xl space-y-4 pb-10">
      <div>
        <h1 className="text-lg font-bold text-slate-800">Master Kategori</h1>
        <p className="text-xs text-slate-400 mt-1">Atur kategori yang tersedia saat membuat produk.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xs p-4 shadow-2xs space-y-4">
        <form onSubmit={addCategory} className="flex gap-2">
           <input
             name="category"
             ref={categoryInputRef}
             placeholder="Contoh: Kopi, Fashion, Elektronik"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-xs text-xs outline-none focus:border-[#EE4D2D]"
          />
          <button type="submit" className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-xs text-xs font-semibold">
            <Plus className="w-3.5 h-3.5" /> Tambah
          </button>
        </form>

        {loading ? (
          <p className="text-xs text-slate-400">Memuat kategori...</p>
        ) : categories.length === 0 ? (
          <p className="text-xs text-slate-400 border border-dashed border-slate-200 p-4">Belum ada kategori. Tambahkan kategori pertama.</p>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xs">
            {categories.map((category, index) => (
              <div key={`${category}-${index}`} className="flex items-center justify-between px-3 py-2.5 text-xs">
                <span className="font-medium text-slate-700">{category}</span>
                <button type="button" onClick={() => setCategories((current) => current.filter((_, i) => i !== index))} className="p-1.5 text-slate-400 hover:text-red-600" title="Hapus kategori">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button type="button" onClick={saveCategories} disabled={saving || loading} className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#EE4D2D] text-white rounded-xs text-xs font-semibold disabled:opacity-50">
          <Save className="w-3.5 h-3.5" /> {saving ? 'Menyimpan...' : 'Simpan Master Kategori'}
        </button>
      </div>
    </div>
  );
}
