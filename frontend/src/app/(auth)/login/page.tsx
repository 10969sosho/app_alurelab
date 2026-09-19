'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';

const loginSchema = z.object({
  email:    z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginFormContent() {
  const router      = useRouter();
  const params      = useSearchParams();
  const callbackUrl = params.get('callbackUrl') ?? '/dashboard';

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        email:    data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error === 'CredentialsSignin'
          ? 'Email atau password salah.'
          : result.error
        );
      } else {
        toast.success('Login berhasil!');
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      toast.error('Terjadi kesalahan. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-cloud shadow-soft p-8 md:p-10">
      <div className="mb-8 text-center flex flex-col items-center">
        <div className="relative h-16 w-48 mb-4">
          <Image src="/logo.png" alt="AlureLab" fill priority className="object-contain object-center mix-blend-multiply" />
        </div>
        <h2 className="text-xl font-semibold text-charcoal-900">Masuk ke Portal Merchant</h2>
        <p className="text-xs text-mediumgray mt-1">Kelola toko online dan inventaris Anda</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email */}
        <div>
          <label className="micro-label block mb-1.5">
            EMAIL
          </label>
          <input
            {...register('email')}
            type="email"
            placeholder="merchant@email.com"
            autoComplete="email"
            className={`w-full px-4 py-3 rounded-sm border text-sm outline-none transition-all
              ${errors.email
                ? 'border-red-400 bg-red-50 focus:border-red-500'
                : 'border-cloud bg-offwhite text-charcoal-900 focus:border-charcoal-900'
              }`}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="micro-label">
              PASSWORD
            </label>
            <Link href="/forgot-password" className="text-xs text-mediumgray hover:text-charcoal-900 transition-colors">
              Lupa password?
            </Link>
          </div>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              className={`w-full px-4 py-3 pr-12 rounded-sm border text-sm outline-none transition-all
                ${errors.password
                  ? 'border-red-400 bg-red-50 focus:border-red-500'
                  : 'border-cloud bg-offwhite text-charcoal-900 focus:border-charcoal-900'
                }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-mediumgray hover:text-charcoal-900"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary py-3.5 mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Memproses...
            </>
          ) : (
            'Masuk ke Akun'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-mediumgray">
        Belum punya toko?{' '}
        <Link href="/onboarding" className="text-charcoal-900 font-semibold hover:underline">
          Buat toko gratis
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-offwhite text-charcoal-900 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute inset-0 z-0 pointer-events-none bg-grid-lines opacity-[0.3]" />
      <div className="absolute inset-0 z-0 pointer-events-none subtle-radial-gradient" />
      <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-lime-accent to-transparent opacity-30"></div>

      <div className="w-full max-w-md relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-darkgray hover:text-charcoal-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> KEMBALI KE BERANDA
        </Link>

        <Suspense fallback={
          <div className="bg-white rounded-lg border border-cloud shadow-soft p-8 flex items-center justify-center min-h-[300px]">
            <Loader2 className="w-8 h-8 animate-spin text-charcoal-900" />
          </div>
        }>
          <LoginFormContent />
        </Suspense>

        <p className="text-center text-[11px] text-mediumgray mt-6">
          © 2026 ALURELAB. All rights reserved.
        </p>
      </div>
    </div>
  );
}
