'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { MessageCircle, User, Loader2, Inbox } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Conversation {
  id:              string;
  unread:          number;
  last_message_at: string;
  latest_message:  string | null;
  counterpart:     { name: string; id: string };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'baru saja';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j`;
  return `${Math.floor(h / 24)}h`;
}

export default function SellerInboxPage() {
  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ['seller', 'inbox'],
    queryFn: async () => {
      const res = await api.get('/chat/conversations');
      return res.data.data;
    },
    refetchInterval: 10_000,
  });

  const totalUnread = conversations.reduce((s, c) => s + (c.unread ?? 0), 0);

  return (
    <div className="max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Pesan Masuk
            {totalUnread > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {totalUnread}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Chat dari pembeli toko kamu</p>
        </div>
      </div>

      {/* Conversation List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Inbox className="w-10 h-10 mb-3" />
          <p className="text-sm font-medium">Belum ada pesan</p>
          <p className="text-xs mt-1">Pembeli yang chat akan muncul di sini</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
          {conversations.map((conv, i) => (
            <Link
              key={conv.id}
              href={`/dashboard/inbox/${conv.id}`}
              className={cn(
                'flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors',
                i < conversations.length - 1 && 'border-b border-slate-100'
              )}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {conv.counterpart.name?.charAt(0) ?? <User className="w-4 h-4" />}
                </div>
                {conv.unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {conv.unread > 9 ? '9+' : conv.unread}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={cn('text-sm', conv.unread > 0 ? 'font-bold text-slate-900' : 'font-medium text-slate-700')}>
                    {conv.counterpart.name ?? 'Pembeli'}
                  </p>
                  <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                    {timeAgo(conv.last_message_at)}
                  </span>
                </div>
                <p className={cn('text-xs truncate mt-0.5', conv.unread > 0 ? 'text-slate-700 font-medium' : 'text-slate-400')}>
                  {conv.latest_message ?? 'Mulai percakapan...'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
