'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Package,
  Plus,
  Trash2,
  Image as ImageIcon,
  Loader2,
  ArrowLeft,
  Sparkles,
  DollarSign,
  Tag,
  Scale,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

const variantSchema = z.object({
  title: z.string().min(1, 'Nama varian wajib diisi'),
  price: z.coerce.number().min(0, 'Harga varian tidak boleh negatif'),
  stock: z.coerce.number().min(0, 'Stok varian minimal 0'),
  sku:   z.string().optional(),
});

const productSchema = z.object({
  title:            z.string().min(3, 'Nama produk minimal 3 karakter'),
  category_name:    z.string().optional(),
  description:      z.string().optional(),
  price:            z.coerce.number().min(1, 'Harga jual harus lebih dari 0'),
  compare_at_price: z.coerce.number().optional().nullable(),
  cost_price:       z.coerce.number().optional().nullable(),
  weight_grams:     z.coerce.number().min(1, 'Berat produk minimal 1 gram'),
  is_active:        z.boolean().default(true),
  variants:         z.array(variantSchema).optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: any;
  isEdit?: boolean;
  productId?: string;
}

export function ProductForm({ initialData, isEdit, productId }: ProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [hasVariants, setHasVariants] = useState(Boolean(initialData?.variants?.length));

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      title:            initialData?.title || '',
      category_name:    initialData?.category_name || '',
      description:      initialData?.description || '',
      price:            initialData?.price ? Number(initialData.price) : 0,
      compare_at_price: initialData?.compare_at_price ? Number(initialData.compare_at_price) : null,
      cost_price:       initialData?.cost_price ? Number(initialData.cost_price) : null,
      weight_grams:     initialData?.weight_grams ? Number(initialData.weight_grams) : 200,
      is_active:        initialData?.is_active ?? true,
      variants:         initialData?.variants?.map((v: any) => ({
        title: v.title,
        price: Number(v.price),
        stock: Number(v.stock),
        sku:   v.sku || '',
      })) || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    try {
      new URL(newImageUrl);
      setImages([...images, newImageUrl.trim()]);
      setNewImageUrl('');
    } catch {
      toast.error('URL gambar tidak valid');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        images,
        variants: hasVariants ? data.variants : [],
      };

      if (isEdit && productId) {
        await api.put(`/merchant/products/${productId}`, payload);
        toast.success('Produk berhasil diperbarui');
      } else {
        await api.post('/merchant/products', payload);
        toast.success('Produk berhasil ditambahkan');
      }

      router.push('/dashboard/products');
      router.refresh();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Gagal menyimpan produk';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/products"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}
            </h1>
            <p className="text-sm text-slate-500">
              Kelola informasi katalog dan ketersediaan stok
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            'Simpan & Publikasikan'
          )}
        </button>
      </div>

      {/* 1. Informasi Dasar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div className="flex items-center gap-2 text-slate-800 font-semibold border-b border-slate-100 pb-3">
          <Package className="w-5 h-5 text-emerald-500" />
          <h2>Informasi Dasar</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Nama Produk <span className="text-red-500">*</span>
          </label>
          <input
            {...register('title')}
            placeholder="Contoh: Hijab Silk Premium Emerald Glow"
            className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
              errors.title
                ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200'
                : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
            }`}
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Kategori
            </label>
            <input
              {...register('category_name')}
              placeholder="Contoh: Hijab, Sepatu, Aksesoris"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Status Produk
            </label>
            <div className="flex items-center gap-3 pt-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('is_active')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                <span className="ml-3 text-sm font-medium text-slate-700">
                  {watch('is_active') ? 'Aktif (Tampil di Toko)' : 'Nonaktif (Draft)'}
                </span>
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Deskripsi Produk
          </label>
          <textarea
            {...register('description')}
            rows={4}
            placeholder="Jelaskan spesifikasi, material, dan keunggulan produk Anda..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
      </div>

      {/* 2. Media / Gambar Produk */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <ImageIcon className="w-5 h-5 text-emerald-500" />
            <h2>Foto & Media</h2>
          </div>
          <span className="text-xs text-slate-400">Mendukung format JPG, PNG, WebP</span>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {images.map((url, idx) => (
            <div
              key={idx}
              className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50"
            >
              <img
                src={url}
                alt={`Preview ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(idx)}
                className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              {idx === 0 && (
                <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-900/80 text-white text-[10px] font-semibold rounded-md">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Add Image URL */}
        <div className="flex gap-2">
          <input
            type="url"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            placeholder="Tempel tautan URL gambar (misal dari Cloudflare R2 / Unsplash)..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
          <button
            type="button"
            onClick={handleAddImage}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Foto
          </button>
        </div>
      </div>

      {/* 3. Harga & Pengiriman */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div className="flex items-center gap-2 text-slate-800 font-semibold border-b border-slate-100 pb-3">
          <DollarSign className="w-5 h-5 text-emerald-500" />
          <h2>Harga & Berat</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Harga Jual (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              {...register('price')}
              placeholder="150000"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                errors.price
                  ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200'
                  : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
              }`}
            />
            {errors.price && (
              <p className="mt-1 text-xs text-red-500">{errors.price.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Harga Coret (Promo)
            </label>
            <input
              type="number"
              {...register('compare_at_price')}
              placeholder="199000"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Modal / HPP (Internal)
            </label>
            <input
              type="number"
              {...register('cost_price')}
              placeholder="75000"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Berat Pengiriman (gram) <span className="text-red-500">*</span>
          </label>
          <div className="relative max-w-xs">
            <input
              type="number"
              {...register('weight_grams')}
              placeholder="250"
              className="w-full px-4 py-2.5 pr-14 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
              gram
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Digunakan Biteship untuk menghitung ongkos kirim real-time kurir.
          </p>
        </div>
      </div>

      {/* 4. Varian Produk */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <Layers className="w-5 h-5 text-emerald-500" />
            <h2>Varian Produk</h2>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={hasVariants}
              onChange={(e) => {
                setHasVariants(e.target.checked);
                if (e.target.checked && fields.length === 0) {
                  append({ title: 'Default Varian', price: watch('price') || 0, stock: 10, sku: '' });
                }
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            <span className="ml-3 text-sm font-medium text-slate-700">
              Aktifkan Varian
            </span>
          </label>
        </div>

        {hasVariants && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Tentukan kombinasi ukuran, warna, atau jenis beserta stok dan harga khusus masing-masing.
            </p>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200"
                >
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Nama Varian
                    </label>
                    <input
                      {...register(`variants.${index}.title` as const)}
                      placeholder="Contoh: Merah / XL"
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="w-full sm:w-32">
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Harga (Rp)
                    </label>
                    <input
                      type="number"
                      {...register(`variants.${index}.price` as const)}
                      placeholder="150000"
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="w-full sm:w-24">
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Stok
                    </label>
                    <input
                      type="number"
                      {...register(`variants.${index}.stock` as const)}
                      placeholder="50"
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="w-full sm:w-28">
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      SKU
                    </label>
                    <input
                      {...register(`variants.${index}.sku` as const)}
                      placeholder="SKU-01"
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors sm:mt-5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => append({ title: '', price: watch('price') || 0, stock: 10, sku: '' })}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4 text-emerald-500" />
              Tambah Baris Varian
            </button>
          </div>
        )}
      </div>
    </form>
  );
}
