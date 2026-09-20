import { signOut } from 'next-auth/react';
import { LogOut, Bell } from 'lucide-react';

interface AdminHeaderProps {
  session: any;
}

export default function AdminHeader({ session }: AdminHeaderProps) {
  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-sm font-semibold text-slate-900">Admin Panel</h1>
        <p className="text-xs text-slate-400">AlureLab Platform Management</p>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 text-slate-400 hover:text-slate-700 transition-colors">
          <Bell className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-7 h-7 bg-lime-accent rounded-full flex items-center justify-center">
            <span className="text-charcoal-900 font-bold text-xs">
              {session?.user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-slate-800">{session?.user?.name ?? 'Admin'}</p>
            <p className="text-[10px] text-slate-400">{session?.user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
