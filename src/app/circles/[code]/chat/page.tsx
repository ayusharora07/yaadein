'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Image as ImageIcon, Loader2, MessageSquare, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  _id: string;
  senderId: string;
  senderName: string;
  content: string;
  mediaUrl?: string;
  createdAt: string;
}

export default function CircleChatPage({ params }: { params: { code: string } }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserName, setCurrentUserName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedName = localStorage.getItem('yaadein_user_name') || '';
    setCurrentUserName(storedName);
    fetchMessages();

    // Poll for new messages every 3 seconds
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [params.code]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/circles/${params.code}/chat`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !mediaUrl) return;

    setSending(true);
    try {
      const res = await fetch(`/api/circles/${params.code}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, mediaUrl }),
      });

      if (res.ok) {
        setContent('');
        setMediaUrl('');
        fetchMessages();
      }
    } catch {
      // Error
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 text-white flex flex-col font-sans">
      {/* Mobile Top Navigation */}
      <header className="sticky top-0 z-40 bg-navy-900/90 backdrop-blur-md border-b border-white/10 px-4 h-14 flex items-center justify-between">
        <Link href={`/circles/${params.code}`} className="text-amber-400 hover:text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Circle
        </Link>
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <span className="font-display font-bold text-sm text-white">{params.code} Circle Chat</span>
        </div>
        <div className="w-10" />
      </header>

      {/* Chat Messages Container */}
      <main className="flex-1 max-w-lg w-full mx-auto p-4 overflow-y-auto space-y-4 pb-24">
        {loading ? (
          <div className="flex justify-center items-center py-20 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl p-8">
            <div className="text-4xl mb-3">💬</div>
            <h3 className="font-display font-bold text-lg text-white mb-1">No Chat Messages Yet</h3>
            <p className="text-xs text-gray-400">Say hello and start the conversation with your circle!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderName.toLowerCase() === currentUserName.toLowerCase();
            return (
              <motion.div
                key={msg._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="text-[10px] text-gray-400 mb-1 px-1">
                  {msg.senderName}
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed shadow-md ${
                    isMe
                      ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-navy-900 font-medium rounded-tr-none'
                      : 'bg-white/10 text-white rounded-tl-none border border-white/10'
                  }`}
                >
                  {msg.mediaUrl && (
                    <div className="mb-2 rounded-xl overflow-hidden max-h-48 bg-black/20">
                      {msg.mediaUrl.startsWith('data:video') ? (
                        <video src={msg.mediaUrl} controls className="w-full max-h-48 object-cover" />
                      ) : (
                        <img src={msg.mediaUrl} alt="Chat media" className="w-full max-h-48 object-cover" />
                      )}
                    </div>
                  )}
                  {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                </div>
                <span className="text-[9px] text-gray-500 mt-1 px-1">
                  {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                </span>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Fixed Bottom Input Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-navy-900/90 backdrop-blur-xl border-t border-white/10 p-3 z-40">
        <div className="max-w-lg mx-auto">
          {mediaUrl && (
            <div className="relative mb-2 inline-block rounded-xl overflow-hidden border border-white/20 bg-black/40">
              <img src={mediaUrl} alt="Preview" className="h-16 w-16 object-cover" />
              <button
                type="button"
                onClick={() => setMediaUrl('')}
                className="absolute top-1 right-1 p-1 bg-rose-500 rounded-full text-white"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}

          <form onSubmit={handleSend} className="flex items-center gap-2">
            <label className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-amber-400 cursor-pointer transition-colors shrink-0">
              <ImageIcon className="w-4 h-4" />
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />

            <button
              type="submit"
              disabled={sending || (!content.trim() && !mediaUrl)}
              className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-navy-900 font-bold disabled:opacity-40 transition-all shrink-0"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
