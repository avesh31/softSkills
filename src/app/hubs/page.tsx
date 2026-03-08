"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function HubsPage() {
  const [hubs, setHubs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetch('/api/hubs')
      .then(res => res.json())
      .then(data => {
        setHubs(data.hubs || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Hubs Fetch Error:", err);
        setLoading(false);
      });
  }, []);

  const filteredHubs = hubs.filter(hub => 
    hub.name.toLowerCase().includes(search.toLowerCase()) ||
    hub.description?.toLowerCase().includes(search.toLowerCase()) ||
    hub.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container py-20 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/5 border-t-accent-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '4rem', paddingBottom: '6rem' }}>
      
      {/* 1. Explorer Header */}
      <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, color: 'white', marginBottom: '1rem' }}>
          Explore <span style={{ color: 'var(--accent-primary)' }}>Communities</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto', fontWeight: 500 }}>
          Find your subject, join the conversation, and solve doubts with peers from around the world.
        </p>
      </div>

      {/* 2. Action Bar */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem', marginBottom: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
          <input 
            type="text" 
            className="input" 
            placeholder="Search hubs by name, category or topic..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '3rem' }}
          />
        </div>
        <Link href="/hubs/create" className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontWeight: 900, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          🚀 Create New Hub
        </Link>
      </div>

      {/* 3. Hubs Grid */}
      {filteredHubs.length === 0 ? (
        <div className="glass-panel text-center" style={{ padding: '5rem' }}>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', fontWeight: 700 }}>No communities found matching your search.</p>
          <Link href="/hubs/create" style={{ color: 'var(--accent-primary)', fontWeight: 700, marginTop: '1rem', display: 'inline-block' }}>
            Be the first to start this hub!
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
          {filteredHubs.map(hub => (
            <div key={hub.id} className="glass-panel group" style={{ padding: '2rem', transition: 'all 0.3s ease', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
              
              {/* Hub Theme Accent */}
              <div style={{ 
                position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', 
                background: hub.color || 'var(--accent-primary)', opacity: 0.6 
              }}></div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ 
                  width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px',
                  border: '1px solid rgba(255,255,255,0.05)', flexShrink: 0
                }}>
                  {hub.icon || '🌐'}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white', marginBottom: '4px' }}>{hub.name}</h3>
                  <span className="badge badge-primary" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {hub.category || 'Subject'}
                  </span>
                </div>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, marginBottom: '2rem', height: '3.2rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {hub.description || 'Welcome to the community! Join us to discuss and solve academic doubts.'}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '16px', fontWeight: 900, color: 'white' }}>{hub._count?.followers || 0}</p>
                    <p style={{ fontSize: '9px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Followers</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '16px', fontWeight: 900, color: 'white' }}>{hub._count?.doubts || 0}</p>
                    <p style={{ fontSize: '9px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Doubts</p>
                  </div>
                </div>
                <Link href={`/hub/${hub.id}`} className="btn btn-secondary" style={{ padding: '0.6rem 1.25rem', fontSize: '12px', fontWeight: 700 }}>
                  Enter Hub
                </Link>
              </div>

              {/* Hover Glow */}
              <div style={{ 
                position: 'absolute', bottom: '-50px', right: '-50px', width: '150px', height: '150px', 
                background: hub.color || 'var(--accent-primary)', opacity: 0, filter: 'blur(60px)',
                borderRadius: '50%', transition: 'opacity 0.3s ease', pointerEvents: 'none'
              }} className="group-hover:opacity-10"></div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
