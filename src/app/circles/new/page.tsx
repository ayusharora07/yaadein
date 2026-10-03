'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft } from 'lucide-react';

const EMOJIS = ['✨', '🎓', '🏠', '💼', '🎮', '🎵', '🏃', '📚', '🚀', '🔥', '💖', '🌟', '🎉', '🌈', '🤝'];

export default function NewCirclePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('✨');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/circles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, emoji })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create circle');

      // Immediately enter creator into their new circle!
      router.push(`/circles/${data.code}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card max-w-md w-full p-8 z-10"
      >
        <Link href="/feed" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-amber-400 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Feed
        </Link>

        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-gradient-amber mb-2">New Circle</h1>
          <p className="text-gray-400 text-sm">Create a space for your memories together.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Circle Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="e.g. College Crew, Family 2025"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description <span className="normal-case text-gray-600">(optional)</span></label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              placeholder="What's this circle about?"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Choose an Emoji</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`text-2xl w-10 h-10 rounded-xl flex items-center justify-center transition-all ${emoji === e ? 'bg-amber-500/30 ring-2 ring-amber-400' : 'bg-white/5 hover:bg-white/10'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-rose-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-navy-900 font-bold text-base shadow-lg shadow-amber-500/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Circle & Enter ✨'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
