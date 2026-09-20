'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, ArrowLeft, Store, Loader2, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChatMessage {
  id:          string;
  sender_type: 'seller' | 'buyer';
  body:        string;
  created_at:  string;
  read_at:     string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getCustomerToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('customer_token');
}

async function fetchMessages(conversationId: string): Promise<ChatMessage[]> {
  const token = getCustomerToken();
  const res = await api.get(`/chat/conversations/${conversationId}/messages`, {
    headers: token ? { 'X-Customer-Token': token } : {},
  });
  return res.data.data;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BuyerChatPage() {
  const { store_slug } = useParams<{ store_slug: string }>();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [storeInfo, setStoreInfo] = useState<{ name: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  // Ambil info store
  useEffect(() => {
    api.get(`/store`, { headers: { 'X-Store-Slug': store_slug } })
      .then(res => setStoreInfo(res.data?.data ?? { name: store_slug }))
      .catch(() => setStoreInfo({ name: store_slug }));

    // Restore existing conversation from localStorage
    const saved = localStorage.getItem(`conv_${store_slug}`);
    if (saved) setConversationId(saved);
  }, [store_slug]);

  // Poll messages tiap 3 detik
  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ['chat', 'messages', conversationId],
    queryFn: () => fetchMessages(conversationId!),
    enabled: !!conversationId,
    refetchInterval: 3000,
  });

  // Scroll to bottom saat ada pesan baru
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Kirim pesan pertama (start conversation)
  const startConversation = async (body: string) => {
    setIsStarting(true);
    try {
      const token = getCustomerToken();
      const res = await api.post('/chat/start', { store_slug, message: body }, {
        headers: token ? { 'X-Customer-Token': token } : {},
      });
      const convId = res.data.data.id;
      if (res.data.customer_token) {
        localStorage.setItem('customer_token', res.data.customer_token);
      }
      setConversationId(convId);
      localStorage.setItem(`conv_${store_slug}`, convId);
      qc.invalidateQueries({ queryKey: ['chat', 'messages', convId] });
    } finally {
      setIsStarting(false);
    }
  };

  // Kirim pesan lanjutan
  const sendMutation = useMutation({
    mutationFn: async (body: string) => {
      const token = getCustomerToken();
      await api.post(`/chat/conversations/${conversationId}/messages`, { body }, {
        headers: token ? { 'X-Customer-Token': token } : {},
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chat', 'messages', conversationId] });
    },
  });

  const handleSend = async () => {
    const body = input.trim();
    if (!body) return;
    setInput('');

    if (!conversationId) {
      await startConversation(body);
    } else {
      sendMutation.mutate(body);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 shrink-0">
        <Link href={`/${store_slug}`} className="p-1.5 text-slate-500 hover:text-slate-800 transition-colors rounded-lg hover:bg-slate-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-9 h-9 bg-lime-accent rounded-xl flex items-center justify-center text-charcoal-900 font-bold text-sm">
          {(storeInfo?.name ?? store_slug).charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{storeInfo?.name ?? store_slug}</p>
          <p className="text-[11px] text-emerald-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" />
            Online
          </p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" data-lenis-prevent>
        {!conversationId && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <MessageCircle className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">Mulai chat dengan seller</p>
            <p className="text-xs text-slate-400 mt-1">Tanya produk, negosiasi, atau minta info pengiriman</p>
          </div>
        )}

        {isLoading && conversationId && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn('flex', msg.sender_type === 'buyer' ? 'justify-end' : 'justify-start')}
          >
            {msg.sender_type === 'seller' && (
              <div className="w-6 h-6 bg-lime-accent rounded-full flex items-center justify-center text-charcoal-900 font-bold text-[10px] mr-2 shrink-0 mt-0.5">
                S
              </div>
            )}
            <div
              className={cn(
                'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                msg.sender_type === 'buyer'
                  ? 'bg-charcoal-900 text-white rounded-br-sm'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-xs'
              )}
            >
              <p>{msg.body}</p>
              <p className={cn('text-[10px] mt-1', msg.sender_type === 'buyer' ? 'text-slate-400' : 'text-slate-400')}>
                {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-200 px-4 py-3 shrink-0">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ketik pesan..."
            rows={1}
            className="flex-1 resize-none px-4 py-2.5 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-accent/40 focus:border-lime-accent transition bg-slate-50"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStarting || sendMutation.isPending}
            className="w-10 h-10 bg-charcoal-900 text-white rounded-xl flex items-center justify-center hover:bg-charcoal-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
          >
            {isStarting || sendMutation.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </button>
        </div>
        <p className="text-[10px] text-slate-400 text-center mt-1.5">Enter untuk kirim · Shift+Enter untuk baris baru</p>
      </div>
    </div>
  );
}
