'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, UserPlus, LogOut, User, Sparkles } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          setUser(data.user);
          localStorage.setItem('yaadein_user_name', data.user.name);
        } else {
          setUser(null);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    localStorage.removeItem('yaadein_user_name');
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="w-full bg-navy-900/60 border-b border-white/10 backdrop-blur-xl sticky top-0 z-40 py-3 px-4 sm:px-8 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight">
        <span className="text-gradient-amber">yaadein</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-sans hidden sm:inline-block">
          यादें
        </span>
      </Link>

      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-navy-900 font-bold text-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-white font-semibold">{user.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-3.5 py-1.5 rounded-xl border border-white/10 hover:border-amber-500/40 text-xs text-white/90 hover:text-amber-300 transition-all flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" /> Log In
            </Link>
            <Link
              href="/signup"
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-navy-900 font-bold text-xs shadow-md hover:scale-105 transition-all flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" /> Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
