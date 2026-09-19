'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';

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
      await api.post('/auth/register', data);
      toast.success('Akun berhasil dibuat. Cek email untuk verifikasi.');
      router.push('/login?registered=1');
    } catch (error: any) {
      const msg = error?.response?.data?.message ?? 'Gagal membuat akun. Coba lagi.';
      toast.error(msg);

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
    <div className="min-h-screen bg-offwhite text-charcoal-900 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute inset-0 z-0 pointer-events-none bg-grid-lines opacity-[0.3]" />
      <div className="absolute inset-0 z-0 pointer-events-none subtle-radial-gradient" />
      <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-lime-accent to-transparent opacity-30"></div>

      <div className="w-full max-w-md relative z-10 py-8">
        <Link href="/login" className="inline-flex items-center gap-2 text-xs font-medium text-darkgray hover:text-charcoal-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> SUDAH PUNYA AKUN? LOGIN
        </Link>

        <div className="bg-white rounded-lg border border-cloud shadow-soft p-8 md:p-10">
          <div className="mb-8 text-center flex flex-col items-center">
            <div className="relative h-16 w-48 mb-4">
              <Image src="/logo.png" alt="AlureLab" fill priority className="object-contain object-center mix-blend-multiply" />
            </div>
            <h1 className="text-xl font-semibold text-charcoal-900">Daftar Akun Merchant</h1>
            <p className="text-xs text-mediumgray mt-1">Mulai kelola bisnis dan toko multi-tenant Anda</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Nama */}
            <div>
              <label className="micro-label block mb-1.5">Nama Lengkap</label>
              <input
                {...register('name')}
                type="text"
                placeholder="Budi Santoso"
                className={`w-full px-4 py-2.5 rounded-sm border text-sm outline-none transition-all
                  ${errors.name ? 'border-red-400 bg-red-50' : 'border-cloud bg-offwhite text-charcoal-900 focus:border-charcoal-900'}`}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="micro-label block mb-1.5">Email</label>
              <input
                {...register('email')}
                type="email"
                placeholder="budi@email.com"
                className={`w-full px-4 py-2.5 rounded-sm border text-sm outline-none transition-all
                  ${errors.email ? 'border-red-400 bg-red-50' : 'border-cloud bg-offwhite text-charcoal-900 focus:border-charcoal-900'}`}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            {/* WhatsApp */}
            <div>
              <label className="micro-label block mb-1.5">Nomor WhatsApp</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-mediumgray text-xs font-mono">+62</span>
                <input
                  {...register('phone_number')}
                  type="tel"
                  placeholder="812-3456-7890"
                  className={`w-full pl-14 pr-4 py-2.5 rounded-sm border text-sm outline-none transition-all
                    ${errors.phone_number ? 'border-red-400 bg-red-50' : 'border-cloud bg-offwhite text-charcoal-900 focus:border-charcoal-900'}`}
                />
              </div>
              {errors.phone_number && <p className="mt-1 text-xs text-red-500">{errors.phone_number.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="micro-label block mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 karakter"
                  className={`w-full px-4 py-2.5 pr-12 rounded-sm border text-sm outline-none transition-all
                    ${errors.password ? 'border-red-400 bg-red-50' : 'border-cloud bg-offwhite text-charcoal-900 focus:border-charcoal-900'}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-mediumgray hover:text-charcoal-900">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="micro-label block mb-1.5">Konfirmasi Password</label>
              <input
                {...register('password_confirmation')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Ulangi password"
                className={`w-full px-4 py-2.5 rounded-sm border text-sm outline-none transition-all
                  ${errors.password_confirmation ? 'border-red-400 bg-red-50' : 'border-cloud bg-offwhite text-charcoal-900 focus:border-charcoal-900'}`}
              />
              {errors.password_confirmation && <p className="mt-1 text-xs text-red-500">{errors.password_confirmation.message}</p>}
            </div>

            <p className="text-[11px] text-mediumgray pt-2">
              Dengan mendaftar, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi ALURELAB.
            </p>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3.5 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Mendaftarkan...
                </>
              ) : (
                'Buat Akun Merchant'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-mediumgray">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-charcoal-900 font-semibold hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
