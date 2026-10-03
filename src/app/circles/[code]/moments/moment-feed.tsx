'use client';

import { useState } from 'react';
import { Search, Clock, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import CreateMomentModal from './create-moment';

type Moment = {
  _id: string;
  circleId: string;
  createdBy: string;
  creatorName: string;
  type: 'text' | 'photo' | 'voice';
  content: string;
  mediaUrl?: string;
  tags: string[];
  createdAt: string;
};

export default function MomentFeedClient({ initialMoments, circleCode }: { initialMoments: Moment[], circleCode: string }) {
  const [moments, setMoments] = useState<Moment[]>(initialMoments);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setMoments(initialMoments);
      return;
    }
    
    setIsSearching(true);
    try {
      const res = await fetch(`/api/circles/${circleCode}/moments/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      if (res.ok) {
        const data = await res.json();
        setMoments(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleMomentCreated = (newMoment: Moment) => {
    setMoments(prev => [newMoment, ...prev]);
  };

  return (
    <>
      <form onSubmit={handleSearch} className="relative mb-8 group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className={`w-5 h-5 ${isSearching ? 'text-amber-400 animate-pulse' : 'text-white/40'} group-focus-within:text-amber-400 transition-colors`} />
        </div>
        <input
          type="text"
          placeholder="Search memories, tags..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (e.target.value === '') setMoments(initialMoments);
          }}
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50 backdrop-blur-md transition-all"
        />
      </form>

      {moments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center opacity-80">
          <div className="text-6xl mb-4">✨</div>
          <h3 className="text-xl font-display text-white mb-2">No moments found</h3>
          <p className="text-white/50 max-w-md">
            {searchQuery ? 'Try adjusting your search terms.' : 'Be the first to share a memory with the circle!'}
          </p>
        </div>
      ) : (
        <motion.div 
          className="columns-1 md:columns-2 gap-6 space-y-6 md:space-y-0"
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
        >
          <AnimatePresence>
            {moments.map((moment) => (
              <motion.div
                key={moment._id}
                layout
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 }
                }}
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/10 hover:border-white/20 transition-all duration-300 break-inside-avoid md:mb-6"
              >
                {moment.type === 'photo' && moment.mediaUrl && (
                  <div className="relative w-full">
                    <img 
                      src={moment.mediaUrl} 
                      alt="Moment"
                      className="w-full h-auto object-cover max-h-[400px]"
                    />
                  </div>
                )}
                <div className="p-5">
                  <p className="text-white/90 text-lg mb-4 whitespace-pre-wrap">{moment.content}</p>
                  
                  {moment.tags && moment.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {moment.tags.map(tag => (
                        <span key={tag} className="text-xs px-2 py-1 bg-amber-500/20 text-amber-300 rounded-md border border-amber-500/20">
                          #{tag.replace(/^#/, '')}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-white/40 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold">
                        {moment.creatorName.charAt(0).toUpperCase()}
                      </div>
                      <span>{moment.creatorName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDistanceToNow(new Date(moment.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 shadow-lg shadow-amber-500/30 flex items-center justify-center text-navy-900 hover:scale-110 active:scale-95 transition-transform z-20"
      >
        <Plus className="w-8 h-8" />
      </button>

      <CreateMomentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        circleCode={circleCode}
        onSuccess={handleMomentCreated}
      />
    </>
  );
}
