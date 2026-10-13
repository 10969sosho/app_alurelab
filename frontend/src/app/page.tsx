import { redirect } from 'next/navigation';

export default function RootHomePage() {
  // app.alurelab.com diarahkan langsung ke dashboard
  // Jika belum login, middleware otomatis redirect ke /login
  redirect('/dashboard');
}
