'use client';

import { useState, useEffect } from 'react';
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
  DollarSign,
  Layers,
  Upload,
  Check,
  Star,
  Info,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

const variantSchema = z.object({
  title:        z.string().min(1, 'Nama varian wajib diisi'),
  price:        z.coerce.number().min(0, 'Harga varian tidak boleh negatif'),
  stock:        z.coerce.number().min(0, 'Stok varian minimal 0'),
  weight_grams: z.coerce.number().optional().nullable(),
  sku:          z.string().optional(),
});

const productSchema = z.object({
  title:            z.string().min(3, 'Nama produk minimal 3 karakter'),
  category_name:    z.string().optional(),
  description:      z.string().optional(),
  price:            z.coerce.number().min(0, 'Harga jual tidak boleh negatif'),
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
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    api.get('/merchant/categories')
      .then((response) => setCategories(response.data?.data || []))
      .catch(() => setCategories([]));
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const toastId = toast.loading(`Mengunggah ${files.length} foto produk...`);

    try {
      const formData = new FormData();
      formData.append('folder', 'products');
      Array.from(files).forEach((file) => {
        formData.append('files[]', file);
      });

      const res = await api.post('/merchant/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploaded = res.data?.urls || (res.data?.url ? [res.data.url] : []);
      if (uploaded.length > 0) {
        setImages((prev) => [...prev, ...uploaded]);
        toast.success(`Berhasil mengunggah ${uploaded.length} foto produk`, { id: toastId });
      } else {
        toast.error('Gagal mengunggah foto produk', { id: toastId });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Gagal mengunggah foto. Pastikan ukuran di bawah 8MB.', {
        id: toastId,
      });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const target = prev[index];
      const remaining = prev.filter((_, i) => i !== index);
      return [target, ...remaining];
    });
    toast.success('Foto utama produk berhasil diubah');
  };

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
        title:        v.title,
        price:        Number(v.price),
        stock:        Number(v.stock),
        weight_grams: v.weight_grams ? Number(v.weight_grams) : (Number(initialData?.weight_grams) || 200),
        sku:          v.sku || '',
      })) || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });

  const watchedVariants = watch('variants') || [];

  // If variants are enabled and exist, compute lowest price
  const lowestVariantPrice = watchedVariants.length > 0
    ? Math.min(...watchedVariants.map((v) => Number(v.price) || 0).filter((p) => p > 0))
    : 0;

  const firstVariantWeight = watchedVariants.length > 0
    ? Number(watchedVariants[0]?.weight_grams) || 200
    : 200;

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
      let finalPrice = Number(data.price);
      let finalWeight = Number(data.weight_grams);

      if (hasVariants && data.variants && data.variants.length > 0) {
        // Derive base price from the minimum variant price
        const variantPrices = data.variants.map((v) => Number(v.price)).filter((p) => p > 0);
        if (variantPrices.length > 0) {
          finalPrice = Math.min(...variantPrices);
        }
        const vWeight = Number(data.variants[0]?.weight_grams);
        if (vWeight > 0) {
          finalWeight = vWeight;
        }
      }

      if (finalPrice <= 0) {
        toast.error('Harga jual produk harus lebih dari 0');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        ...data,
        price: finalPrice,
        weight_grams: finalWeight > 0 ? finalWeight : 200,
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
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-3 pb-12 select-none font-sans">
      {/* ─── Top Header & Save Button ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/products"
            className="p-1.5 rounded-xs bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
              {isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Kelola foto katalog, varian harga, stok, dan spesifikasi pengiriman
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-[#EE4D2D] hover:bg-[#d73f20] disabled:opacity-50 text-white text-xs font-semibold rounded-xs flex items-center gap-1.5 transition-colors shadow-2xs self-start sm:self-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Simpan & Publikasikan</span>
            </>
          )}
        </button>
      </div>

      {/* ─── 1. Informasi Dasar ─── */}
      <div className="bg-white rounded-xs border border-slate-200 p-4 space-y-3 shadow-2xs">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-xs border-b border-slate-100 pb-2.5">
          <Package className="w-4 h-4 text-[#EE4D2D]" />
          <h2>Informasi Dasar Produk</h2>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Nama Produk <span className="text-[#EE4D2D]">*</span>
          </label>
          <input
            {...register('title')}
            placeholder="Contoh: Kemeja Linen Katun Premium L-Kids Series"
            className={`w-full px-3 py-1.5 rounded-xs border text-xs outline-none transition-colors ${
              errors.title
                ? 'border-red-400 bg-red-50 focus:border-red-500'
                : 'border-slate-300 focus:border-[#EE4D2D]'
            }`}
          />
          {errors.title && (
            <p className="mt-1 text-[11px] text-red-500">{errors.title.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Kategori Produk
            </label>
            <input
              {...register('category_name')}
              list="product-categories"
              placeholder="Cari kategori..."
              className="w-full px-3 py-1.5 rounded-xs border border-slate-300 text-xs outline-none focus:border-[#EE4D2D]"
            />
            <datalist id="product-categories">
              {categories.map((category) => <option key={category} value={category} />)}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Status Visibilitas
            </label>
            <div className="flex items-center gap-3 pt-1">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('is_active')}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#EE4D2D]"></div>
                <span className="ml-2.5 text-xs font-medium text-slate-700">
                  {watch('is_active') ? 'Live (Tampil di Toko)' : 'Nonaktif (Draft)'}
                </span>
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Deskripsi Produk
          </label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Jelaskan spesifikasi, bahan material, dan keunggulan produk Anda..."
            className="w-full px-3 py-1.5 rounded-xs border border-slate-300 text-xs outline-none focus:border-[#EE4D2D]"
          />
        </div>
      </div>

      {/* ─── 2. Foto & Media Produk ─── */}
      <div className="bg-white rounded-xs border border-slate-200 p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
            <ImageIcon className="w-4 h-4 text-[#EE4D2D]" />
            <h2>Foto & Media Produk</h2>
          </div>
          <span className="text-[11px] text-slate-400">Maks 8MB per file • JPG, PNG, WebP</span>
        </div>

        {/* Drag-and-Drop & File Picker Zone */}
        <label className={`block relative border border-dashed rounded-xs p-5 text-center cursor-pointer transition-colors ${
          isUploading
            ? 'border-orange-400 bg-orange-50/50 cursor-not-allowed'
            : 'border-slate-300 hover:border-[#EE4D2D] bg-slate-50/60'
        }`}>
          <input
            type="file"
            multiple
            accept="image/*"
            disabled={isUploading}
            onChange={handleFileUpload}
            className="sr-only"
          />
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="w-9 h-9 rounded-xs bg-orange-50 text-[#EE4D2D] flex items-center justify-center">
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#EE4D2D]" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </div>
            <p className="text-xs font-semibold text-slate-800">
              {isUploading ? 'Sedang mengunggah foto...' : 'Klik atau Tarik Foto Produk ke Sini'}
            </p>
            <p className="text-[11px] text-slate-400">
              Mendukung banyak foto sekaligus. Foto pertama otomatis menjadi foto sampul etalase.
            </p>
          </div>
        </label>

        {/* Gallery Preview List */}
        {images.length > 0 && (
          <div className="space-y-2">
            <div className="text-[11px] font-medium text-slate-600">
              Galeri Foto ({images.length} foto terpasang):
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
              {images.map((imgUrl, index) => (
                <div
                  key={index}
                  className={`group relative rounded-xs overflow-hidden border transition-all ${
                    index === 0
                      ? 'border-[#EE4D2D] ring-1 ring-[#EE4D2D]'
                      : 'border-slate-200'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Preview ${index + 1}`}
                    onError={(e: any) => {
                      e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';
                    }}
                    className="w-full aspect-square object-cover bg-slate-100"
                  />

                  {/* Primary Cover Badge */}
                  {index === 0 ? (
                    <div className="absolute top-1 left-1 bg-[#EE4D2D] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-xs flex items-center gap-0.5 shadow-xs">
                      <Star className="w-2.5 h-2.5 fill-white" />
                      <span>Cover</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetPrimaryImage(index)}
                      className="absolute top-1 left-1 bg-black/70 hover:bg-[#EE4D2D] text-white text-[9px] font-medium px-1.5 py-0.5 rounded-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Jadikan Cover
                    </button>
                  )}

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Hapus Foto"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* URL alternative input */}
        <div className="pt-2 border-t border-slate-100 flex gap-2">
          <input
            type="url"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            placeholder="Atau tempel tautan URL gambar..."
            className="flex-1 px-3 py-1.5 rounded-xs border border-slate-300 text-xs outline-none focus:border-[#EE4D2D]"
          />
          <button
            type="button"
            onClick={handleAddImage}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xs flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah URL</span>
          </button>
        </div>
      </div>

      {/* ─── 3. Harga & Pengiriman ─── */}
      <div className="bg-white rounded-xs border border-slate-200 p-4 space-y-3 shadow-2xs">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-xs border-b border-slate-100 pb-2.5">
          <DollarSign className="w-4 h-4 text-[#EE4D2D]" />
          <h2>Harga & Berat Produk</h2>
        </div>

        {/* Notice when variants are enabled */}
        {hasVariants ? (
          <div className="bg-orange-50 border border-orange-200 rounded-xs p-3 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#EE4D2D] shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-relaxed">
              <p className="font-bold text-slate-900">Mode Varian Aktif</p>
              <p className="mt-0.5 text-[11px] text-slate-600">
                Harga jual dan berat pengiriman produk secara otomatis ditentukan berdasarkan variasi di bawah.
                {lowestVariantPrice > 0 && (
                  <span className="block mt-1 font-semibold text-[#EE4D2D]">
                    Harga terendah saat ini: Rp {lowestVariantPrice.toLocaleString('id-ID')} • Berat acuan: {firstVariantWeight} gram
                  </span>
                )}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Harga Jual (Rp) <span className="text-[#EE4D2D]">*</span>
                </label>
                <input
                  type="number"
                  {...register('price')}
                  placeholder="150000"
                  className={`w-full px-3 py-1.5 rounded-xs border text-xs outline-none transition-colors ${
                    errors.price
                      ? 'border-red-400 bg-red-50 focus:border-red-500'
                      : 'border-slate-300 focus:border-[#EE4D2D]'
                  }`}
                />
                {errors.price && (
                  <p className="mt-1 text-[11px] text-red-500">{errors.price.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Harga Coret (Promo Diskon)
                </label>
                <input
                  type="number"
                  {...register('compare_at_price')}
                  placeholder="199000"
                  className="w-full px-3 py-1.5 rounded-xs border border-slate-300 text-xs outline-none focus:border-[#EE4D2D]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Modal / HPP (Internal)
                </label>
                <input
                  type="number"
                  {...register('cost_price')}
                  placeholder="75000"
                  className="w-full px-3 py-1.5 rounded-xs border border-slate-300 text-xs outline-none focus:border-[#EE4D2D]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Berat Pengiriman (gram) <span className="text-[#EE4D2D]">*</span>
              </label>
              <div className="relative max-w-xs">
                <input
                  type="number"
                  {...register('weight_grams')}
                  placeholder="250"
                  className="w-full px-3 py-1.5 pr-14 rounded-xs border border-slate-300 text-xs outline-none focus:border-[#EE4D2D]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-medium">
                  gram
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Digunakan untuk menghitung tarif ongkos kirim kurir Biteship.
              </p>
            </div>
          </>
        )}
      </div>

      {/* ─── 4. Varian Produk ─── */}
      <div className="bg-white rounded-xs border border-slate-200 p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
            <Layers className="w-4 h-4 text-[#EE4D2D]" />
            <h2>Varian Produk (Warna, Ukuran, Seri)</h2>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={hasVariants}
              onChange={(e) => {
                setHasVariants(e.target.checked);
                if (e.target.checked && fields.length === 0) {
                  append({
                    title: 'Standard',
                    price: watch('price') || 100000,
                    stock: 50,
                    weight_grams: watch('weight_grams') || 200,
                    sku: '',
                  });
                }
              }}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#EE4D2D]"></div>
            <span className="ml-2.5 text-xs font-semibold text-slate-700">
              Aktifkan Varian
            </span>
          </label>
        </div>

        {hasVariants && (
          <div className="space-y-3">
            <p className="text-[11px] text-slate-500">
              Setiap variasi dapat memiliki nama, harga jual, stok, dan berat pengiriman masing-masing.
            </p>

            <div className="space-y-2">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 p-3 bg-slate-50/70 rounded-xs border border-slate-200"
                >
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                      Nama Varian
                    </label>
                    <input
                      {...register(`variants.${index}.title` as const)}
                      placeholder="Contoh: Merah / XL"
                      className="w-full px-2.5 py-1.5 bg-white rounded-xs border border-slate-300 text-xs outline-none focus:border-[#EE4D2D]"
                    />
                  </div>

                  <div className="w-full sm:w-32">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                      Harga (Rp)
                    </label>
                    <input
                      type="number"
                      {...register(`variants.${index}.price` as const)}
                      placeholder="150000"
                      className="w-full px-2.5 py-1.5 bg-white rounded-xs border border-slate-300 text-xs outline-none focus:border-[#EE4D2D] font-mono"
                    />
                  </div>

                  <div className="w-full sm:w-24">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                      Berat (gram)
                    </label>
                    <input
                      type="number"
                      {...register(`variants.${index}.weight_grams` as const)}
                      placeholder="200"
                      className="w-full px-2.5 py-1.5 bg-white rounded-xs border border-slate-300 text-xs outline-none focus:border-[#EE4D2D] font-mono"
                    />
                  </div>

                  <div className="w-full sm:w-20">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                      Stok
                    </label>
                    <input
                      type="number"
                      {...register(`variants.${index}.stock` as const)}
                      placeholder="50"
                      className="w-full px-2.5 py-1.5 bg-white rounded-xs border border-slate-300 text-xs outline-none focus:border-[#EE4D2D] font-mono"
                    />
                  </div>

                  <div className="w-full sm:w-28">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                      SKU
                    </label>
                    <input
                      {...register(`variants.${index}.sku` as const)}
                      placeholder="SKU-01"
                      className="w-full px-2.5 py-1.5 bg-white rounded-xs border border-slate-300 text-xs outline-none focus:border-[#EE4D2D] font-mono uppercase"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-xs hover:bg-red-50 transition-colors sm:mt-4"
                    title="Hapus Varian"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => append({ title: '', price: lowestVariantPrice || 100000, stock: 10, weight_grams: firstVariantWeight || 200, sku: '' })}
              className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xs flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-[#EE4D2D]" />
              <span>Tambah Baris Varian</span>
            </button>
          </div>
        )}
      </div>
    </form>
  );
}
