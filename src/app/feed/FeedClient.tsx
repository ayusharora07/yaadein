'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Users, Plus, LogOut, Clock, Image as ImageIcon,
  ExternalLink, ChevronRight, Loader2, X, Type, Upload, Trash2, Mail, MessageCircle, Send
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Post {
  _id: string;
  circleId: string;
  circleName: string;
  circleCode: string;
  circleEmoji: string;
  createdBy: string;
  creatorName: string;
  type: 'text' | 'photo' | 'voice';
  content: string;
  mediaUrl?: string;
  tags: string[];
  createdAt: string;
}

interface Circle {
  code: string;
  name: string;
  emoji: string;
  membersCount: number;
}

interface Comment {
  _id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

interface FeedClientProps {
  userName: string;
  initialPosts: Post[];
  initialCircles: Circle[];
}

function PostCard({ post }: { post: Post }) {
  const initial = post.creatorName?.charAt(0)?.toUpperCase() || '?';
  const colors = ['from-amber-400 to-amber-600', 'from-violet-400 to-violet-600', 'from-rose-400 to-rose-600', 'from-indigo-400 to-indigo-600', 'from-emerald-400 to-emerald-600'];
  const colorIndex = post.creatorName?.charCodeAt(0) % colors.length || 0;

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/moments/${post._id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch {
      // Ignored
    } finally {
      setLoadingComments(false);
    }
  };

  const toggleComments = () => {
    if (!showComments && comments.length === 0) {
      fetchComments();
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/moments/${post._id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments(prev => [...prev, data.comment]);
        setCommentText('');
      }
    } catch {
      // Error
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300 hover:shadow-xl hover:shadow-black/20"
    >
      {/* Post Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0`}>
            {initial}
          </div>
          <div>
            <div className="font-semibold text-white text-sm leading-tight">{post.creatorName}</div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </div>
          </div>
        </div>

        {/* Circle chip */}
        <Link
          href={`/circles/${post.circleCode}`}
          className="flex items-center gap-1.5 bg-white/5 hover:bg-amber-500/15 border border-white/10 hover:border-amber-500/30 rounded-full px-3 py-1 text-xs text-gray-300 hover:text-amber-300 transition-all"
        >
          <span>{post.circleEmoji}</span>
          <span className="font-medium max-w-[80px] truncate">{post.circleName}</span>
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Photo / Video */}
      {post.type === 'photo' && post.mediaUrl && (
        <div className="w-full bg-black/20">
          {post.mediaUrl.startsWith('data:video') ? (
            <video src={post.mediaUrl} controls className="w-full max-h-[400px] object-cover" />
          ) : (
            <img
              src={post.mediaUrl}
              alt="Memory"
              className="w-full object-cover max-h-[400px]"
              loading="lazy"
            />
          )}
        </div>
      )}

      {/* Content */}
      <div className="px-5 py-4">
        <p className="text-white/90 text-[15px] leading-relaxed whitespace-pre-wrap">{post.content}</p>

        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {post.tags.map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 bg-amber-500/15 text-amber-300 rounded-md border border-amber-500/20">
                #{tag.replace(/^#/, '')}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-5 pb-3 border-t border-white/5 pt-3 flex items-center justify-between">
        <button
          onClick={toggleComments}
          className="text-xs text-gray-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors font-medium"
        >
          <MessageCircle className="w-4 h-4 text-amber-400" />
          <span>{comments.length > 0 ? `${comments.length} Comments` : 'Comment / Reply'}</span>
        </button>

        <Link
          href={`/circles/${post.circleCode}`}
          className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition-colors"
        >
          View in circle <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Comments Drawer */}
      {showComments && (
        <div className="bg-black/30 border-t border-white/5 p-4 space-y-3">
          {loadingComments ? (
            <div className="text-center py-2 text-xs text-gray-500 flex justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-xs text-gray-500 italic text-center py-1">No comments yet. Be the first to reply!</div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {comments.map(c => (
                <div key={c._id} className="bg-white/5 rounded-xl p-2.5 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-amber-300">{c.authorName}</span>
                    <span className="text-[10px] text-gray-500">
                      {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-white/90 leading-relaxed">{c.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add Comment Input */}
          <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={submittingComment || !commentText.trim()}
              className="px-3 py-2 bg-amber-500 text-navy-900 font-bold rounded-xl text-xs disabled:opacity-50 flex items-center gap-1 transition-all shrink-0"
            >
              {submittingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </form>
        </div>
      )}
    </motion.article>
  );
}

function CreatePostModal({
  isOpen,
  onClose,
  circles,
  currentUserName,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  circles: Circle[];
  currentUserName: string;
  onSuccess: (post: Post) => void;
}) {
  const [selectedCircle, setSelectedCircle] = useState(circles[0]?.code || '');
  const [type, setType] = useState<'text' | 'photo'>('text');
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (circles.length > 0 && !selectedCircle) {
      setSelectedCircle(circles[0].code);
    }
  }, [circles, selectedCircle]);

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
    if (!selectedCircle || !content.trim()) return;

    setIsSubmitting(true);
    setError('');
    try {
      const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
      const res = await fetch(`/api/circles/${selectedCircle}/moments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          content,
          mediaUrl: type === 'photo' ? mediaUrl : undefined,
          tags: tagArray,
          creatorName: currentUserName,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Failed to post');
        return;
      }

      const moment = await res.json();
      const circle = circles.find(c => c.code === selectedCircle);
      onSuccess({
        ...moment,
        _id: moment._id,
        circleName: circle?.name || '',
        circleCode: selectedCircle,
        circleEmoji: circle?.emoji || '✨',
        createdAt: moment.createdAt || new Date().toISOString(),
      });
      setContent('');
      setMediaUrl('');
      setTags('');
      onClose();
    } catch {
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            className="fixed inset-x-4 bottom-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md z-50 bg-navy-800 border border-white/15 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-display font-bold text-white">Share a Memory</h2>
                <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Circle selector */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Post to Circle</label>
                {circles.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">You haven't joined any circles yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {circles.map(c => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => setSelectedCircle(c.code)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 ${selectedCircle === c.code ? 'bg-amber-500 border-amber-400 text-navy-900 font-bold' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}`}
                      >
                        {c.emoji} {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Type selector */}
              <div className="flex gap-2 p-1 bg-white/5 rounded-xl mb-4">
                <button type="button" onClick={() => setType('text')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${type === 'text' ? 'bg-amber-500 text-navy-900 font-bold' : 'text-white/50 hover:text-white'}`}>
                  <Type className="w-3.5 h-3.5" /> Text
                </button>
                <button type="button" onClick={() => setType('photo')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${type === 'photo' ? 'bg-amber-500 text-navy-900 font-bold' : 'text-white/50 hover:text-white'}`}>
                  <ImageIcon className="w-3.5 h-3.5" /> Photo / Video
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {type === 'photo' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Upload Photo or Video</label>
                    {mediaUrl ? (
                      <div className="relative rounded-2xl overflow-hidden border border-white/10 max-h-48 bg-black/40">
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
                      <div className="relative border-2 border-dashed border-white/20 hover:border-amber-400/50 rounded-2xl p-5 text-center transition-all cursor-pointer bg-white/5 hover:bg-white/10 group">
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleFileUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <Upload className="w-7 h-7 text-amber-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                        <p className="text-xs text-gray-300 font-semibold mb-0.5">Click or drag & drop photo/video</p>
                        <p className="text-[10px] text-gray-500">JPG, PNG, WEBP, MP4</p>
                      </div>
                    )}
                  </div>
                )}
                <textarea
                  placeholder={type === 'photo' ? 'Add a caption...' : 'What\'s on your mind?'}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  required
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
                <input
                  type="text"
                  placeholder="Tags (comma separated)"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {error && <p className="text-xs text-rose-400">{error}</p>}
                <button
                  type="submit"
                  disabled={isSubmitting || !content.trim() || !selectedCircle || (type === 'photo' && !mediaUrl)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-navy-900 font-bold text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Share Memory ✨'}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function FeedClient({ userName, initialPosts, initialCircles }: FeedClientProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [circles, setCircles] = useState<Circle[]>(initialCircles);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'circles'>('feed');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const email = localStorage.getItem('yaadein_user_email') || '';
    setUserEmail(email);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.clear();
    router.push('/login');
  };

  const handlePostCreated = (post: Post) => {
    setPosts(prev => [post, ...prev]);
  };

  return (
    <div className="min-h-screen bg-navy-900 text-white font-sans">
      {/* Mobile Top App Header */}
      <header className="sticky top-0 z-40 bg-navy-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/feed" className="font-display text-2xl font-bold text-gradient-amber">yaadein</Link>

          <nav className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${activeTab === 'feed' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
            >
              <Home className="w-3.5 h-3.5" /> Feed
            </button>
            <button
              onClick={() => setActiveTab('circles')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${activeTab === 'circles' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
            >
              <Users className="w-3.5 h-3.5" /> Circles
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-navy-900 font-bold text-xs shadow-md hover:scale-105 transition-transform"
              title="View Profile"
            >
              {userName.charAt(0).toUpperCase()}
            </button>
            <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile App Container */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {activeTab === 'feed' ? (
          <>
            {/* Feed Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-display font-bold text-white">Your Feed</h1>
                <p className="text-xs text-gray-500">Memories from all your circles</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                disabled={circles.length === 0}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-navy-900 font-bold text-xs shadow-md hover:scale-105 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" /> New Memory
              </button>
            </div>

            {posts.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">✨</div>
                <h3 className="text-xl font-bold text-white mb-2">No memories yet</h3>
                <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
                  {circles.length === 0
                    ? "You haven't joined any circles. Create or join one to start sharing memories!"
                    : "Your circles are empty. Be the first to post a memory!"}
                </p>
                <div className="flex justify-center gap-3">
                  <Link href="/circles/new" className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-navy-900 font-bold text-xs">
                    Create a Circle
                  </Link>
                  <Link href="/circles/join" className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-xs text-gray-300">
                    Join with Code
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {posts.map(post => <PostCard key={post._id} post={post} />)}
              </div>
            )}
          </>
        ) : (
          /* Circles Tab */
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-display font-bold text-white">My Circles</h1>
                <p className="text-xs text-gray-500">{circles.length} memory group{circles.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex gap-2">
                <Link href="/circles/join" className="px-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs text-gray-300 transition-all">
                  Join Code
                </Link>
                <Link href="/circles/new" className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-navy-900 font-bold text-xs transition-all">
                  + New
                </Link>
              </div>
            </div>

            {circles.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
                <div className="text-4xl mb-3">👥</div>
                <h3 className="text-lg font-bold text-white mb-2">No circles yet</h3>
                <p className="text-sm text-gray-400 mb-4">Create a new circle or join an existing one!</p>
                <div className="flex justify-center gap-3">
                  <Link href="/circles/new" className="btn-primary py-2 px-4 text-xs">Create Circle</Link>
                  <Link href="/circles/join" className="btn-secondary py-2 px-4 text-xs">Join with Code</Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {circles.map(circle => (
                  <Link
                    key={circle.code}
                    href={`/circles/${circle.code}`}
                    className="group bg-white/[0.04] border border-white/10 hover:border-amber-500/40 hover:bg-amber-500/5 rounded-2xl p-5 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl">{circle.emoji}</span>
                      <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded">{circle.code}</span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-white group-hover:text-amber-300 transition-colors">{circle.name}</h3>
                    <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-amber-400" /> {circle.membersCount} members</span>
                      <span className="text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">Open <ChevronRight className="w-3.5 h-3.5" /></span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* User Profile Modal */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto z-50 bg-navy-800 border border-white/15 rounded-3xl p-6 shadow-2xl text-center"
            >
              <div className="flex justify-end mb-2">
                <button onClick={() => setIsProfileModalOpen(false)} className="p-1 rounded-full hover:bg-white/10 text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-navy-900 font-bold text-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                {userName.charAt(0).toUpperCase()}
              </div>

              <h3 className="font-display text-2xl font-bold text-white mb-1">{userName}</h3>
              {userEmail && (
                <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5 mb-4">
                  <Mail className="w-3.5 h-3.5" /> {userEmail}
                </p>
              )}

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 flex justify-around text-center">
                <div>
                  <div className="text-xl font-bold text-amber-300">{circles.length}</div>
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">Joined Circles</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-amber-300">{posts.length}</div>
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">Feed Posts</div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <LogOut className="w-4 h-4" /> Log Out of Account
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        circles={circles}
        currentUserName={userName}
        onSuccess={handlePostCreated}
      />
    </div>
  );
}
