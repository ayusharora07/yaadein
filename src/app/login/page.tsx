'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      localStorage.setItem('yaadein_user_name', data.user.name);
      localStorage.setItem('yaadein_user_email', data.user.email);
      router.push('/feed');
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 text-white flex">
      {/* Left side — branding */}
      <div className="hidden lg:flex flex-col justify-center items-start p-16 w-[45%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-violet-500/10" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/20 rounded-full blur-[100px]" />

        <div className="relative z-10">
          <h1 className="font-display text-7xl font-bold text-gradient-amber mb-2">yaadein</h1>
          <p className="text-3xl text-white/40 font-display mb-8">यादें</p>
          <p className="text-xl text-white/60 max-w-sm leading-relaxed">
            A place for the memories that matter most — with your loved ones, family & friends.
          </p>

          <div className="mt-12 space-y-4">
            {['Share Moments that last forever', 'Fill Slam Books together', 'Seal Time Capsules together', 'Powered by open-source AI'].map((feat, i) => (
              <div key={i} className="flex items-center gap-3 text-white/50">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-sm">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side — login form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-16 bg-navy-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden text-center mb-10">
            <span className="font-display text-4xl font-bold text-gradient-amber">yaadein</span>
          </div>

          <h2 className="text-3xl font-display font-bold text-white mb-2">Welcome back</h2>
          <p className="text-gray-400 mb-8">Log in to see your memories</p>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-navy-900 font-bold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-base mt-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Log In <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link href="/signup" className="text-amber-400 hover:text-amber-300 font-semibold">
              Sign up free
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
