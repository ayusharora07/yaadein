'use client';

import Link from 'next/link';
import { Lock, Unlock, Clock, Sparkles } from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function CapsuleCard({ capsule, code }: { capsule: { _id: string; title: string; description?: string; status: string; unlockAt: string; unlockedAt?: string; contributions?: Array<unknown> }, code: string }) {
  const [timeLeft, setTimeLeft] = useState('');
  
  useEffect(() => {
    if (capsule.status === 'sealed') {
      const updateTimer = () => {
        const unlockDate = new Date(capsule.unlockAt);
        if (isPast(unlockDate)) {
          setTimeLeft('Ready to unlock!');
        } else {
          setTimeLeft(`Opens in ${formatDistanceToNow(unlockDate)}`);
        }
      };
      
      updateTimer();
      const interval = setInterval(updateTimer, 60000);
      return () => clearInterval(interval);
    }
  }, [capsule]);

  const getStatusConfig = () => {
    switch (capsule.status) {
      case 'open':
        return {
          color: 'emerald',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          icon: <Unlock className="w-4 h-4" />,
          glow: 'group-hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]'
        };
      case 'sealed':
        return {
          color: 'amber',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          icon: <Lock className="w-4 h-4" />,
          glow: 'group-hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)]'
        };
      case 'unlocked':
        return {
          color: 'violet',
          badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
          icon: <Sparkles className="w-4 h-4" />,
          glow: 'group-hover:shadow-[0_0_30px_-5px_rgba(124,58,237,0.3)]'
        };
      default:
        return { color: 'slate', badge: '', icon: null, glow: '' };
    }
  };

  const config = getStatusConfig();

  return (
    <Link href={`/circles/${code}/capsules/${capsule._id}`}>
      <motion.div 
        whileHover={{ y: -5 }}
        className={`group relative glass-card p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col ${config.glow}`}
      >
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        
        {/* Status Badge */}
        <div className="flex justify-between items-start mb-6 relative z-10">
          <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.badge}`}>
            {config.icon}
            <span className="capitalize">{capsule.status}</span>
          </div>
          
          <div className="text-xs text-slate-400 flex items-center bg-black/20 px-3 py-1 rounded-full">
            <span className="font-semibold text-white mr-1">{capsule.contributions?.length || 0}</span> memories
          </div>
        </div>

        {/* Content */}
        <div className="flex-grow relative z-10">
          <h3 className="text-xl font-display font-bold text-white mb-2 line-clamp-1 group-hover:text-violet-300 transition-colors">
            {capsule.title}
          </h3>
          {capsule.description && (
            <p className="text-sm text-slate-400 line-clamp-2 mb-4">
              {capsule.description}
            </p>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-4 mt-auto border-t border-white/5 flex items-center text-sm text-slate-400 relative z-10">
          <Clock className="w-4 h-4 mr-2 opacity-70" />
          {capsule.status === 'sealed' ? (
            <span className="text-amber-300 font-medium">{timeLeft}</span>
          ) : capsule.status === 'unlocked' ? (
            <span>Unlocked {new Date(capsule.unlockedAt || capsule.unlockAt).toLocaleDateString()}</span>
          ) : (
            <span>Unlocks {new Date(capsule.unlockAt).toLocaleDateString()}</span>
          )}
        </div>

        {/* Status-specific visual effects */}
        {capsule.status === 'sealed' && (
          <div className="absolute -bottom-10 -right-10 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-500 pointer-events-none">
            <Lock className="w-48 h-48 text-amber-500" />
          </div>
        )}
        {capsule.status === 'unlocked' && (
          <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none text-violet-500 flex gap-2">
            <Sparkles className="w-32 h-32" />
          </div>
        )}
      </motion.div>
    </Link>
  );
}
