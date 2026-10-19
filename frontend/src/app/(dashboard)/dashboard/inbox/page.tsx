'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Inbox, Loader2, MessageCircle, Search, Send, UserRound } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  unread: number;
  last_message_at: string;
  latest_message: string | null;
  counterpart: { name: string | null; id: string };
}

interface Message {
  id: string;
  sender_type: 'seller' | 'buyer';
  body: string;
  created_at: string;
}

function timeAgo(dateString: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(dateString).getTime()) / 60_000));
  if (!Number.isFinite(minutes) || minutes < 1) return 'baru saja';
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}j`;
  return `${Math.floor(minutes / 1440)}h`;
}

export default function SellerInboxPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const selectedId = searchParams.get('id');
  const [search, setSearch] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ['seller', 'inbox'],
    queryFn: async () => (await api.get('/chat/conversations')).data.data,
    refetchInterval: 10_000,
  });

  const selectedConversation = conversations.find((conversation) => conversation.id === selectedId);
  const buyerName = selectedConversation?.counterpart.name || 'Pembeli';

  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['seller', 'inbox', selectedId],
    queryFn: async () => (await api.get(`/chat/conversations/${selectedId}/messages`)).data.data,
    enabled: !!selectedId,
    refetchInterval: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: async (body: string) => api.post(`/chat/conversations/${selectedId}/messages`, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'inbox', selectedId] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'inbox'] });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const visibleConversations = conversations.filter((conversation) => {
    const matchesSearch = `${conversation.counterpart.name ?? ''} ${conversation.latest_message ?? ''}`
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesSearch && (!unreadOnly || conversation.unread > 0);
  });

  const selectConversation = (id: string) => {
    setInput('');
    router.push(`/dashboard/inbox?id=${encodeURIComponent(id)}`, { scroll: false });
  };

  const showConversationList = () => router.push('/dashboard/inbox', { scroll: false });

  const sendMessage = () => {
    const body = input.trim();
    if (!body || !selectedId || sendMutation.isPending) return;
    setInput('');
    sendMutation.mutate(body);
  };

  return (
    <section className="flex h-full min-h-[520px] overflow-hidden rounded-2xl border border-[#e7e7e4] bg-white shadow-sm">
      <aside className={cn('flex w-full shrink-0 flex-col border-r border-[#e7e7e4] md:w-[340px] lg:w-[380px]', selectedId && 'hidden md:flex')}>
        <div className="border-b border-[#eeeeeb] px-5 pb-4 pt-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-[#111111]">
                Pesan Masuk
                {conversations.reduce((total, conversation) => total + (conversation.unread ?? 0), 0) > 0 && (
                  <span className="rounded-full bg-[#C8FF3D] px-2 py-0.5 text-[10px] font-bold text-[#111111]">
                    {conversations.reduce((total, conversation) => total + (conversation.unread ?? 0), 0)}
                  </span>
                )}
              </h2>
              <p className="mt-0.5 text-xs text-[#777773]">Chat dari pembeli toko kamu</p>
            </div>
            <MessageCircle className="h-5 w-5 text-[#111111]" />
          </div>

          <label className="flex h-10 items-center gap-2 rounded-xl border border-[#e7e7e4] bg-[#fafaf8] px-3 focus-within:border-[#111111]">
            <Search className="h-4 w-4 shrink-0 text-[#777773]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari pembeli atau pesan..."
              className="min-w-0 flex-1 bg-transparent text-sm text-[#111111] outline-none placeholder:text-[#9a9a95]"
            />
          </label>

          <div className="mt-3 flex gap-2" role="tablist" aria-label="Filter percakapan">
            {(['Semua', 'Belum Dibaca'] as const).map((label) => {
              const isUnread = label === 'Belum Dibaca';
              return (
                <button
                  key={label}
                  type="button"
                  role="tab"
                  aria-selected={unreadOnly === isUnread}
                  onClick={() => setUnreadOnly(isUnread)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                    unreadOnly === isUnread ? 'bg-[#111111] text-[#C8FF3D]' : 'bg-[#f3f3f0] text-[#666661] hover:bg-[#eaeae6]'
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto" data-lenis-prevent>
          {conversationsLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-[#777773]" /></div>
          ) : visibleConversations.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-14 text-center text-[#8b8b86]">
              <Inbox className="mb-3 h-9 w-9" />
              <p className="text-sm font-semibold text-[#555550]">{conversations.length ? 'Tidak ada percakapan' : 'Belum ada pesan'}</p>
              <p className="mt-1 text-xs">{conversations.length ? 'Coba ubah pencarian atau filter.' : 'Pembeli yang chat akan muncul di sini.'}</p>
            </div>
          ) : (
            visibleConversations.map((conversation) => {
              const name = conversation.counterpart.name || 'Pembeli';
              const active = conversation.id === selectedId;
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => selectConversation(conversation.id)}
                  aria-current={active ? 'true' : undefined}
                  className={cn(
                    'flex w-full items-center gap-3 border-b border-[#f0f0ed] px-4 py-4 text-left transition-colors hover:bg-[#f8f8f5]',
                    active && 'bg-[#111111] text-white hover:bg-[#171717]'
                  )}
                >
                  <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold', active ? 'bg-[#C8FF3D] text-[#111111]' : 'bg-[#111111] text-[#C8FF3D]')}>
                    {name.trim().charAt(0).toUpperCase() || <UserRound className="h-5 w-5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn('truncate text-sm', conversation.unread > 0 ? 'font-bold' : 'font-semibold')}>{name}</span>
                      <span className={cn('shrink-0 text-[10px]', active ? 'text-white/60' : 'text-[#999993]')}>{timeAgo(conversation.last_message_at)}</span>
                    </span>
                    <span className="mt-1 flex items-center justify-between gap-2">
                      <span className={cn('truncate text-xs', active ? 'text-white/65' : conversation.unread > 0 ? 'font-medium text-[#555550]' : 'text-[#92928c]')}>
                        {conversation.latest_message || 'Mulai percakapan...'}
                      </span>
                      {conversation.unread > 0 && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#C8FF3D] px-1 text-[10px] font-bold text-[#111111]">
                          {conversation.unread > 9 ? '9+' : conversation.unread}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <div className={cn('min-w-0 flex-1 flex-col bg-[#fafaf8]', selectedId ? 'flex' : 'hidden md:flex')}>
        {selectedId ? (
          <>
            <header className="flex h-[72px] shrink-0 items-center gap-3 border-b border-[#e7e7e4] bg-white px-4 sm:px-6">
              <button
                type="button"
                onClick={showConversationList}
                aria-label="Kembali ke daftar percakapan"
                className="rounded-lg p-2 text-[#555550] hover:bg-[#f1f1ee] md:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#111111] text-sm font-bold text-[#C8FF3D]">
                {buyerName.trim().charAt(0).toUpperCase() || <UserRound className="h-5 w-5" />}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#111111]">{buyerName}</p>
                <p className="text-xs text-[#85857f]">Percakapan pembeli</p>
              </div>
            </header>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-7" data-lenis-prevent>
              {messagesLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-[#777773]" /></div>
              ) : messages.length === 0 ? (
                <p className="py-10 text-center text-sm text-[#8b8b86]">Belum ada pesan dalam percakapan ini.</p>
              ) : messages.map((message) => {
                const isSeller = message.sender_type === 'seller';
                return (
                  <div key={message.id} className={cn('flex', isSeller ? 'justify-end' : 'justify-start')}>
                    <div className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[72%]',
                      isSeller ? 'rounded-br-sm bg-[#111111] text-white' : 'rounded-bl-sm border border-[#e5e5e1] bg-white text-[#222222]'
                    )}>
                      <p className="whitespace-pre-wrap break-words">{message.body}</p>
                      <p className={cn('mt-1.5 text-[10px]', isSeller ? 'text-white/55' : 'text-[#999993]')}>
                        {new Date(message.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        {isSeller && <span className="ml-1">· Kamu</span>}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <footer className="shrink-0 border-t border-[#e7e7e4] bg-white px-4 py-3 sm:px-6">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Balas pesan pembeli..."
                  rows={1}
                  className="max-h-[120px] min-h-11 flex-1 resize-y rounded-xl border border-[#e5e5e1] bg-[#fafaf8] px-4 py-3 text-sm text-[#111111] outline-none transition focus:border-[#111111] focus:ring-2 focus:ring-[#C8FF3D]/60"
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={!input.trim() || sendMutation.isPending}
                  aria-label="Kirim pesan"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#111111] text-[#C8FF3D] transition hover:bg-[#242424] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1.5 text-[10px] text-[#999993]">Enter untuk kirim · Shift+Enter untuk baris baru</p>
            </footer>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#C8FF3D] text-[#111111]">
              <MessageCircle className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-[#111111]">Pilih Percakapan</h3>
            <p className="mt-1 max-w-xs text-sm text-[#777773]">Pilih chat dari daftar pembeli untuk mulai membaca dan membalas pesan.</p>
          </div>
        )}
      </div>
    </section>
  );
}
