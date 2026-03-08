"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => {
        if (data.leaderboard) setLeaderboard(data.leaderboard);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="container py-20 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-white/5 border-t-accent-primary rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="container animate-fade-in py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold mb-4 text-white tracking-tight">Community Leaderboard</h1>
        <p className="text-text-secondary max-w-2xl mx-auto text-lg font-medium">
          Celebrating our most helpful students and expert contributors.
        </p>
      </div>

      <div className="glass-panel border-white/10 shadow-3xl overflow-hidden" style={{ borderRadius: '24px' }}>
        <div className="bg-white/[0.02] border-b border-white/5" style={{ display: 'grid', gridTemplateColumns: '80px 1fr 120px 120px 120px', padding: '1.50rem 2rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
          <div>Rank</div>
          <div>Contributor</div>
          <div style={{ textAlign: 'center' }}>Reputation</div>
          <div style={{ textAlign: 'center' }}>Answers</div>
          <div style={{ textAlign: 'center' }}>Doubts</div>
        </div>

        <div className="divide-y divide-white/[0.03]">
          {leaderboard.length === 0 ? (
            <div className="p-20 text-center text-text-muted font-bold uppercase tracking-widest text-xs">No contributors found yet.</div>
          ) : (
            leaderboard.map((user, index) => (
              <div key={user.id} className="hover:bg-white/[0.01] transition-colors" style={{ display: 'grid', gridTemplateColumns: '80px 1fr 120px 120px 120px', padding: '1.25rem 2rem', alignItems: 'center' }}>
                
                <div className={`text-xl font-black ${index < 3 ? 'text-accent-primary' : 'text-white/20'}`}>
                  #{index + 1}
                </div>
                
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center font-bold text-lg shadow-inner ${index < 3 ? 'bg-accent-primary/10 border-accent-primary/20 text-accent-primary' : 'bg-white/5 border-white/5 text-white'}`}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <Link href={`/profile/${user.id}`} className="font-bold text-white hover:text-accent-primary transition-colors">
                      {user.username}
                      {index === 0 && <span className="ml-2 text-[10px] bg-accent-warning/20 text-accent-warning px-2 py-0.5 rounded-md">King of Hub</span>}
                    </Link>
                    <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">
                      {user.badges?.[0]?.name || 'Apprentice'}
                    </div>
                  </div>
                </div>

                <div className="text-2xl font-black text-white text-center tabular-nums">
                  {user.reputation}
                </div>
                
                <div className="text-center text-sm font-bold text-text-secondary">{user._count?.answers || 0}</div>
                <div className="text-center text-sm font-bold text-text-secondary">{user._count?.doubts || 0}</div>
                
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
