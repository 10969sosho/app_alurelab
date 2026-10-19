'use client';

import { Suspense, useEffect, useState } from 'react';
import { getSession, signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { STORE_SLUG_KEY } from '@/lib/api';

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

type LoginForm = z.infer<typeof loginSchema>;

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: 'Email atau password salah.',
  Configuration: 'Layanan login sedang bermasalah. Coba beberapa saat lagi.',
  AccessDenied: 'Akses ditolak. Hubungi tim support.',
  OAuthCallback: 'Login dengan Google gagal. Silakan coba lagi.',
  OAuthAccountNotLinked: 'Email sudah terdaftar dengan metode lain. Gunakan email & password.',
  Default: 'Login gagal. Silakan periksa kembali data Anda.',
};

function resolveLoginErrorMessage(error: string, code?: string | null): string {
  if (error === 'CredentialsSignin' && code && code !== 'credentials') {
    return code;
  }
  return ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default;
}

function LoginFormContent() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') ?? '/dashboard';

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const urlError = params.get('error');

  useEffect(() => {
    if (urlError) {
      toast.error(resolveLoginErrorMessage(urlError, params.get('code')));
    }
  }, [urlError, params]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(resolveLoginErrorMessage(result.error, (result as any).code));
      } else {
        // Simpan slug toko agar header X-Store-Slug selalu terkirim di request dashboard
        try {
          const freshSession: any = await getSession();
          const slug = freshSession?.store?.slug;
          if (slug) {
            localStorage.setItem(STORE_SLUG_KEY, slug);
          } else {
            localStorage.removeItem(STORE_SLUG_KEY);
          }
        } catch {
          // abaikan — dashboard layout tetap handle user tanpa toko
        }

        toast.success('Login berhasil! Mengalihkan ke dashboard...');
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[28px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] p-8 sm:p-11 text-neutral-900 border border-neutral-100">
      {/* Title Header ala Shopify */}
      <div className="mb-7">
        <h1 className="text-[26px] font-extrabold tracking-tight text-neutral-900">Log in</h1>
        <p className="text-sm text-neutral-500 mt-1 font-medium">Continue to AlureLab</p>
      </div>

      {/* Tombol Google */}
      <button
        type="button"
        onClick={() => signIn('google', { callbackUrl })}
        className="w-full py-3 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-900 text-sm font-semibold flex items-center justify-center gap-2.5 transition cursor-pointer mb-5"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
        </svg>
        Masuk dengan Google
      </button>

      {/* Pemisah */}
      <div className="relative mb-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-neutral-400 font-medium">atau masuk dengan email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
            Email
          </label>
          <input
            {...register('email')}
            type="email"
            placeholder="nama@email.com"
            autoComplete="email"
            className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all
              ${errors.email
                ? 'border-red-400 bg-red-50/50 focus:border-red-500'
                : 'border-neutral-300 bg-white text-neutral-900 focus:border-[#C8FF3D] focus:ring-2 focus:ring-[#C8FF3D]/30'
              }`}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500 font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-semibold text-neutral-700">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
              Lupa password?
            </Link>
          </div>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              className={`w-full px-4 py-3 pr-11 rounded-xl border text-sm outline-none transition-all
                ${errors.password
                  ? 'border-red-400 bg-red-50/50 focus:border-red-500'
                  : 'border-neutral-300 bg-white text-neutral-900 focus:border-[#C8FF3D] focus:ring-2 focus:ring-[#C8FF3D]/30'
                }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-500 font-medium">{errors.password.message}</p>
          )}
        </div>

        {/* Main CTA Button: Theme Hijau Lemon (#C8FF3D) dengan Teks Hitam Pekat */}
        <button
          type="submit"
          disabled={isLoading}
          style={{ backgroundColor: '#C8FF3D', color: '#111111' }}
          className="w-full font-extrabold text-sm py-3.5 rounded-xl shadow-sm hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-neutral-900" />
              <span>Memproses...</span>
            </>
          ) : (
            <span>Continue with email</span>
          )}
        </button>
      </form>

      {/* Passkey / Fast Signin Pill */}
      <button
        type="button"
        onClick={() => toast.info('Fitur Passkey segera hadir untuk merchant AlureLab.')}
        className="w-full mt-6 py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 text-neutral-800 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer mb-6"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a8.5 8.5 0 0 1 13 0"/></svg>
        Sign in with passkey
      </button>

      {/* Footer Register Link ala Shopify */}
      <div className="text-center text-xs text-neutral-600 font-medium">
        New to AlureLab?{' '}
        <Link href="/onboarding" className="text-neutral-900 font-bold hover:underline">
          Get started →
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white flex flex-col justify-between p-6 sm:p-10 font-sans relative">
      {/* Top Header Logo ala Shopify: Pojok Kiri Atas */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between">
        <a href="https://alurelab.com" className="inline-flex items-center gap-2.5 group transition">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#C8FF3D] fill-current drop-shadow-[0_0_12px_rgba(200,255,61,0.5)]"><path d="M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12-.6-6.2-5.8-11.4-12-12C6.2 11.4 11.4 6.2 12 0z"/></svg>
          <span className="text-xl font-black tracking-tight text-white group-hover:text-[#C8FF3D] transition-colors">alurelab</span>
        </a>
      </header>

      {/* Main Center Card */}
      <main className="w-full max-w-[440px] mx-auto my-auto py-8">
        <Suspense fallback={
          <div className="bg-white rounded-[28px] p-12 flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-900" />
          </div>
        }>
          <LoginFormContent />
        </Suspense>
      </main>

      {/* Bottom Footer ala Shopify */}
      <footer className="w-full max-w-4xl mx-auto text-center space-y-2 py-4">
        <div className="text-xs text-neutral-400">
          <a href="https://wa.me/6281334999789" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors font-medium">
            Need Help?
          </a>
        </div>
        <p className="text-[11px] text-neutral-500 leading-relaxed max-w-lg mx-auto">
          By continuing, you agree to the <a href="/legal/terms" className="underline hover:text-neutral-300">Terms</a> and <a href="/legal/privacy" className="underline hover:text-neutral-300">Privacy Policy</a>, and to receive operational notifications from AlureLab.
        </p>
      </footer>
    </div>
  );
}
