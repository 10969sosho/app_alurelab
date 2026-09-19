'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-offwhite text-charcoal-900 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute inset-0 z-0 pointer-events-none bg-grid-lines opacity-[0.3]" />
      <div className="absolute inset-0 z-0 pointer-events-none subtle-radial-gradient" />
      <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-lime-accent to-transparent opacity-30"></div>

      <div className="w-full max-w-md relative z-10">
        <Link href="/login" className="inline-flex items-center gap-2 text-xs font-medium text-darkgray hover:text-charcoal-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> KEMBALI KE LOGIN
        </Link>

        <div className="bg-white rounded-lg border border-cloud shadow-soft p-8 md:p-10">
          <div className="mb-8 text-center flex flex-col items-center">
            <div className="relative h-16 w-48 mb-4">
              <Image src="/logo.png" alt="AlureLab" fill priority className="object-contain object-center mix-blend-multiply" />
            </div>
            <h1 className="text-xl font-semibold text-charcoal-900">Reset Password Merchant</h1>
            <p className="text-xs text-mediumgray mt-1">Masukkan email akun Anda untuk meminta tautan reset password</p>
          </div>

          {submitted ? (
            <div className="rounded-sm bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800 leading-relaxed mb-6">
              Permintaan reset password belum tersedia secara otomatis di backend. Silakan hubungi tim admin AlureLab untuk penggantian password.
            </div>
          ) : (
            <form onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }} className="space-y-5">
              <div>
                <label className="micro-label block mb-1.5">
                  EMAIL TERDAFTAR
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mediumgray" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="merchant@email.com"
                    className="w-full pl-11 pr-4 py-2.5 rounded-sm border border-cloud bg-offwhite text-sm text-charcoal-900 outline-none focus:border-charcoal-900 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full btn-primary py-3.5 mt-2"
              >
                Kirim Permintaan Reset
              </button>
            </form>
          )}

          <div className="mt-8 pt-4 border-t border-cloud text-center">
            <Link href="/login" className="text-xs text-charcoal-900 font-semibold hover:underline">
              Sudah ingat password? Masuk
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
