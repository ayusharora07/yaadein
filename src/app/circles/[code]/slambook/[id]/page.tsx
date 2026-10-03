'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, Loader2, BookOpen } from 'lucide-react';

type Prompt = { id: string; question: string; category: string };
type Answer = { promptId: string; answer: string };
type Entry = { userId: string; userName: string; answers: Answer[]; completedAt: string };
type SlamBook = { _id: string; title: string; description?: string; prompts: Prompt[]; entries: Entry[] };

const CATEGORY_COLORS = {
  fun: 'bg-emerald-500 text-white',
  nostalgic: 'bg-amber-500 text-white',
  deep: 'bg-violet-500 text-white',
  quirky: 'bg-rose-500 text-white',
};

const CATEGORY_BG = {
  fun: 'bg-emerald-500/10 border-emerald-500/20',
  nostalgic: 'bg-amber-500/10 border-amber-500/20',
  deep: 'bg-violet-500/10 border-violet-500/20',
  quirky: 'bg-rose-500/10 border-rose-500/20',
};

export default function SlamBookViewPage({ params }: { params: { code: string; id: string } }) {
  const router = useRouter();
  const [slambook, setSlambook] = useState<SlamBook | null>(null);
  const [currentUser, setCurrentUser] = useState<{ userId: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fill Mode State
  const [isFilling, setIsFilling] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch session
        const sessionRes = await fetch('/api/auth/session');
        // If there's no dedicated session API, we can assume API routes handle auth and we get slambook.
        // Wait, actually I should create a quick API or just fetch slambook and check if user is in entries.
        // Let's fetch slambook first.
        const res = await fetch(`/api/circles/${params.code}/slambooks/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setSlambook(data);
          
          // Need to figure out current user. In client side, we might not have session unless we decode cookie or have an endpoint.
          // Since we might not have it, let's look at a "whoami" approach, or rely on a wrapper.
          // For now, let's fetch from a known route if exists, else we'll assume we know from context.
          // I will fetch /api/circles/[code] just to see? No, we don't have current user exposed.
          // Let's assume there's an /api/auth/session we can create or just fallback.
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    
    // We can fetch user from a new /api/me route, but for now let's just use the entries logic.
    fetchData();
  }, [params.code, params.id]);

  // Temporary fix to get current user: fetch a lightweight API or from layout.
  useEffect(() => {
    // A quick hack since we don't have /api/me: 
    // We know the API relies on cookies.
    // If the user hasn't answered, they'll just click "Fill out". We won't strictly block it, 
    // the backend will handle who they are!
  }, []);

  if (isLoading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-rose-500 animate-spin" /></div>;
  }

  if (!slambook) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Slam book not found</div>;
  }

  // Determine if user has already answered (optimistic UI)
  // Since we don't have user ID in client, we'll let them choose to "Fill" and backend will just upsert.
  // Ideally, we know their ID. For now, we'll show View mode and a "Submit Answers" button if they want.

  const handleStartFilling = () => {
    setIsFilling(true);
    setCurrentPromptIndex(0);
  };

  const handleAnswerChange = (val: string) => {
    const promptId = slambook.prompts[currentPromptIndex].id;
    setAnswers(prev => ({ ...prev, [promptId]: val }));
  };

  const handleNext = () => {
    if (currentPromptIndex < slambook.prompts.length - 1) {
      setCurrentPromptIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentPromptIndex > 0) {
      setCurrentPromptIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const answersArray = Object.entries(answers).map(([promptId, answer]) => ({ promptId, answer }));
    
    try {
      const res = await fetch(`/api/circles/${params.code}/slambooks/${params.id}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersArray })
      });
      if (res.ok) {
        const updated = await res.json();
        setSlambook(updated);
        setIsFilling(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isFilling) {
    const prompt = slambook.prompts[currentPromptIndex];
    const catColor = CATEGORY_COLORS[prompt.category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.fun;
    const isLast = currentPromptIndex === slambook.prompts.length - 1;
    const currentAnswer = answers[prompt.id] || '';

    return (
      <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
        <div className="p-6 flex items-center justify-between">
          <button onClick={() => setIsFilling(false)} className="text-slate-400 hover:text-white transition">Cancel</button>
          <div className="text-sm font-medium text-slate-500">
            {currentPromptIndex + 1} / {slambook.prompts.length}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={prompt.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-full h-2 ${catColor.split(' ')[0]}`} />
              
              <div className="mb-8">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${catColor}`}>
                  {prompt.category}
                </span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-8 leading-tight">
                {prompt.question}
              </h2>
              
              <textarea
                value={currentAnswer}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-6 text-xl min-h-[200px] focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all resize-none"
                autoFocus
              />
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between w-full mt-8">
            <button
              onClick={handlePrev}
              disabled={currentPromptIndex === 0}
              className="p-4 bg-slate-900 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {!isLast ? (
              <button
                onClick={handleNext}
                disabled={!currentAnswer.trim()}
                className="flex items-center gap-2 px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-full font-bold shadow-lg shadow-rose-500/20 disabled:opacity-50 transition"
              >
                Next <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!currentAnswer.trim() || isSubmitting}
                className="flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Submit All</>}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // View Mode
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-6 md:p-12 pb-32">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <Link href={`/circles/${params.code}/slambook`} className="text-rose-400 hover:text-rose-300 text-sm font-medium mb-4 inline-block transition-colors">
            ← Back to Slam Books
          </Link>
          <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
            <BookOpen className="w-10 h-10 text-rose-500 -rotate-3" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white">
            {slambook.title}
          </h1>
          {slambook.description && (
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">{slambook.description}</p>
          )}
          
          <div className="pt-6">
            <button
              onClick={handleStartFilling}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-500/20 transition-all hover:-translate-y-1"
            >
              Fill Out Slam Book
            </button>
          </div>
        </div>

        {/* Answers List */}
        <div className="space-y-16 mt-16">
          {slambook.prompts.map((prompt, index) => {
            const catBg = CATEGORY_BG[prompt.category as keyof typeof CATEGORY_BG] || CATEGORY_BG.fun;
            const catColor = CATEGORY_COLORS[prompt.category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.fun;
            
            // Get all answers for this prompt
            const promptAnswers = slambook.entries
              .map(entry => {
                const ans = entry.answers.find(a => a.promptId === prompt.id);
                return ans ? { userName: entry.userName, answer: ans.answer, userId: entry.userId } : null;
              })
              .filter(Boolean);

            return (
              <div key={prompt.id} className="relative">
                <div className="sticky top-0 z-10 pt-4 pb-6 bg-slate-950/90 backdrop-blur-md">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md ${catColor}`}>
                      {prompt.category}
                    </span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-display font-bold text-white flex items-start gap-4">
                    <span className="text-slate-700 select-none">{index + 1}.</span>
                    {prompt.question}
                  </h3>
                </div>

                <div className="grid gap-4 mt-2 pl-0 md:pl-12">
                  {promptAnswers.length === 0 ? (
                    <div className="p-6 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-center italic">
                      No answers yet. Be the first!
                    </div>
                  ) : (
                    promptAnswers.map((pa, i) => (
                      <div key={i} className={`p-5 rounded-2xl border ${catBg} backdrop-blur-sm`}>
                        <p className="text-lg text-slate-200 mb-3">{pa?.answer}</p>
                        <div className="text-sm font-medium opacity-80 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs">
                            {pa?.userName.charAt(0).toUpperCase()}
                          </div>
                          {pa?.userName}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
