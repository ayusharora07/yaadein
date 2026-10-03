'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AddMembersModal from '@/components/AddMembersModal';
import { UserPlus, Copy, Check, Users, LogOut, ArrowLeft, Loader2, X, MessageSquare } from 'lucide-react';

export default function DashboardClient({ circle }: { circle: any }) {
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(circle.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeaveCircle = async () => {
    if (!confirm(`Are you sure you want to leave ${circle.name}?`)) return;

    setIsLeaving(true);
    try {
      const res = await fetch(`/api/circles/${circle.code}/leave`, {
        method: 'POST',
      });

      if (res.ok) {
        router.push('/feed');
        router.refresh();
      } else {
        alert('Failed to leave circle');
      }
    } catch {
      alert('An error occurred');
    } finally {
      setIsLeaving(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-navy-900 text-white p-4 md:p-6 relative overflow-hidden font-sans">
      {/* Ambient Effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-lg mx-auto z-10 relative">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center mb-8 pt-2"
        >
          <div className="flex items-center justify-between w-full mb-6">
            <Link href="/feed" className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Feed
            </Link>
            <div className="font-display font-bold text-lg text-white/40">yaadein</div>
          </div>

          <div className="text-5xl mb-3">{circle.emoji || '💖'}</div>
          <h1 className="font-display text-4xl font-bold mb-2 text-white">{circle.name}</h1>
          {circle.description && <p className="text-sm text-gray-400 max-w-sm mb-2">{circle.description}</p>}

          {/* Member avatars & actions bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            <button
              onClick={() => setIsParticipantsModalOpen(true)}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl text-xs text-gray-300 transition-all"
              title="View all participants"
            >
              <div className="flex -space-x-2 items-center">
                {circle.members.slice(0, 4).map((member: any) => (
                  <div
                    key={member.userId || member.name}
                    className="w-6 h-6 rounded-full border border-navy-900 flex items-center justify-center font-bold text-[10px] bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md text-white"
                  >
                    {member.name?.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
              <span className="font-semibold text-white">{circle.members.length} Members</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-navy-900 font-bold text-xs shadow-md hover:scale-105 transition-all flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add Friends
            </button>

            <button
              onClick={handleLeaveCircle}
              disabled={isLeaving}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-semibold transition-all flex items-center gap-1.5"
              title="Leave this circle"
            >
              {isLeaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
              Leave
            </button>
          </div>
        </motion.header>

        {/* Feature Navigation Grid (2x2 Mobile Friendly) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-4 mb-8"
        >
          <Link href={`/circles/${circle.code}/chat`}>
            <motion.div variants={itemVariants} className="glass-card glass-card-hover p-5 flex flex-col justify-between group overflow-hidden relative min-h-[140px]">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div>
                <div className="text-3xl mb-2">💬</div>
                <h2 className="font-display text-lg font-bold text-emerald-300">Group Chat</h2>
                <p className="text-gray-400 text-[11px] leading-tight">Chat live with members.</p>
              </div>
              <div className="mt-3 text-emerald-400 font-semibold text-xs flex items-center">
                Open Chat <span className="ml-1">→</span>
              </div>
            </motion.div>
          </Link>

          <Link href={`/circles/${circle.code}/moments`}>
            <motion.div variants={itemVariants} className="glass-card glass-card-hover p-5 flex flex-col justify-between group overflow-hidden relative min-h-[140px]">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div>
                <div className="text-3xl mb-2">📸</div>
                <h2 className="font-display text-lg font-bold text-amber-300">Moments</h2>
                <p className="text-gray-400 text-[11px] leading-tight">Share photos & videos.</p>
              </div>
              <div className="mt-3 text-amber-400 font-semibold text-xs flex items-center">
                Explore <span className="ml-1">→</span>
              </div>
            </motion.div>
          </Link>

          <Link href={`/circles/${circle.code}/slambook`}>
            <motion.div variants={itemVariants} className="glass-card glass-card-hover p-5 flex flex-col justify-between group overflow-hidden relative min-h-[140px]">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div>
                <div className="text-3xl mb-2">📖</div>
                <h2 className="font-display text-lg font-bold text-rose-300">Slam Book</h2>
                <p className="text-gray-400 text-[11px] leading-tight">Private & public Q&A.</p>
              </div>
              <div className="mt-3 text-rose-400 font-semibold text-xs flex items-center">
                Open Book <span className="ml-1">→</span>
              </div>
            </motion.div>
          </Link>

          <Link href={`/circles/${circle.code}/capsules`}>
            <motion.div variants={itemVariants} className="glass-card glass-card-hover p-5 flex flex-col justify-between group overflow-hidden relative min-h-[140px]">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div>
                <div className="text-3xl mb-2">💊</div>
                <h2 className="font-display text-lg font-bold text-violet-300">Time Capsule</h2>
                <p className="text-gray-400 text-[11px] leading-tight">Lock future memories.</p>
              </div>
              <div className="mt-3 text-violet-400 font-semibold text-xs flex items-center">
                View <span className="ml-1">→</span>
              </div>
            </motion.div>
          </Link>
        </motion.div>

        {/* Invite code block */}
        <motion.div
          variants={itemVariants}
          className="text-center bg-black/30 p-5 rounded-2xl border border-white/5 backdrop-blur-sm max-w-xs mx-auto"
        >
          <p className="text-xs text-gray-400 mb-1.5 font-medium">Invite Code</p>
          <div className="flex items-center justify-center gap-3">
            <span className="font-display text-2xl font-bold tracking-widest text-amber-300">{circle.code}</span>
            <button onClick={copyCode} className="btn-secondary py-1 px-3 text-xs flex items-center gap-1">
              {copied ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Participants Modal */}
      <AnimatePresence>
        {isParticipantsModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsParticipantsModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto z-50 bg-navy-800 border border-white/10 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <h3 className="font-display text-base font-bold text-white">Participants ({circle.members.length})</h3>
                </div>
                <button onClick={() => setIsParticipantsModalOpen(false)} className="p-1 rounded-full hover:bg-white/10 text-gray-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {circle.members.map((m: any) => (
                  <div key={m.userId || m.name} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                        {m.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">{m.name}</div>
                        {m.email && <div className="text-[10px] text-gray-400">{m.email}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Members Modal */}
      <AddMembersModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        circleCode={circle.code}
        circleName={circle.name}
        members={circle.members}
      />
    </div>
  );
}
