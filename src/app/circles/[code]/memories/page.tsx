'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Search, BookOpen, Clock, Loader2, Wand2 } from 'lucide-react';

interface TimelineEntry {
  date: string;
  title: string;
  summary: string;
}

interface CuratorResult {
  narrative: string;
  timeline: TimelineEntry[];
  memoriesUsed: number;
  query: string;
}

export default function MemoryCuratorPage({ params }: { params: { code: string } }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CuratorResult | null>(null);
  const [error, setError] = useState('');

  const suggestions = [
    'Build a story from our best moments',
    'What are our funniest memories?',
    'Tell the story of our friendship',
    'Memories from our early days',
    'Our most meaningful moments together',
  ];

  const handleCurate = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`/api/circles/${params.code}/memories/curate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch {
      setError('Failed to connect. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900">
      {/* Ambient glows */}
      <div className="fixed top-20 right-[-200px] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-20 left-[-200px] w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href={`/circles/${params.code}`}
            className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold text-white/90 flex items-center gap-2">
              <Wand2 className="w-6 h-6 text-emerald-400" />
              AI Memory Curator
            </h1>
            <p className="text-sm text-white/40">
              Ask the AI to weave your memories into a story
            </p>
          </div>
        </div>

        {/* Search Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 mb-6"
        >
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCurate()}
                placeholder="Ask about your memories..."
                className="input-glass pl-12"
                disabled={loading}
              />
            </div>
            <button
              onClick={() => handleCurate()}
              disabled={loading || !query.trim()}
              className="btn-primary flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 hover:shadow-emerald-500/25"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Curate
            </button>
          </div>

          {/* Suggestions */}
          {!result && !loading && (
            <div className="mt-4 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => { setQuery(s); handleCurate(s); }}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-white/50 hover:bg-white/[0.08] hover:text-white/70 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-4 mb-6 border-rose-500/20"
          >
            <p className="text-rose-400 text-sm">{error}</p>
          </motion.div>
        )}

        {/* Loading */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass-card p-12 text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 mb-6 animate-pulse">
                <Wand2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="font-display text-xl font-semibold text-white/80 mb-2">
                Curating your memories...
              </h3>
              <p className="text-white/40 text-sm">
                The AI is searching through your moments, grouping themes, and weaving a story.
              </p>
              <div className="mt-6 flex justify-center gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
                    style={{ animationDelay: `${i * 0.3}s` }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Stats */}
              <div className="flex gap-3">
                <span className="badge-emerald">
                  <BookOpen className="w-3 h-3 mr-1" />
                  {result.memoriesUsed} memories woven
                </span>
                <span className="badge bg-white/[0.06] text-white/50 border border-white/[0.1]">
                  <Search className="w-3 h-3 mr-1" />
                  &ldquo;{result.query}&rdquo;
                </span>
              </div>

              {/* Narrative */}
              <div className="glass-card p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-display text-lg font-semibold text-white/90">Your Story</h3>
                </div>
                <div className="prose prose-invert max-w-none">
                  {result.narrative.split('\n').map((paragraph, i) => (
                    <p key={i} className="text-white/70 leading-relaxed mb-4 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              {result.timeline.length > 0 && (
                <div className="glass-card p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <Clock className="w-5 h-5 text-amber-400" />
                    <h3 className="font-display text-lg font-semibold text-white/90">Timeline</h3>
                  </div>
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-amber-500/30 via-amber-500/10 to-transparent" />

                    <div className="space-y-6">
                      {result.timeline.map((entry, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex gap-4 pl-2"
                        >
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/20 border-2 border-amber-500/40 mt-1 relative z-10" />
                          <div>
                            <span className="text-xs text-amber-400/60 font-medium">
                              {entry.date}
                            </span>
                            <h4 className="text-sm font-semibold text-white/80 mt-0.5">
                              {entry.title}
                            </h4>
                            <p className="text-xs text-white/50 mt-1">
                              {entry.summary}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state when no search yet */}
        {!result && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-16"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/[0.03] border border-white/[0.06] mb-6">
              <Wand2 className="w-10 h-10 text-white/20" />
            </div>
            <h3 className="font-display text-xl font-semibold text-white/40 mb-2">
              What story should we tell?
            </h3>
            <p className="text-white/30 text-sm max-w-md mx-auto">
              Ask the AI to search through your circle&apos;s moments and weave them into a narrative.
              Try something like &ldquo;Our funniest memories&rdquo; or &ldquo;The story of our friendship.&rdquo;
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
