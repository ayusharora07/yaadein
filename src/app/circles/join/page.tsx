'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft } from 'lucide-react';

function JoinCircleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/circles/${code.toUpperCase()}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join circle');

      router.push(`/circles/${code.toUpperCase()}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card max-w-md w-full p-8 z-10"
    >
      <Link href="/feed" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-amber-400 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Feed
      </Link>

      <div className="text-center mb-8">
        <h1 className="font-display text-4xl font-bold text-gradient-violet mb-2">Join a Circle</h1>
        <p className="text-gray-400 text-sm">Enter the invite code from your friends.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Invite Code</label>
          <input
            type="text"
            required
            maxLength={6}
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 uppercase tracking-widest font-display text-2xl text-center text-white placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="XXXXXX"
          />
        </div>

        {error && <p className="text-rose-400 text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading || code.length < 6}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-navy-900 font-bold text-base shadow-lg shadow-amber-500/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Join Circle 🚀'}
        </button>
      </form>
    </motion.div>
  );
}

export default function JoinCirclePage() {
  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[100px]" />

      <Suspense fallback={<div className="text-white text-center">Loading...</div>}>
        <JoinCircleContent />
      </Suspense>
    </div>
  );
}
