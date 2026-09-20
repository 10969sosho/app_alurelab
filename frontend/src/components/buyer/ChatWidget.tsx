'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Message {
  id: string;
  sender_type: 'seller' | 'buyer';
  body: string;
  created_at: string;
}

interface ChatWidgetProps {
  storeSlug: string;
  storeName?: string;
}

function getCustomerToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('customer_token');
}

export default function ChatWidget({ storeSlug, storeName }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  // Restore existing conversation
  useEffect(() => {
    const saved = localStorage.getItem(`conv_${storeSlug}`);
    if (saved) setConversationId(saved);
  }, [storeSlug]);

  // Poll messages
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['chat-widget', 'messages', conversationId],
    queryFn: async () => {
      const token = getCustomerToken();
      const res = await api.get(`/chat/conversations/${conversationId}/messages`, {
        headers: token ? { 'X-Customer-Token': token } : {},
      });
      return res.data.data;
    },
    enabled: !!conversationId,
    refetchInterval: open ? 3000 : 10000,
  });

  // Unread badge
  useEffect(() => {
    if (!open && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.sender_type === 'seller') setUnread((p) => p + 1);
    }
    if (open) setUnread(0);
  }, [messages, open]);

  // Scroll bottom
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const startConversation = async (body: string) => {
    setIsStarting(true);
    try {
      const token = getCustomerToken();
      const res = await api.post('/chat/start', { store_slug: storeSlug, message: body }, {
        headers: token ? { 'X-Customer-Token': token } : {},
      });
      const id = res.data.data.id;
      if (res.data.customer_token) {
        localStorage.setItem('customer_token', res.data.customer_token);
      }
      setConversationId(id);
      localStorage.setItem(`conv_${storeSlug}`, id);
      qc.invalidateQueries({ queryKey: ['chat-widget', 'messages', id] });
    } finally {
      setIsStarting(false);
    }
  };

  const sendMutation = useMutation({
    mutationFn: async (body: string) => {
      const token = getCustomerToken();
      await api.post(`/chat/conversations/${conversationId}/messages`, { body }, {
        headers: token ? { 'X-Customer-Token': token } : {},
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat-widget', 'messages', conversationId] }),
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

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat Window */}
      {open && (
        <div className="w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
          style={{ height: '420px' }}>

          {/* Header */}
          <div className="bg-charcoal-900 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-lime-accent rounded-lg flex items-center justify-center text-charcoal-900 font-bold text-xs">
                {(storeName ?? storeSlug).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-white text-xs font-semibold">{storeName ?? storeSlug}</p>
                <p className="text-[10px] text-lime-accent flex items-center gap-1">
                  <span className="w-1 h-1 bg-lime-accent rounded-full inline-block animate-pulse" />
                  Online
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50" data-lenis-prevent>
            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-xs text-slate-500">Mulai percakapan dengan seller 👋</p>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={cn('flex', msg.sender_type === 'buyer' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed',
                  msg.sender_type === 'buyer'
                    ? 'bg-charcoal-900 text-white rounded-br-sm'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                )}>
                  {msg.body}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-2 border-t border-slate-100 bg-white shrink-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ketik pesan..."
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-accent/30 focus:border-lime-accent bg-slate-50 transition"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStarting || sendMutation.isPending}
                className="w-8 h-8 bg-charcoal-900 text-white rounded-xl flex items-center justify-center hover:bg-charcoal-800 disabled:opacity-40 transition-all shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-14 h-14 bg-charcoal-900 text-white rounded-2xl shadow-xl flex items-center justify-center hover:scale-105 hover:bg-charcoal-800 transition-all duration-200"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </div>
  );
}
