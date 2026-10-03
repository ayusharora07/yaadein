'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, ArrowRight, Sparkles, Plus, Key } from 'lucide-react';
import UserIdentityBar from './UserIdentityBar';

interface CircleItem {
  code: string;
  name: string;
  emoji?: string;
  membersCount?: number;
}

export default function MyCirclesDashboard() {
  const [myCircles, setMyCircles] = useState<CircleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string>('');

  const fetchUserCircles = async () => {
    setIsLoading(true);
    try {
      // Fetch session / identity
      const sessRes = await fetch('/api/auth/session');
      const sessData = await sessRes.json();
      const name = sessData.name || localStorage.getItem('yaadein_user_name') || '';
      setUserName(name);

      // Fetch user's circles from MongoDB API
      const res = await fetch('/api/circles/my');
      const data = await res.json();

      if (data.success && Array.isArray(data.circles)) {
        setMyCircles(data.circles);
      } else if (name) {
        // Fallback to user-scoped localStorage
        const userStored = localStorage.getItem(`yaadein_my_circles_${name.toLowerCase()}`);
        if (userStored) {
          setMyCircles(JSON.parse(userStored));
        } else {
          setMyCircles([]);
        }
      } else {
        setMyCircles([]);
      }
    } catch (e) {
      console.error(e);
      setMyCircles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserCircles();
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 mb-16 relative z-20">
      {/* Profile Bar */}
      <UserIdentityBar onUserChange={() => fetchUserCircles()} />

      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-navy-800/80 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl mb-12"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-white">Your Circles</h2>
                <p className="text-xs text-white/50">
                  {userName ? `Joined memory groups for ${userName}` : 'Your memory circles'}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href="/circles/join"
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white flex items-center gap-1.5 transition-all"
              >
                <Key className="w-3.5 h-3.5 text-amber-400" /> Join Code
              </Link>
              <Link
                href="/circles/new"
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-navy-900 font-bold text-xs flex items-center gap-1.5 shadow-md hover:scale-105 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> New Circle
              </Link>
            </div>
          </div>

          {myCircles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {myCircles.map((circle) => (
                <Link
                  key={circle.code}
                  href={`/circles/${circle.code}`}
                  className="group relative bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/40 rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl">{circle.emoji || '💖'}</span>
                      <span className="text-[10px] font-mono uppercase bg-white/10 px-2 py-0.5 rounded text-white/60 group-hover:text-amber-300">
                        Code: {circle.code}
                      </span>
                    </div>
                    <h3 className="font-display text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                      {circle.name}
                    </h3>
                  </div>

                  <div className="mt-6 flex items-center justify-between pt-3 border-t border-white/5 text-xs text-white/50">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-amber-400" /> {circle.membersCount || 1} members
                    </span>
                    <span className="text-amber-400 font-medium group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Open <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-white/10 rounded-2xl p-6 bg-white/[0.02]">
              <div className="text-4xl mb-2">✨</div>
              <h3 className="text-lg font-bold text-white mb-1">No circles joined yet</h3>
              <p className="text-xs text-gray-400 mb-4 max-w-sm mx-auto">
                {userName ? `${userName}, you aren't part of any circles yet.` : 'You haven\'t joined any circles yet.'} Create a new circle or enter an invite code to join a friend's group!
              </p>
              <div className="flex justify-center gap-3">
                <Link href="/circles/new" className="btn-primary py-2 px-4 text-xs font-bold">
                  Create Circle
                </Link>
                <Link href="/circles/join" className="btn-secondary py-2 px-4 text-xs">
                  Join with Code
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
