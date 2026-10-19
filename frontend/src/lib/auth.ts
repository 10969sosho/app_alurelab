/**
 * NextAuth v5 Configuration
 * Credentials provider → backend Sanctum token
 */
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { CredentialsSignin } from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import axios from 'axios';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://app.alurelab.com/api/v1';

class BackendSigninError extends CredentialsSignin {
  code: string;

  constructor(code: string) {
    super();
    this.code = code;
  }
}

export const authConfig: NextAuthConfig = {
  trustHost: true,
  providers: [
    Credentials({
      name: 'ALURELAB',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await axios.post(`${API_URL}/auth/login`, {
            email:    credentials.email,
            password: credentials.password,
          });

          const data = res.data;

          if (data?.token && data?.user) {
            return {
              id:           data.user.id,
              name:         data.user.name,
              email:        data.user.email,
              phoneNumber:  data.user.phone_number,
              isSuperadmin: data.user.is_superadmin,
              backendToken: data.token,
              store:        data.store ?? null,
              role:         data.store ? 'owner' : 'owner',
            };
          }
          return null;
        } catch (error: any) {
          const msg = error?.response?.data?.message
            ?? error?.response?.data?.errors?.email?.[0]
            ?? 'Email atau password salah.';
          throw new BackendSigninError(msg);
        }
      },
    }),
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  callbacks: {
    // Google: tukar profile Google → backend Sanctum token
    async signIn({ user, account }) {
      if (account?.provider !== 'google') return true;

      try {
        const res = await axios.post(`${API_URL}/auth/google-callback`, {
          email:     user.email,
          name:      user.name,
          google_id: account.providerAccountId,
          avatar:    user.image,
        });

        const data = res.data;
        if (data?.token && data?.user) {
          user.id           = data.user.id;
          user.name         = data.user.name;
          user.email        = data.user.email;
          (user as any).backendToken = data.token;
          (user as any).store        = data.store ?? null;
          (user as any).role         = 'owner';
          (user as any).phoneNumber  = data.user.phone_number;
          (user as any).isSuperadmin = data.user.is_superadmin;
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },

    async jwt({ token, user }) {
      // Saat login: simpan backend token + store info ke JWT
      if (user) {
        token.backendToken = (user as any).backendToken;
        token.store        = (user as any).store;
        token.role         = (user as any).role;
        token.phoneNumber  = (user as any).phoneNumber;
        token.isSuperadmin = (user as any).isSuperadmin;
      }

      // User tanpa toko (mis. baru mendaftar / baru membuat toko) → tarik ulang dari backend
      if (!user && !token.store && token.backendToken) {
        try {
          const me = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token.backendToken}` },
            timeout: 8000,
          });
          token.store = me.data?.store ?? null;
        } catch {
          // backend tidak terjangkau — biarkan null, layout akan arahkan ke /create-store
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Expose ke client via useSession()
      session.backendToken = token.backendToken as string;
      session.store        = token.store as any;
      session.user.role    = token.role as string;
      return session;
    },
  },

  pages: {
    signIn:  '/login',
    error:   '/login',
  },

  session: {
    strategy:  'jwt',
    maxAge:    7 * 24 * 60 * 60, // 7 hari
  },

  secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
