"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import DoubtCard from '@/components/DoubtCard';
import ActivityGraph from '@/components/ActivityGraph';

export default function Home() {
  const { user } = useAuth();
  
  // Data States
  const [doubts, setDoubts] = useState<any[]>([]);
  const [trendingDoubts, setTrendingDoubts] = useState<any[]>([]);
  const [hubs, setHubs] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [recentChat, setRecentChat] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Quotes
  const quotes = [
    "The best way to learn something is to teach it to someone else.",
    "Logic is the beginning of wisdom, not the end.",
    "The only true wisdom is in knowing you know nothing.",
    "Programming isn't about what you know; it's about what you can figure out.",
    "Education is not the learning of facts, but the training of the mind to think."
  ];
  const [quote] = useState(quotes[Math.floor(Math.random() * quotes.length)]);

  useEffect(() => {
    // 1. Fetch Shared Data (Platform-wide)
    const fetchGlobalData = async () => {
      try {
        const [hubsRes, doubtsRes, trendingRes, statsRes, leaderboardRes, chatRes] = await Promise.all([
          fetch('/api/hubs'),
          fetch('/api/doubts'),
          fetch('/api/doubts?trending=true'),
          fetch('/api/stats'),
          fetch('/api/leaderboard'),
          fetch('/api/chat')
        ]);

        const hubsData = await hubsRes.json();
        const doubtsData = await doubtsRes.json();
        const trendingData = await trendingRes.json();
        const statsData = await statsRes.json();
        const leaderboardData = await leaderboardRes.json();
        const chatData = await chatRes.json();

        setHubs(hubsData.hubs || []);
        setDoubts(doubtsData.doubts || []);
        setTrendingDoubts((trendingData.doubts || []).slice(0, 5));
        setPlatformStats(statsData.stats || null);
        setLeaderboard((leaderboardData.leaderboard || []).slice(0, 3));
        setRecentChat((chatData.messages || []).slice(-10)); // Get more for scrollable preview
        
        setLoading(false);
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
        setLoading(false);
      }
    };

    fetchGlobalData();
  }, []);

  useEffect(() => {
    // 2. Fetch User Specific Data
    if (user) {
      fetch(`/api/users/${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.user) setUserProfile(data.user);
        });
    }
  }, [user]);

  if (loading) {
    return (
      <div className="container py-20 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/5 border-t-accent-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
      
      {/* 1. Welcome Section */}
      <section className="welcome-card shadow-glow">
        <div style={{ position: 'relative', zIndex: 10, flex: 1 }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', marginBottom: '1rem' }}>
            Welcome back, <span style={{ color: 'var(--accent-primary)' }}>{user?.username || 'Learner'}</span> 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '500px', marginBottom: '2rem', fontWeight: 500 }}>
            Ready to solve some doubts today? Your contributions are making the community smarter.
          </p>
          <div className="flex gap-4">
            <Link href="/ask" className="btn btn-primary" style={{ padding: '1rem 2rem', fontWeight: 700 }}>Ask a Doubt</Link>
            <Link href="/chat" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontWeight: 700 }}>Chat Lounge</Link>
          </div>
        </div>

        <div className="stat-grid" style={{ zIndex: 10, width: '100%', maxWidth: '500px' }}>
          {[
            { label: 'Doubts Asked', val: userProfile?._count?.doubts || 0, icon: '❓' },
            { label: 'Answers Given', val: userProfile?._count?.answers || 0, icon: '💡' },
            { label: 'Reputation', val: userProfile?.reputation || 0, icon: '⭐' },
            { label: 'Bookmarks', val: userProfile?._count?.bookmarks || 0, icon: '🔖' }
          ].map(stat => (
            <div key={stat.label} className="stat-card">
              <span style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{stat.icon}</span>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'white' }}>{stat.val}</span>
              <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px' }}>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Main Grid Layout */}
      <div className="dashboard-grid">
        
        {/* LEFT COLUMN */}
        <aside className="dashboard-left flex flex-col gap-8">
          
          {/* Quick Actions */}
          <div className="glass-panel p-6 flex flex-col gap-2">
            <h3 style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1rem' }}>Quick Actions</h3>
            {[
              { label: 'Ask a Doubt', link: '/ask', icon: '✍️' },
              { label: 'Explore Hubs', link: '/hubs', icon: '🏢' },
              { label: 'Start a Community', link: '/hubs/create', icon: '🚀' },
              { label: 'Bookmarks', link: '/bookmarks', icon: '🔖' },
              { label: 'Chat Lounge', link: '/chat', icon: '💬' }
            ].map(action => (
              <Link key={action.label} href={action.link} className="quick-action-link group">
                <div className="icon-box">{action.icon}</div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>{action.label}</span>
              </Link>
            ))}
          </div>

          {/* Recommended Hubs */}
          <div className="glass-panel p-6">
            <h3 style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.5rem' }}>Recommended Hubs</h3>
            <div className="flex flex-wrap gap-2">
              {hubs.slice(0, 6).map(hub => (
                <Link key={hub.id} href={`/hub/${hub.id}`} className="badge badge-primary hover:scale-105 transition-transform" style={{ padding: '0.5rem 1rem' }}>
                  {hub.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Platform Statistics */}
          <div className="glass-panel p-6">
            <h3 style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.5rem' }}>Network Growth</h3>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {[
                { label: 'Learners', val: platformStats?.totalUsers || 0, color: 'var(--accent-primary)' },
                { label: 'Doubts', val: platformStats?.totalDoubts || 0, color: '#fff' },
                { label: 'Answers', val: platformStats?.totalAnswers || 0, color: '#fff' },
                { label: 'Solved', val: platformStats?.totalSolved || 0, color: 'var(--accent-success)' }
              ].map(stat => (
                <div key={stat.label}>
                  <p style={{ fontSize: '20px', fontWeight: 900, color: stat.color }}>{stat.val}</p>
                  <p style={{ fontSize: '9px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tip of Day */}
          <div className="p-6" style={{ background: 'linear-gradient(to bottom right, rgba(99, 102, 241, 0.1), transparent)', border: '1px solid rgba(99, 102, 241, 0.1)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontSize: '10px', fontWeight: 900, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>Tip of the Day</p>
            <p style={{ fontSize: '13px', fontStyle: 'italic', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5' }}>
              "{quote}"
            </p>
          </div>
        </aside>

        {/* CENTER COLUMN - RECENT DOUBTS */}
        <main className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="section-title" style={{ marginBottom: 0 }}>Recent Community Doubts</h2>
            <Link href="/hubs" style={{ fontSize: '10px', fontWeight: 900, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>View All hubs</Link>
          </div>

          <div className="flex flex-col gap-6">
            {doubts.length === 0 ? (
              <div className="glass-panel p-20 text-center">
                <p style={{ fontWeight: 700, color: 'var(--text-muted)' }}>No doubts found. Start the conversation!</p>
              </div>
            ) : (
              doubts.map(doubt => (
                <DoubtCard key={doubt.id} doubt={doubt} />
              ))
            )}
          </div>
        </main>

        {/* RIGHT COLUMN */}
        <aside className="dashboard-right flex flex-col gap-8">
          
          {/* Trending */}
          <div className="glass-panel p-6">
            <h3 style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.5rem' }}>🔥 Trending Now</h3>
            <div className="flex flex-col gap-4">
              {trendingDoubts.map((td, idx) => (
                <Link key={td.id} href={`/doubt/${td.id}`} className="trending-item">
                  <span className="trending-rank">0{idx + 1}</span>
                  <div style={{ minWidth: 0 }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }}>
                      {td.title}
                    </h4>
                    <p style={{ fontSize: '9px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {td._count.answers} Answers • {td.views} Views
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Top Contributors */}
          <div className="glass-panel p-6">
            <h3 style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.5rem' }}>🏆 Top Contributors</h3>
            <div className="flex flex-col gap-4">
              {leaderboard.map((u, idx) => (
                <Link key={u.id} href={`/profile/${u.id}`} className="flex items-center justify-between group" style={{ transition: 'transform 0.2s' }}>
                  <div className="flex items-center gap-3">
                    <div style={{ 
                      width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 900,
                      background: idx === 0 ? 'var(--accent-warning)' : 'rgba(255,255,255,0.05)',
                      color: idx === 0 ? '#000' : 'var(--text-muted)'
                    }}>
                      {idx + 1}
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{u.username}</p>
                      <p style={{ fontSize: '9px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{u.reputation} Points</p>
                    </div>
                  </div>
                </Link>
              ))}
              <Link href="/leaderboard" className="btn btn-secondary" style={{ width: '100%', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', marginTop: '1rem', padding: '0.6rem' }}>
                Full Leaderboard
              </Link>
            </div>
          </div>

          {/* Live Chat Lounge Widget */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            
            {/* Widget Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '14px' }}>💬</span>
                <h3 style={{ fontSize: '10px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '2px' }}>
                  Live Chat Lounge
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--accent-success)', textTransform: 'uppercase', letterSpacing: '1px' }}>Active</span>
                <div className="pulse-success" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-success)' }}></div>
              </div>
            </div>

            {/* Scrollable Message List */}
            <div 
              className="custom-scrollbar" 
              style={{ 
                height: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px',
                paddingRight: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', padding: '1rem'
              }}
            >
              {recentChat.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Lounge is quiet</p>
                </div>
              ) : (
                recentChat.map(msg => (
                  <div key={msg.id} style={{ display: 'flex', gap: '6px', fontSize: '12px', lineHeight: '1.4' }}>
                    <span style={{ fontWeight: 800, color: 'var(--accent-primary)', flexShrink: 0 }}>
                      {msg.author.username}:
                    </span>
                    <span style={{ color: 'var(--text-secondary)', wordBreak: 'break-word' }}>
                      {msg.content}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Widget Footer */}
            <Link 
              href="/chat" 
              className="btn btn-secondary" 
              style={{ 
                width: '100%', padding: '0.75rem', fontSize: '10px', fontWeight: 900, 
                textTransform: 'uppercase', letterSpacing: '2px', textAlign: 'center'
              }}
            >
              Join Chat Lounge
            </Link>
          </div>

        </aside>
      </div>

      {/* ACTIVITY GRAPH */}
      {userProfile?.activityGraph && (
        <section style={{ marginTop: '3rem' }}>
          <div className="glass-panel p-8" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white' }}>Your Learning Journey</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, marginTop: '4px' }}>Community impact over the last 90 days</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white' }}>{userProfile?._count?.answers || 0}</p>
                <p style={{ fontSize: '9px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Contributions</p>
              </div>
            </div>
            <ActivityGraph data={userProfile.activityGraph} months={3} />
          </div>
        </section>
      )}

    </div>
  );
}
