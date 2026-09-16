'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Mail, Store } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-2xl mb-4 shadow-lg shadow-emerald-500/30">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">ALURELAB</h1>
          <p className="text-slate-400 mt-1 text-sm">Reset password merchant</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Lupa password?</h2>
          <p className="text-sm text-slate-500 mb-6">
            Masukkan email akun Anda untuk meminta tautan reset password.
          </p>
          {submitted ? (
            <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              Permintaan reset password belum tersedia di backend. Hubungi admin untuk mengganti password.
            </p>
          ) : (
            <form onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }} className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Email
                <div className="relative mt-1.5">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="merchant@email.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </label>
              <button type="submit" className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl">
                Kirim Permintaan Reset
              </button>
            </form>
          )}
          <Link href="/login" className="mt-6 inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700">
            <ArrowLeft className="w-4 h-4" /> Kembali ke login
          </Link>
        </div>
      </div>
    </div>
  );
}
