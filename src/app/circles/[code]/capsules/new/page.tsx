'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { formatDistanceToNow, addDays, isValid } from 'date-fns';

export default function NewCapsulePage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [unlockDate, setUnlockDate] = useState(
    addDays(new Date(), 30).toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOpenPicker = () => {
    if (dateInputRef.current && 'showPicker' in dateInputRef.current) {
      try {
        dateInputRef.current.showPicker();
      } catch {
        dateInputRef.current.focus();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !unlockDate) {
      setError('Title and unlock date are required.');
      return;
    }

    const selectedDate = new Date(unlockDate);
    if (!isValid(selectedDate) || selectedDate <= new Date()) {
      setError('Unlock date must be in the future.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/circles/${params.code}/capsules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          unlockAt: selectedDate.toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create capsule');

      router.push(`/circles/${params.code}/capsules/${data.capsule._id}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  };

  const getDaysContext = () => {
    try {
      const date = new Date(unlockDate);
      if (isValid(date) && date > new Date()) {
        return `That's ${formatDistanceToNow(date)} from now!`;
      }
    } catch {
      // Ignored
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-navy-900 text-white p-4 md:p-12 font-sans">
      <div className="max-w-lg mx-auto">
        <Link
          href={`/circles/${params.code}/capsules`}
          className="inline-flex items-center text-gray-400 hover:text-amber-400 transition-colors mb-6 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Capsules
        </Link>

        <div className="bg-navy-800 rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500" />

          <h1 className="text-3xl font-display font-bold text-white mb-2">
            Create a Time Capsule
          </h1>
          <p className="text-gray-400 text-sm mb-8">
            Set a future date, invite friends to add memories, and seal it away.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3 rounded-xl text-xs">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Capsule Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Goa Trip 2026 Memories"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
                maxLength={60}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Description <span className="normal-case text-gray-600">(Optional)</span></label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this capsule about?"
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                maxLength={200}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Unlock Date</label>
              <div
                onClick={handleOpenPicker}
                className="relative cursor-pointer group"
              >
                <input
                  ref={dateInputRef}
                  type="date"
                  value={unlockDate}
                  onChange={(e) => setUnlockDate(e.target.value)}
                  onClick={handleOpenPicker}
                  min={addDays(new Date(), 1).toISOString().split('T')[0]}
                  style={{ colorScheme: 'dark' }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  required
                />
                <button
                  type="button"
                  onClick={handleOpenPicker}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-amber-400 transition-colors"
                >
                  <CalendarIcon className="w-5 h-5" />
                </button>
              </div>
              {unlockDate && (
                <p className="text-xs text-amber-400 font-medium mt-2 flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-2 animate-pulse" />
                  {getDaysContext()}
                </p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-400 text-navy-900 font-bold py-3.5 px-6 rounded-xl text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create & Start Collecting ✨'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
