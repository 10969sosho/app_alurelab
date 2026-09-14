'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Store } from 'lucide-react';

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
    <div className="bg-white rounded-2xl shadow-2xl p-8">
      <h2 className="text-xl font-semibold text-slate-800 mb-6">Masuk ke akun Anda</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Email
          </label>
          <input
            {...register('email')}
            type="email"
            placeholder="merchant@email.com"
            autoComplete="email"
            className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all
              ${errors.email
                ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200'
                : 'border-slate-200 bg-slate-50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
              }`}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              className={`w-full px-4 py-3 pr-12 rounded-xl border text-sm outline-none transition-all
                ${errors.password
                  ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200'
                  : 'border-slate-200 bg-slate-50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* Forgot password */}
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs text-emerald-600 hover:text-emerald-700">
            Lupa password?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300
                     text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Masuk...
            </>
          ) : (
            'Masuk'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Belum punya toko?{' '}
        <Link href="/onboarding" className="text-emerald-600 font-medium hover:text-emerald-700">
          Buat toko gratis
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-2xl mb-4 shadow-lg shadow-emerald-500/30">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">ALURELAB</h1>
          <p className="text-slate-400 mt-1 text-sm">Dashboard Merchant</p>
        </div>

        <Suspense fallback={
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex items-center justify-center min-h-[300px]">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        }>
          <LoginFormContent />
        </Suspense>

        <p className="text-center text-xs text-slate-500 mt-6">
          © 2026 ALURELAB. All rights reserved.
        </p>
      </div>
    </div>
  );
}

