'use client';

import { useState, useEffect } from 'react';
import { User, Edit2, Check, Users } from 'lucide-react';

interface UserIdentityBarProps {
  members?: Array<{ userId: string; name: string }>;
  onUserChange?: (name: string) => void;
  compact?: boolean;
}

export default function UserIdentityBar({ members = [], onUserChange, compact = false }: UserIdentityBarProps) {
  const [userName, setUserName] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState('');

  useEffect(() => {
    // Read from localStorage or fetch session
    const stored = localStorage.getItem('yaadein_user_name');
    if (stored) {
      setUserName(stored);
      setTempName(stored);
    } else {
      fetch('/api/auth/session')
        .then(res => res.json())
        .then(data => {
          if (data.name) {
            setUserName(data.name);
            setTempName(data.name);
            localStorage.setItem('yaadein_user_name', data.name);
          }
        })
        .catch(() => {});
    }
  }, []);

  const saveIdentity = async (nameToSave: string) => {
    const finalName = nameToSave.trim() || 'Friend';
    setUserName(finalName);
    localStorage.setItem('yaadein_user_name', finalName);
    setIsEditing(false);

    try {
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: finalName }),
      });
      if (onUserChange) onUserChange(finalName);
      window.location.reload(); // Refresh to update session across components
    } catch (err) {
      console.error(err);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/15 text-xs text-white/90 backdrop-blur-md">
        <User className="w-3.5 h-3.5 text-amber-400" />
        <span>Posting as: <strong className="text-amber-300 font-semibold">{userName || 'Loading...'}</strong></span>
        <button 
          type="button" 
          onClick={() => setIsEditing(!isEditing)}
          className="ml-1 text-amber-400 hover:text-amber-300 underline text-[11px]"
        >
          Change
        </button>

        {isEditing && (
          <div className="absolute right-4 top-12 z-50 bg-navy-800 border border-white/20 p-4 rounded-xl shadow-2xl w-64 text-left">
            <p className="text-xs text-gray-300 mb-2 font-medium">Switch Active Profile / Name:</p>
            <div className="flex gap-2 mb-3">
              <input 
                type="text" 
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-white/5 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
              <button 
                onClick={() => saveIdentity(tempName)}
                className="bg-amber-500 hover:bg-amber-400 text-navy-900 font-bold px-3 py-1.5 rounded-lg text-xs"
              >
                Save
              </button>
            </div>
            {members.length > 0 && (
              <div className="border-t border-white/10 pt-2">
                <p className="text-[10px] text-gray-400 mb-1">Pick existing member:</p>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {members.map(m => (
                    <button
                      key={m.userId}
                      onClick={() => saveIdentity(m.name)}
                      className={`text-[11px] px-2 py-1 rounded-md border ${m.name === userName ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-navy-900 font-bold text-lg shadow-md">
          {(userName || 'F').charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Active User Profile</div>
          <div className="text-lg font-bold text-white flex items-center gap-2">
            <span>{userName || 'Friend'}</span>
            <button onClick={() => setIsEditing(!isEditing)} className="text-amber-400 hover:text-amber-300 p-1">
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {isEditing ? (
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            placeholder="Your Name (e.g. Rahul)"
            className="bg-white/10 border border-amber-500/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            onClick={() => saveIdentity(tempName)}
            className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1"
          >
            <Check className="w-4 h-4" /> Save
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {members.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-xs">
              <span className="text-xs text-gray-400 flex items-center gap-1"><Users className="w-3 h-3" /> Switch:</span>
              {members.map(m => (
                <button
                  key={m.userId}
                  onClick={() => saveIdentity(m.name)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${m.name === userName ? 'bg-amber-500 text-navy-900 font-bold border-amber-400 shadow-sm' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
