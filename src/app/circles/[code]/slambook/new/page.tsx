'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2, ArrowRight, Loader2, BookOpen, Lock, Globe, Sparkles } from 'lucide-react';
import { nanoid } from 'nanoid';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_COLORS = {
  fun: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  nostalgic: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  deep: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  quirky: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
};

type Prompt = { id: string; question: string; category: string };

export default function NewSlamBookPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [prompts, setPrompts] = useState<Prompt[]>([
    { id: nanoid(), question: 'What is your favorite memory of us?', category: 'nostalgic' },
    { id: nanoid(), question: 'Describe me in 3 words!', category: 'fun' },
    { id: nanoid(), question: 'What is one piece of advice you have for me?', category: 'deep' },
  ]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGenerateAIPrompts = async () => {
    try {
      setIsGeneratingAI(true);
      const res = await fetch(`/api/circles/${params.code}/slambooks/generate-prompts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: title || 'fun college memories and secrets' }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.prompts && Array.isArray(data.prompts) && data.prompts.length > 0) {
          const formatted = data.prompts.map((p: { question: string; category: string }) => ({
            id: nanoid(),
            question: p.question,
            category: p.category || 'fun',
          }));
          setPrompts(formatted);
        }
      }
    } catch (err) {
      console.error('Error generating AI prompts:', err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const addEmptyPrompt = () => {
    setPrompts([...prompts, { id: nanoid(), question: '', category: 'fun' }]);
  };

  const updatePrompt = (id: string, field: 'question' | 'category', value: string) => {
    setPrompts(prompts.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removePrompt = (id: string) => {
    setPrompts(prompts.filter(p => p.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || prompts.length === 0) return;

    const validPrompts = prompts.filter(p => p.question.trim().length > 0);
    if (validPrompts.length === 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/circles/${params.code}/slambooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, prompts: validPrompts, isPrivate })
      });

      if (res.ok) {
        router.push(`/circles/${params.code}/slambook`);
        router.refresh();
      }
    } catch (error) {
      console.error('Error creating slam book:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 text-white font-sans p-4 md:p-12 pb-24">
      <div className="max-w-xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <Link href={`/circles/${params.code}/slambook`} className="text-rose-400 hover:text-rose-300 text-xs font-semibold mb-3 inline-block transition-colors">
            ← Back to Slam Books
          </Link>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-rose-500" />
            Create Slam Book
          </h1>
          <p className="text-gray-400 text-sm mt-1">Design a questionnaire for your circle.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info & Privacy */}
          <div className="bg-navy-800 border border-white/10 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Slam Book Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Our Chapter 2026"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500 placeholder:text-gray-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description <span className="normal-case text-gray-600">(Optional)</span></label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this slam book about?"
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500 placeholder:text-gray-600 resize-none"
              />
            </div>

            {/* Privacy Setting Toggle */}
            <div className="pt-3 border-t border-white/10">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Privacy Setting</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsPrivate(false)}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${!isPrivate ? 'bg-rose-500/20 border-rose-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm mb-1">
                    <Globe className="w-4 h-4 text-emerald-400" /> Public to Circle
                  </div>
                  <p className="text-[11px] opacity-70 leading-snug">All circle members can read filled responses.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrivate(true)}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${isPrivate ? 'bg-rose-500/20 border-rose-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm mb-1">
                    <Lock className="w-4 h-4 text-amber-400" /> Private (Only Me)
                  </div>
                  <p className="text-[11px] opacity-70 leading-snug">Only you can read responses filled by friends.</p>
                </button>
              </div>
            </div>
          </div>

          {/* Prompts List Header with AI button */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-display font-bold text-white">Questions / Prompts ({prompts.length})</h3>
              <button
                type="button"
                onClick={handleGenerateAIPrompts}
                disabled={isGeneratingAI}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-rose-500/20 disabled:opacity-50"
              >
                {isGeneratingAI ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Auto-Generate (Gemma 2 AI)
                  </>
                )}
              </button>
            </div>

            <AnimatePresence>
              {prompts.map((prompt, index) => (
                <motion.div
                  key={prompt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-navy-800 border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row gap-3 relative group"
                >
                  <div className="w-6 h-6 bg-white/10 text-amber-400 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                    {index + 1}
                  </div>

                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      value={prompt.question}
                      onChange={(e) => updatePrompt(prompt.id, 'question', e.target.value)}
                      placeholder="Type your prompt question..."
                      className="w-full bg-transparent text-sm text-white font-medium border-b border-white/10 focus:border-rose-500 py-1.5 focus:outline-none transition-colors"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {Object.keys(CATEGORY_COLORS).map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => updatePrompt(prompt.id, 'category', cat)}
                          className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border transition-all capitalize ${
                            prompt.category === cat
                              ? CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS]
                              : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removePrompt(prompt.id)}
                    className="self-end md:self-start p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            <button
              type="button"
              onClick={addEmptyPrompt}
              className="w-full py-3.5 border-2 border-dashed border-white/10 hover:border-rose-500/50 text-gray-400 hover:text-rose-400 rounded-2xl flex items-center justify-center gap-2 text-xs font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Custom Question
            </button>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || prompts.filter(p => p.question.trim().length > 0).length === 0 || !title}
              className="w-full py-4 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Slam Book <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
