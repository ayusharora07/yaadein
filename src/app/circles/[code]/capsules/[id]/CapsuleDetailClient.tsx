'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Lock, Unlock, Clock, Plus, Sparkles, Image as ImageIcon, 
  MessageSquare, Loader2, User, Key, Volume2, VolumeX, Play, Pause, 
  Headphones, Film, ChevronLeft, ChevronRight, X, Maximize2, Heart, Music, Mic
} from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';

export default function CapsuleDetailClient({ 
  initialCapsule, 
  code, 
  currentUser 
}: { 
  initialCapsule: { 
    _id: string, 
    title: string, 
    description?: string, 
    status: string, 
    createdBy: string, 
    creatorName: string, 
    unlockAt: string, 
    unlockedAt?: string, 
    aiSummary?: string, 
    narrationUrl?: string, 
    contributions: Array<{ id: string, userName: string, addedAt: string, type: string, mediaUrl?: string, content?: string }> 
  }, 
  code: string, 
  currentUser: { userId: string } 
}) {
  const router = useRouter();
  const [capsule, setCapsule] = useState(initialCapsule);
  const [loading, setLoading] = useState(false);
  
  // Hydration state fix
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Form input
  const [contributionType, setContributionType] = useState<'text' | 'photo'>('text');
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');

  // Sealed timer
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number, raw: string, isPast: boolean } | null>(null);

  // Voice & Music Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState(0);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  // Fullscreen Reel Slideshow state
  const [isReelOpen, setIsReelOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isReelPlaying, setIsReelPlaying] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Audio player scroller state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Build a rich narration text from actual memories contributed by circle members
  const contributionSnippets = capsule.contributions
    .filter(c => c.content)
    .map(c => `${c.userName} wrote: "${c.content}"`)
    .join('. ');
  const textToNarrate = [
    capsule.aiSummary || capsule.description || '',
    contributionSnippets,
  ].filter(Boolean).join(' ') || capsule.title;

  // A short cache-buster based on contribution count so new memories = new audio
  const cacheKey = capsule.contributions.length;
  const ttsUrl = `/api/tts?text=${encodeURIComponent(textToNarrate)}&title=${encodeURIComponent(capsule.title)}&v=${cacheKey}`;

  const handleTimeUpdate = () => {
    if (!bgMusicRef.current) return;
    const cur = bgMusicRef.current.currentTime || 0;
    const dur = bgMusicRef.current.duration || 0;
    setCurrentTime(cur);
    if (!isNaN(dur) && isFinite(dur) && dur > 0) {
      setDuration(dur);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!bgMusicRef.current) return;
    const newTime = parseFloat(e.target.value);
    bgMusicRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatSecs = (sec: number) => {
    if (isNaN(sec) || !isFinite(sec) || sec <= 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isCreator = capsule.createdBy === currentUser.userId;

  // Split AI Summary into emotional sentences for live story highlighting
  const storySentences = (capsule.aiSummary || "Here is your group story.").split(/(?<=[.!?])\s+/);

  // Sealed countdown timer
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

  // Clean up audio & speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
      }
    };
  }, []);

  // Voice Player Toggle (ElevenLabs Stream with WebSpeech Fallback)
  const toggleEmotionalStoryPlayer = async () => {
    const audio = bgMusicRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      return;
    }

    try {
      setIsAudioLoading(true);

      // Fetch audio stream directly to verify non-error response
      const res = await fetch(ttsUrl);
      if (!res.ok) {
        throw new Error(`TTS API returned status ${res.status}`);
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('audio')) {
        throw new Error('TTS response is not audio');
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      audio.src = objectUrl;
      audio.volume = 1.0;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
      setIsPlaying(true);
    } catch (playErr) {
      console.warn('Audio element play error, speaking via WebSpeech:', playErr);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToNarrate);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    } finally {
      setIsAudioLoading(false);
    }
  };

  // Story Reel Slideshow Autoplay Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isReelOpen && isReelPlaying && capsule.contributions.length > 0) {
      interval = setInterval(() => {
        setActiveSlide((prev) => {
          if (prev >= capsule.contributions.length - 1) {
            setIsReelPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 5500);
    }
    return () => clearInterval(interval);
  }, [isReelOpen, isReelPlaying, capsule.contributions.length]);

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
                Unlocks {isMounted ? new Date(capsule.unlockAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-black/20 border border-white/5 max-w-sm flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Total Memories</p>
                <p className="text-2xl font-bold text-white">{capsule.contributions.length}</p>
              </div>
              <div className="flex -space-x-3 overflow-hidden">
                {Array.from(new Set(capsule.contributions.map((c) => c.userName))).slice(0, 5).map((name, i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-violet-600 border-2 border-slate-900 flex items-center justify-center text-xs font-bold text-white shadow-sm" title={name as string}>
                    {(name as string).charAt(0).toUpperCase()}
                  </div>
                ))}
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
  // UNLOCKED STATE UI (CINEMATIC EMOTIONAL EXPERIENCE)
  // ---------------------------------------------
  const renderUnlockedState = () => (
    <div className="space-y-12 pb-20">
      {/* ElevenLabs Real Voice Audio Player - src set dynamically on play to avoid partial range pre-fetch */}
      <audio 
        ref={bgMusicRef}
        preload="none"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onCanPlay={() => setIsAudioLoading(false)}
        onPlaying={() => { setIsPlaying(true); setIsAudioLoading(false); }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => { setIsPlaying(false); setIsAudioLoading(false); }}
      />

      {/* Hero Header */}
      <div className="text-center space-y-6 pt-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-violet-600/30 via-fuchsia-600/20 to-pink-600/30 blur-[140px] rounded-full pointer-events-none" />
        
        <motion.div 
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-pink-500 shadow-[0_0_70px_-10px_rgba(217,70,239,0.8)] border-4 border-violet-300/40 relative z-10"
        >
          <Sparkles className="w-14 h-14 text-white animate-pulse" />
        </motion.div>
        
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center space-x-2 px-5 py-2 rounded-full text-xs font-bold border bg-emerald-500/20 text-emerald-300 border-emerald-500/40 tracking-wider uppercase shadow-xl backdrop-blur-md">
            <Unlock className="w-4 h-4 mr-1 text-emerald-400" />
            <span>Memory Capsule Unlocked</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-200 via-fuchsia-200 to-pink-200 drop-shadow-lg">
            {capsule.title}
          </h1>
          
          <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto font-light">
            Sealed by <span className="font-semibold text-white">{capsule.creatorName}</span> • Revealed to the squad
          </p>

          {/* Interactive CTA Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => {
                setIsReelOpen(true);
                setIsReelPlaying(true);
                setActiveSlide(0);
              }}
              className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-[0_0_40px_-5px_rgba(217,70,239,0.7)] flex items-center space-x-3 text-lg group transform hover:scale-105"
            >
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-5 h-5 fill-white ml-0.5" />
              </div>
              <span>Play Memory Story Slideshow</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI Storytelling & Emotional Ambient Voice Player */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-8 md:p-10 border border-fuchsia-500/30 bg-gradient-to-br from-violet-950/80 via-slate-900/95 to-fuchsia-950/60 backdrop-blur-2xl relative overflow-hidden shadow-[0_0_60px_-10px_rgba(168,85,247,0.4)]"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Heart className="w-48 h-48 text-fuchsia-400" />
        </div>

        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-fuchsia-500/20 border border-fuchsia-500/40 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-fuchsia-300" />
            </div>
            <div>
              <h3 className="text-xl font-display font-semibold text-violet-200">The Story of Us</h3>
              <p className="text-xs text-slate-400">Memory Narrative & Spoken Voice Story</p>
            </div>
          </div>

          <button
            onClick={() => setIsMusicMuted(!isMusicMuted)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs flex items-center space-x-2"
          >
            {isMusicMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Music className="w-4 h-4 text-fuchsia-400 animate-pulse" />}
            <span>{isMusicMuted ? 'Music Muted' : 'Ambient Music On'}</span>
          </button>
        </div>

        {/* Narrative Paragraph with Sentence Highlighting */}
        <div className="relative z-10 mb-8 p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md">
          <p className="text-slate-100 text-lg md:text-xl leading-relaxed italic font-serif">
            {storySentences.map((sentence, sIdx) => (
              <span 
                key={sIdx}
                className={`transition-colors duration-300 ${
                  isPlaying && sIdx === currentSentenceIdx 
                    ? 'text-fuchsia-300 font-medium underline decoration-fuchsia-500/50 underline-offset-4' 
                    : 'text-slate-200'
                }`}
              >
                &quot;{sentence}&quot;&nbsp;
              </span>
            ))}
          </p>
        </div>

        {/* EMOTIONAL VOICE STORY PLAYER CONTROLLER */}
        <div className="relative z-10 bg-gradient-to-r from-violet-900/60 to-fuchsia-900/60 p-5 rounded-2xl border border-fuchsia-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => toggleEmotionalStoryPlayer()}
              disabled={isAudioLoading}
              className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-fuchsia-500 to-violet-500 hover:from-fuchsia-400 hover:to-violet-400 text-white flex items-center justify-center shadow-[0_0_25px_rgba(217,70,239,0.6)] transition-all transform hover:scale-105 flex-shrink-0 disabled:opacity-75"
            >
              {isAudioLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              ) : isPlaying ? (
                <Pause className="w-6 h-6 fill-white" />
              ) : (
                <Play className="w-6 h-6 fill-white ml-0.5" />
              )}
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <Mic className="w-4 h-4 text-fuchsia-300" />
                <span className="font-semibold text-white text-base">
                  {isAudioLoading ? 'Loading Voice Stream...' : isPlaying ? 'Playing Voice Story...' : 'Listen to Memory Voice Story'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {isAudioLoading ? 'Synthesizing voice story with ElevenLabs...' : isPlaying ? 'Voice Story Narration' : 'Click Play to hear memories in a nostalgic voice'}
              </p>
            </div>
          </div>

          {/* Equalizer Bar Animation */}
          <div className="flex items-center space-x-1.5 h-10 px-5 bg-black/40 rounded-xl border border-white/10 self-start md:self-auto">
            {[0.5, 0.9, 0.3, 0.8, 0.6, 1.0, 0.4, 0.7, 0.9, 0.3].map((h, idx) => (
              <motion.div
                key={idx}
                animate={isPlaying ? { height: ['15%', `${h * 100}%`, '15%'] } : { height: '15%' }}
                transition={{ repeat: Infinity, duration: 0.7, delay: idx * 0.08 }}
                className="w-1.5 bg-gradient-to-t from-violet-500 via-fuchsia-400 to-pink-300 rounded-full"
              />
            ))}
          </div>

          {/* TIME SCROLLER SEEKBAR */}
          <div className="w-full mt-3 pt-3 border-t border-white/10 space-y-1.5 col-span-full">
            <div className="flex justify-between items-center text-xs text-slate-300 font-mono">
              <span className="flex items-center gap-1.5 font-sans font-semibold text-[11px] text-fuchsia-300">
                <Clock className="w-3.5 h-3.5 text-fuchsia-400" />
                Voice Time Scroller
              </span>
              <span className="bg-black/50 px-2.5 py-0.5 rounded-full border border-white/10 text-white text-[11px]">
                {formatSecs(currentTime)} / {formatSecs(duration)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-black/60 rounded-lg appearance-none cursor-pointer accent-fuchsia-400 focus:outline-none focus:ring-1 focus:ring-fuchsia-400/50"
            />
          </div>
        </div>
      </motion.div>

      {/* Unsealed Memories Cards Grid */}
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h3 className="text-2xl font-display font-bold text-white flex items-center">
            Unsealed Memories ({capsule.contributions.length})
          </h3>
          <span className="text-xs text-slate-400">Click any memory photo to expand</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {capsule.contributions.map((contribution, idx: number) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={contribution.id} 
              className="glass-card rounded-3xl p-6 border border-white/10 bg-white/5 hover:border-fuchsia-500/40 transition-all hover:bg-white/10 group shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-base font-bold text-white shadow-md">
                    {contribution.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-white group-hover:text-fuchsia-300 transition-colors">{contribution.userName}</div>
                    <div className="text-xs text-slate-400">{new Date(contribution.addedAt).toLocaleDateString()}</div>
                  </div>
                </div>
                {contribution.type === 'photo' ? (
                  <span className="p-2.5 rounded-2xl bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    <ImageIcon className="w-4 h-4" />
                  </span>
                ) : (
                  <span className="p-2.5 rounded-2xl bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                    <MessageSquare className="w-4 h-4" />
                  </span>
                )}
              </div>
              
              {contribution.mediaUrl && (
                <div 
                  onClick={() => setLightboxImage(contribution.mediaUrl!)}
                  className="mb-4 rounded-2xl overflow-hidden bg-black/40 border border-white/10 aspect-video relative group cursor-pointer shadow-md"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={contribution.mediaUrl} alt="Memory" className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="w-8 h-8 text-white drop-shadow-lg" />
                  </div>
                </div>
              )}
              
              {contribution.content && (
                <p className="text-slate-200 whitespace-pre-wrap text-base leading-relaxed font-normal">{contribution.content}</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* FULLSCREEN MEMORY REEL SLIDESHOW MODAL */}
      <AnimatePresence>
        {isReelOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-6 md:p-12 overflow-hidden"
          >
            {/* Top Bar: Progress Bars & Controls */}
            <div className="max-w-xl mx-auto w-full space-y-4">
              <div className="flex gap-1.5">
                {capsule.contributions.map((_, i) => (
                  <div key={i} className="h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r from-violet-400 to-fuchsia-400 transition-all duration-300 ${
                        i < activeSlide ? 'w-full' : i === activeSlide ? 'w-full animate-pulse' : 'w-0'
                      }`} 
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-white">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-sm font-bold shadow-md">
                    {capsule.contributions[activeSlide]?.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{capsule.contributions[activeSlide]?.userName}</div>
                    <div className="text-xs text-slate-400">Memory {activeSlide + 1} of {capsule.contributions.length}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsReelPlaying(!isReelPlaying)}
                    className="p-2.5 rounded-full hover:bg-white/10 text-white transition-colors"
                  >
                    {isReelPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                  <button
                    onClick={() => setIsReelOpen(false)}
                    className="p-2.5 rounded-full hover:bg-white/10 text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content Slide */}
            <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col items-center justify-center py-8 relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSlide}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.05, y: -10 }}
                  className="w-full text-center space-y-6"
                >
                  {capsule.contributions[activeSlide]?.mediaUrl && (
                    <div className="max-h-[50vh] rounded-3xl overflow-hidden border border-white/20 shadow-2xl mx-auto inline-block bg-black/50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={capsule.contributions[activeSlide].mediaUrl} 
                        alt="Memory slide" 
                        className="max-h-[50vh] object-contain rounded-3xl"
                      />
                    </div>
                  )}

                  {capsule.contributions[activeSlide]?.content && (
                    <p className="text-white text-2xl md:text-3xl font-display font-medium leading-relaxed max-w-xl mx-auto font-serif drop-shadow-md">
                      &quot;{capsule.contributions[activeSlide].content}&quot;
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Prev / Next Nav Overlay */}
              <button
                onClick={() => setActiveSlide((prev) => Math.max(0, prev - 1))}
                disabled={activeSlide === 0}
                className="absolute left-0 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 transition-all"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={() => setActiveSlide((prev) => Math.min(capsule.contributions.length - 1, prev + 1))}
                disabled={activeSlide === capsule.contributions.length - 1}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 transition-all"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>

            {/* Bottom Footer Caption */}
            <div className="text-center text-xs text-slate-400">
              Capsule: <span className="text-white font-medium">{capsule.title}</span> • Unlocked Memory Reel
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LIGHTBOX MODAL */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          >
            <button className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20">
              <X className="w-6 h-6" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightboxImage} alt="Enlarged Memory" className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain" />
          </motion.div>
        )}
      </AnimatePresence>
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
