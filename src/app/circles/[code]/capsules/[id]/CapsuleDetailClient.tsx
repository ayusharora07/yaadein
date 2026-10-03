'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Lock, Unlock, Clock, Plus, Sparkles, Image as ImageIcon, MessageSquare, Loader2, User, Key
} from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';

export default function CapsuleDetailClient({ initialCapsule, code, currentUser }: { initialCapsule: { _id: string, title: string, description?: string, status: string, createdBy: string, creatorName: string, unlockAt: string, unlockedAt?: string, aiSummary?: string, contributions: Array<{ id: string, userName: string, addedAt: string, type: string, mediaUrl?: string, content?: string }> }, code: string, currentUser: { userId: string } }) {
  const router = useRouter();
  const [capsule, setCapsule] = useState(initialCapsule);
  const [loading, setLoading] = useState(false);
  
  // Open state form
  const [contributionType, setContributionType] = useState<'text' | 'photo'>('text');
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');

  // Sealed state timer
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number, raw: string, isPast: boolean } | null>(null);

  const isCreator = capsule.createdBy === currentUser.userId;

  useEffect(() => {
    if (capsule.status === 'sealed') {
      const updateTimer = () => {
        const unlockDate = new Date(capsule.unlockAt);
        const past = isPast(unlockDate);
        
        if (past) {
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, raw: 'Ready to unlock', isPast: true });
          return;
        }

        const diff = unlockDate.getTime() - new Date().getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        
        setTimeLeft({ days, hours, minutes, seconds, raw: formatDistanceToNow(unlockDate), isPast: false });
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [capsule.status, capsule.unlockAt]);

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !mediaUrl) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/circles/${code}/capsules/${capsule._id}/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: contributionType, content, mediaUrl: contributionType === 'photo' ? mediaUrl : undefined }),
      });

      if (!res.ok) throw new Error('Failed to contribute');
      const data = await res.json();
      
      setCapsule({
        ...capsule,
        contributions: [...capsule.contributions, data.contribution]
      });
      setContent('');
      setMediaUrl('');
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeal = async () => {
    if (!confirm('Are you sure you want to seal this capsule? No more memories can be added!')) return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/circles/${code}/capsules/${capsule._id}/seal`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to seal');
      const data = await res.json();
      setCapsule(data.capsule);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (force = false) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/circles/${code}/capsules/${capsule._id}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      });
      if (!res.ok) throw new Error('Failed to unlock');
      const data = await res.json();
      setCapsule(data.capsule);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------
  // OPEN STATE UI
  // ---------------------------------------------
  const renderOpenState = () => (
    <div className="space-y-8">
      <div className="glass-card rounded-3xl p-8 border border-white/10 bg-white/5 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Unlock className="w-48 h-48 text-emerald-500" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-8">
          <div className="flex-1 space-y-6">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-emerald-500/20 text-emerald-300 border-emerald-500/30 mb-4">
                <Unlock className="w-4 h-4" />
                <span>Open for Contributions</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">{capsule.title}</h1>
              {capsule.description && (
                <p className="text-slate-300 max-w-xl text-lg">{capsule.description}</p>
              )}
            </div>
            
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center text-slate-400">
                <User className="w-4 h-4 mr-2" />
                Created by {capsule.creatorName}
              </div>
              <div className="flex items-center text-slate-400">
                <Clock className="w-4 h-4 mr-2" />
                Unlocks {new Date(capsule.unlockAt).toLocaleDateString()}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-black/20 border border-white/5 max-w-sm flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Total Memories</p>
                <p className="text-2xl font-bold text-white">{capsule.contributions.length}</p>
              </div>
              <div className="flex -space-x-3 overflow-hidden">
                {/* Show avatars or initials of contributors */}
                {Array.from(new Set(capsule.contributions.map((c) => c.userName))).slice(0, 5).map((name, i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-violet-600 border-2 border-slate-900 flex items-center justify-center text-xs font-bold text-white shadow-sm" title={name as string}>
                    {(name as string).charAt(0).toUpperCase()}
                  </div>
                ))}
                {new Set(capsule.contributions.map((c) => c.userName)).size > 5 && (
                  <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-xs font-bold text-slate-300 shadow-sm">
                    +{new Set(capsule.contributions.map((c) => c.userName)).size - 5}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {isCreator && (
            <div className="w-full md:w-auto flex-shrink-0">
              <button
                onClick={handleSeal}
                disabled={loading}
                className="w-full md:w-auto bg-amber-600 hover:bg-amber-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-[0_0_20px_-5px_rgba(245,158,11,0.5)] flex items-center justify-center"
              >
                {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Lock className="w-5 h-5 mr-2" />}
                Seal Capsule Now
              </button>
              <p className="text-xs text-slate-400 text-center mt-3 max-w-[200px]">
                Once sealed, no one can add more memories until it unlocks.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="glass-card rounded-3xl p-8 border border-white/10 bg-white/5 backdrop-blur-md">
        <h2 className="text-2xl font-display font-bold text-white mb-6">Add a Memory</h2>
        
        <div className="flex space-x-2 mb-6">
          <button
            type="button"
            onClick={() => setContributionType('text')}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors ${
              contributionType === 'text' 
                ? 'bg-violet-600 text-white' 
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Note
          </button>
          <button
            type="button"
            onClick={() => setContributionType('photo')}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors ${
              contributionType === 'photo' 
                ? 'bg-violet-600 text-white' 
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Photo
          </button>
        </div>

        <form onSubmit={handleContribute} className="space-y-4">
          {contributionType === 'photo' && (
            <input
              type="url"
              placeholder="Paste image URL (for demo)"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              required
            />
          )}
          
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={contributionType === 'text' ? "Write something you want them to read later..." : "Add a caption for this photo..."}
            rows={4}
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            required={contributionType === 'text'}
          />
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || (!content.trim() && !mediaUrl)}
              className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center shadow-lg"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add to Capsule
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // ---------------------------------------------
  // SEALED STATE UI
  // ---------------------------------------------
  const renderSealedState = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-12">
      <div className="relative">
        <motion.div 
          animate={{ scale: [1, 1.05, 1] }} 
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="absolute inset-0 bg-amber-500/20 blur-[100px] rounded-full"
        />
        <div className="relative z-10 w-40 h-40 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-[0_0_50px_-10px_rgba(245,158,11,0.5)] border-4 border-amber-300/30 mx-auto">
          <Lock className="w-20 h-20 text-white drop-shadow-md" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-amber-500/20 text-amber-300 border-amber-500/30 mb-2">
          <Lock className="w-4 h-4" />
          <span>Sealed tight</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white">{capsule.title}</h1>
        <p className="text-slate-400 text-lg">
          {capsule.contributions.length} memories locked inside by {capsule.creatorName}.
        </p>
      </div>

      <div className="glass-card rounded-3xl p-8 md:p-12 border border-white/10 bg-white/5 backdrop-blur-xl w-full max-w-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
        <h3 className="text-slate-400 font-medium mb-6 uppercase tracking-widest text-sm">Unlocks In</h3>
        
        {timeLeft ? (
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
              <div className="text-3xl md:text-5xl font-display font-bold text-amber-400">{timeLeft.days}</div>
              <div className="text-xs text-slate-400 uppercase mt-2">Days</div>
            </div>
            <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
              <div className="text-3xl md:text-5xl font-display font-bold text-amber-400">{timeLeft.hours}</div>
              <div className="text-xs text-slate-400 uppercase mt-2">Hours</div>
            </div>
            <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
              <div className="text-3xl md:text-5xl font-display font-bold text-amber-400">{timeLeft.minutes}</div>
              <div className="text-xs text-slate-400 uppercase mt-2">Mins</div>
            </div>
            <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
              <div className="text-3xl md:text-5xl font-display font-bold text-amber-400">{timeLeft.seconds}</div>
              <div className="text-xs text-slate-400 uppercase mt-2">Secs</div>
            </div>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        )}

        {timeLeft?.isPast && (
          <div className="mt-10">
            <button
              onClick={() => handleUnlock()}
              disabled={loading}
              className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-8 py-4 rounded-xl font-bold transition-all shadow-[0_0_20px_-5px_rgba(245,158,11,0.5)] flex items-center justify-center mx-auto text-lg w-full md:w-auto"
            >
              {loading ? <Loader2 className="w-6 h-6 mr-2 animate-spin" /> : <Key className="w-6 h-6 mr-2" />}
              Unlock Capsule Now
            </button>
          </div>
        )}
      </div>

      {/* Demo helper */}
      {!timeLeft?.isPast && (
        <div className="pt-10 opacity-30 hover:opacity-100 transition-opacity">
          <button 
            onClick={() => handleUnlock(true)}
            className="text-xs bg-white/5 border border-white/10 px-4 py-2 rounded-full hover:bg-white/10 transition-colors"
          >
            Force Unlock (Demo)
          </button>
        </div>
      )}
    </div>
  );

  // ---------------------------------------------
  // UNLOCKED STATE UI
  // ---------------------------------------------
  const renderUnlockedState = () => (
    <div className="space-y-12 pb-20">
      <div className="text-center space-y-6 pt-10">
        <motion.div 
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-violet-600 shadow-[0_0_50px_-10px_rgba(124,58,237,0.8)] border-4 border-violet-400/30"
        >
          <Sparkles className="w-12 h-12 text-white" />
        </motion.div>
        
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-violet-500/20 text-violet-300 border-violet-500/30 mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Unlocked</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 mb-4">
            {capsule.title}
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            These memories were sealed by {capsule.creatorName} and have finally been revealed.
          </p>
        </div>
      </div>

      {capsule.aiSummary && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-8 border border-white/10 bg-gradient-to-br from-violet-900/40 to-fuchsia-900/20 backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-6 opacity-20">
            <Sparkles className="w-24 h-24 text-violet-400" />
          </div>
          <h3 className="text-xl font-display font-semibold text-violet-300 mb-4 flex items-center">
            <Sparkles className="w-5 h-5 mr-2" />
            The Story of Us
          </h3>
          <p className="text-white/90 text-lg leading-relaxed italic relative z-10">
            &quot;{capsule.aiSummary}&quot;
          </p>
        </motion.div>
      )}

      <div className="space-y-8">
        <h3 className="text-2xl font-display font-bold text-white border-b border-white/10 pb-4">
          Unsealed Memories ({capsule.contributions.length})
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {capsule.contributions.map((contribution, idx: number) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={contribution.id} 
              className="glass-card rounded-2xl p-6 border border-white/10 bg-white/5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-sm font-bold text-white">
                    {contribution.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{contribution.userName}</div>
                    <div className="text-xs text-slate-400">{new Date(contribution.addedAt).toLocaleDateString()}</div>
                  </div>
                </div>
                {contribution.type === 'photo' ? (
                  <ImageIcon className="w-5 h-5 text-slate-500" />
                ) : (
                  <MessageSquare className="w-5 h-5 text-slate-500" />
                )}
              </div>
              
              {contribution.mediaUrl && (
                <div className="mb-4 rounded-xl overflow-hidden bg-black/40 border border-white/10 aspect-video relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={contribution.mediaUrl} alt="Memory" className="object-cover w-full h-full" />
                </div>
              )}
              
              {contribution.content && (
                <p className="text-slate-200 whitespace-pre-wrap">{contribution.content}</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-sans selection:bg-violet-500/30">
      <div className="max-w-4xl mx-auto">
        <Link 
          href={`/circles/${code}/capsules`}
          className="inline-flex items-center text-slate-400 hover:text-violet-400 transition-colors mb-8 text-sm font-medium z-50 relative"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Capsules
        </Link>
        
        {capsule.status === 'open' && renderOpenState()}
        {capsule.status === 'sealed' && renderSealedState()}
        {capsule.status === 'unlocked' && renderUnlockedState()}
      </div>
    </div>
  );
}
