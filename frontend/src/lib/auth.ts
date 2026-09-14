/**
 * NextAuth v5 Configuration
 * Credentials provider → backend Sanctum token
 */
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { NextAuthConfig } from 'next-auth';
import axios from 'axios';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://app.alurelab.com/api/v1';

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
          // Backend validation error (422)
          const msg = error?.response?.data?.message ?? 'Email atau password salah.';
          throw new Error(msg);
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // Saat login: simpan backend token + store info ke JWT
      if (user) {
        token.backendToken = (user as any).backendToken;
        token.store        = (user as any).store;
        token.role         = (user as any).role;
        token.phoneNumber  = (user as any).phoneNumber;
        token.isSuperadmin = (user as any).isSuperadmin;
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
