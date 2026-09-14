'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Store, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { signIn } from 'next-auth/react';

const registerSchema = z.object({
  name:             z.string().min(2, 'Nama minimal 2 karakter'),
  email:            z.string().email('Email tidak valid'),
  phone_number:     z.string().regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, 'Format nomor WA tidak valid'),
  password:         z.string().min(8, 'Password minimal 8 karakter'),
  password_confirmation: z.string(),
}).refine((d) => d.password === d.password_confirmation, {
  message: 'Password tidak cocok',
  path:    ['password_confirmation'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      // Register ke backend
      await api.post('/auth/register', data);

      // Auto-login setelah register berhasil
      const result = await signIn('credentials', {
        email:    data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Akun dibuat, tapi login gagal. Silakan login manual.');
        router.push('/login');
      } else {
        toast.success('Akun berhasil dibuat! Selamat datang di ALURELAB.');
        router.push('/onboarding');
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message ?? 'Gagal membuat akun. Coba lagi.';
      toast.error(msg);

      // Handle validation errors dari Laravel
      const validationErrors = error?.response?.data?.errors;
      if (validationErrors) {
        Object.entries(validationErrors).forEach(([, messages]) => {
          (messages as string[]).forEach((msg) => toast.error(msg));
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back link */}
        <Link href="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Sudah punya akun? Login
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-2xl mb-4 shadow-lg shadow-emerald-500/30">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">ALURELAB</h1>
          <p className="text-slate-400 mt-1 text-sm">Buat akun merchant baru</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Daftar sekarang</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Nama */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Lengkap</label>
              <input
                {...register('name')}
                type="text"
                placeholder="Budi Santoso"
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all
                  ${errors.name ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'}`}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                {...register('email')}
                type="email"
                placeholder="budi@email.com"
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all
                  ${errors.email ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'}`}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nomor WhatsApp</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">+62</span>
                <input
                  {...register('phone_number')}
                  type="tel"
                  placeholder="812-3456-7890"
                  className={`w-full pl-14 pr-4 py-3 rounded-xl border text-sm outline-none transition-all
                    ${errors.phone_number ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'}`}
                />
              </div>
              {errors.phone_number && <p className="mt-1 text-xs text-red-500">{errors.phone_number.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 karakter"
                  className={`w-full px-4 py-3 pr-12 rounded-xl border text-sm outline-none transition-all
                    ${errors.password ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Konfirmasi Password</label>
              <input
                {...register('password_confirmation')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Ulangi password"
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all
                  ${errors.password_confirmation ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'}`}
              />
              {errors.password_confirmation && <p className="mt-1 text-xs text-red-500">{errors.password_confirmation.message}</p>}
            </div>

            {/* Terms */}
            <p className="text-xs text-slate-500">
              Dengan mendaftar, Anda menyetujui{' '}
              <a href="#" className="text-emerald-600 underline">Syarat & Ketentuan</a>{' '}
              dan{' '}
              <a href="#" className="text-emerald-600 underline">Kebijakan Privasi</a>{' '}
              ALURELAB.
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300
                         text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Membuat akun...</>
              ) : 'Buat Akun Gratis'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
