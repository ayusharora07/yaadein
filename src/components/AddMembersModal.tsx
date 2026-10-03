'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, X, Copy, Check, Mail, Sparkles, Share2, Loader2 } from 'lucide-react';

interface AddMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  circleCode: string;
  circleName: string;
  members: Array<{ userId: string; name: string; email?: string }>;
  onMemberAdded?: () => void;
}

export default function AddMembersModal({
  isOpen,
  onClose,
  circleCode,
  circleName,
  members,
  onMemberAdded,
}: AddMembersModalProps) {
  const [friendEmail, setFriendEmail] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const inviteLink = typeof window !== 'undefined' ? `${window.location.origin}/circles/join?code=${circleCode}` : '';

  const copyCode = () => {
    navigator.clipboard.writeText(circleCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendEmail.trim()) return;

    setIsSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/circles/${circleCode}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: friendEmail.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to add friend');
        return;
      }

      setSuccessMsg(`Added ${data.addedUser} to ${circleName}!`);
      setFriendEmail('');
      if (onMemberAdded) onMemberAdded();
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      setError('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-navy-900/80 backdrop-blur-md z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-navy-800 border border-white/10 rounded-3xl p-6 md:p-8 max-w-lg mx-auto shadow-2xl overflow-hidden"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-white">Add Friends to {circleName}</h2>
                  <p className="text-xs text-gray-400">Invite friends using their registered email</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Share & Invite Section */}
            <div className="space-y-3 mb-6 bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Circle Invite Code</span>
                  <div className="text-2xl font-mono font-bold text-amber-300 tracking-widest">{circleCode}</div>
                </div>
                <button
                  onClick={copyCode}
                  className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedCode ? 'Copied!' : 'Copy Code'}
                </button>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                <span className="text-xs text-gray-300 truncate flex-1">{inviteLink}</span>
                <button
                  onClick={copyLink}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Share2 className="w-3.5 h-3.5" />}
                  {copiedLink ? 'Link Copied' : 'Share Link'}
                </button>
              </div>
            </div>

            {/* Direct Add Friend Form */}
            <form onSubmit={handleAddMember} className="space-y-3 mb-6">
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" /> Add Friend by Unique Email
              </div>

              {error && <div className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">{error}</div>}
              {successMsg && <div className="text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">{successMsg}</div>}

              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={friendEmail}
                  onChange={(e) => setFriendEmail(e.target.value)}
                  placeholder="Friend's registered email (e.g. friend@gmail.com)"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !friendEmail.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-navy-900 font-bold text-xs shadow-md hover:scale-[1.01] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : '+ Add Friend Account to Circle'}
              </button>
            </form>

            {/* Current Members List */}
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Current Members ({members.length})
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {members.map(m => (
                  <div key={m.userId} className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-xs text-white">
                    <div className="w-4 h-4 rounded-full bg-amber-500 text-navy-900 font-bold text-[10px] flex items-center justify-center">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <span>{m.name}</span>
                    {m.email && <span className="text-[10px] text-gray-500">({m.email})</span>}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
