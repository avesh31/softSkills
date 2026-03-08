"use client";

import { useState, useEffect } from 'react';
import ChatRoom from '@/components/ChatRoom';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function ChatPage() {
  const [activeHubId, setActiveHubId] = useState<string | null>(null);
  const [hubs, setHubs] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchHubs = async () => {
      try {
        const res = await fetch('/api/hubs');
        const data = await res.json();
        if (data.hubs) setHubs(data.hubs);
      } catch (e) { console.error(e); }
    };
    fetchHubs();
  }, []);

  if (!user) return (
    <div className="container py-20 flex items-center justify-center">
      <div className="glass-panel p-10 max-w-sm text-center border-white/10 shadow-2xl">
        <h2 className="text-2xl font-bold mb-4">Community Lounge</h2>
        <p className="text-text-secondary mb-8 leading-relaxed">Please log in to participate in the real-time community chat.</p>
        <Link href="/login" className="btn btn-primary w-full">Sign In</Link>
      </div>
    </div>
  );

  return (
    <div className="w-full flex" style={{ height: 'calc(100vh - 64px)', overflow: 'hidden', background: '#0a0a0c' }}>
      
      {/* 25% Sidebar - Locked Layout */}
      <aside className="h-full border-r border-white/5 bg-[#111218] flex flex-col" style={{ width: '25%', minWidth: '280px', flexShrink: 0 }}>
        <div className="p-6 border-b border-white/5">
          <h2 className="text-sm font-black text-white/30 uppercase tracking-[0.3em] mb-4">Navigation</h2>
          <div className="space-y-2">
            <button 
              onClick={() => setActiveHubId(null)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${!activeHubId ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/20' : 'text-text-secondary hover:bg-white/5 hover:text-white'}`}
            >
              <span className="text-base">🌐</span>
              General Lounge
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
          <div>
            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-4">Active Hubs</h3>
            <div className="space-y-1">
              {hubs.map(hub => (
                <button 
                  key={hub.id}
                  onClick={() => setActiveHubId(hub.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all truncate border ${activeHubId === hub.id ? 'bg-accent-primary border-accent-primary text-white shadow-md shadow-accent-primary/10' : 'bg-transparent border-transparent text-text-secondary hover:bg-white/5 hover:text-white'}`}
                >
                  <span className="opacity-40 font-mono text-base">#</span>
                  {hub.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* User Card at bottom of sidebar */}
        <div className="p-4 bg-black/20 border-t border-white/5 mt-auto">
          <div className="flex items-center gap-3 p-3 rounded-2xl border border-white/5 bg-white/[0.02]">
            <div className="w-10 h-10 rounded-xl bg-accent-primary/20 flex items-center justify-center font-bold text-accent-primary border border-accent-primary/20">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.username}</p>
              <p className="text-[9px] text-accent-success font-black uppercase tracking-widest mt-0.5">Verified Student</p>
            </div>
          </div>
        </div>
      </aside>

      {/* 75% Main Area - Form App Style */}
      <main className="h-full flex flex-col relative" style={{ width: '75%', flexGrow: 1 }}>
        <ChatRoom hubId={activeHubId || undefined} />
      </main>

    </div>
  );
}
