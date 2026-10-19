import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/DashboardShell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Double-check auth (middleware juga guard ini)
  if (!session) {
    redirect('/login');
  }

  // User login tapi belum punya toko → arahkan ke halaman Buat Toko (jangan 404/crash)
  if (!session.store?.slug) {
    redirect('/create-store');
  }

  return <DashboardShell>{children}</DashboardShell>;
}
