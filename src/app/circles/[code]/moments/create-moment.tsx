'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Type, Image as ImageIcon, X, Loader2, Upload, Trash2 } from 'lucide-react';

type CreateMomentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  circleCode: string;
  onSuccess: (moment: any) => void;
};

export default function CreateMomentModal({ isOpen, onClose, circleCode, onSuccess }: CreateMomentModalProps) {
  const [type, setType] = useState<'text' | 'photo'>('text');
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [tags, setTags] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('yaadein_user_name');
      if (stored) {
        setAuthorName(stored);
      } else {
        fetch('/api/auth/session')
          .then(res => res.json())
          .then(data => {
            if (data.name) setAuthorName(data.name);
          })
          .catch(() => {});
      }
    }
  }, [isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    const finalAuthor = authorName.trim() || 'Friend';

    try {
      const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
      const res = await fetch(`/api/circles/${circleCode}/moments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          content,
          mediaUrl: type === 'photo' ? mediaUrl : undefined,
          tags: tagArray,
          creatorName: finalAuthor,
        })
      });

      if (res.ok) {
        const newMoment = await res.json();
        onSuccess(newMoment);
        setContent('');
        setMediaUrl('');
        setTags('');
        onClose();
      }
    } catch (error) {
      console.error(error);
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
            className="fixed inset-0 bg-navy-900/80 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-navy-800 rounded-t-3xl border-t border-white/10 shadow-2xl overflow-hidden md:max-w-xl md:mx-auto md:top-1/2 md:bottom-auto md:-translate-y-1/2 md:rounded-3xl md:border"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-display text-white font-bold">Share a Memory</h2>
                <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-2 p-1 bg-white/5 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => setType('text')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${type === 'text' ? 'bg-amber-500 text-navy-900 shadow-md' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                >
                  <Type className="w-4 h-4" /> Text
                </button>
                <button
                  type="button"
                  onClick={() => setType('photo')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${type === 'photo' ? 'bg-amber-500 text-navy-900 shadow-md' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                >
                  <ImageIcon className="w-4 h-4" /> Photo / Video
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {type === 'photo' && (
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-2">Upload Photo / Video</label>

                    {mediaUrl ? (
                      <div className="relative rounded-2xl overflow-hidden border border-white/10 group max-h-48 bg-black/40">
                        {mediaUrl.startsWith('data:video') ? (
                          <video src={mediaUrl} controls className="w-full max-h-48 object-cover" />
                        ) : (
                          <img src={mediaUrl} alt="Preview" className="w-full max-h-48 object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => setMediaUrl('')}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-500 text-white shadow-lg hover:scale-110 transition-transform"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative border-2 border-dashed border-white/20 hover:border-amber-400/50 rounded-2xl p-6 text-center transition-all cursor-pointer bg-white/5 hover:bg-white/10 group">
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleFileUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <Upload className="w-8 h-8 text-amber-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                        <p className="text-xs text-gray-300 font-semibold mb-1">Click or drag & drop to upload photo/video</p>
                        <p className="text-[10px] text-gray-500">Supports PNG, JPG, WEBP, MP4</p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1">
                    {type === 'photo' ? 'Caption' : 'What\'s on your mind?'}
                  </label>
                  <textarea
                    placeholder={type === 'photo' ? 'Add a caption...' : 'Write something memorable...'}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1">Tags (optional)</label>
                  <input
                    type="text"
                    placeholder="funny, trip, college (comma separated)"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !content.trim() || (type === 'photo' && !mediaUrl)}
                  className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-navy-900 font-bold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Share Memory ✨'}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
