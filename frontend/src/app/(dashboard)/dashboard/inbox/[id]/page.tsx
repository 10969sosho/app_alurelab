'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft, Send, Loader2, User } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Message {
  id:          string;
  sender_type: 'seller' | 'buyer';
  body:        string;
  created_at:  string;
}

export default function SellerInboxThreadPage() {
  const { id } = useParams<{ id: string }>();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  // Fetch thread
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ['seller', 'inbox', id],
    queryFn: async () => {
      const res = await api.get(`/chat/conversations/${id}/messages`);
      return res.data.data;
    },
    refetchInterval: 3000,
  });

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send reply
  const sendMutation = useMutation({
    mutationFn: async (body: string) => {
      await api.post(`/chat/conversations/${id}/messages`, { body });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller', 'inbox', id] });
      qc.invalidateQueries({ queryKey: ['seller', 'inbox'] });
    },
  });

  const handleSend = () => {
    const body = input.trim();
    if (!body || sendMutation.isPending) return;
    setInput('');
    sendMutation.mutate(body);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 shrink-0">
        <Link
          href="/dashboard/inbox"
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="w-8 h-8 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center text-white shrink-0">
          <User className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Pembeli</p>
          <p className="text-[11px] text-slate-400">Percakapan aktif</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3" data-lenis-prevent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">Belum ada pesan</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn('flex', msg.sender_type === 'seller' ? 'justify-end' : 'justify-start')}
            >
              {msg.sender_type === 'buyer' && (
                <div className="w-6 h-6 bg-violet-400 rounded-full flex items-center justify-center mr-2 mt-0.5 shrink-0">
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                  msg.sender_type === 'seller'
                    ? 'bg-charcoal-900 text-white rounded-br-sm'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-xs'
                )}
              >
                <p>{msg.body}</p>
                <p className="text-[10px] mt-1 opacity-60">
                  {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  {msg.sender_type === 'seller' && <span className="ml-1">• Kamu</span>}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="pt-3 border-t border-slate-200 shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Balas pesan pembeli..."
            rows={2}
            className="flex-1 resize-none px-4 py-2.5 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-accent/40 focus:border-lime-accent transition bg-slate-50"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
            className="w-10 h-10 bg-charcoal-900 text-white rounded-xl flex items-center justify-center hover:bg-charcoal-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
          >
            {sendMutation.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5">Enter untuk kirim · Shift+Enter untuk baris baru</p>
      </div>
    </div>
  );
}
