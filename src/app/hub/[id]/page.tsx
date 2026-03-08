"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import DoubtCard from '@/components/DoubtCard';

export default function HubsPage() {
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  const [doubts, setDoubts] = useState<any[]>([]);
  const [hub, setHub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  const fetchHubData = () => {
    fetch('/api/hubs')
      .then(res => res.json())
      .then(data => {
        const found = data.hubs?.find((h: any) => h.id === id);
        if (found) {
          setHub(found);
          setIsFollowing(found.isFollowing);
          setFollowerCount(found._count?.followers || 0);
        }
      });
  };

  useEffect(() => {
    fetchHubData();

    // Fetch doubts for this hub
    fetch(`/api/doubts?hubId=${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.doubts) setDoubts(data.doubts);
        setLoading(false);
      });
  }, [id]);

  const handleFollow = async () => {
    if (!user) return alert('Please log in to follow hubs.');

    // Optimistic Update
    setIsFollowing(!isFollowing);
    setFollowerCount(prev => prev + (isFollowing ? -1 : 1));

    const res = await fetch('/api/hubs/follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hubId: id })
    });
    if (!res.ok) {
      // Revert if failed
      setIsFollowing(isFollowing);
      setFollowerCount(prev => prev + (isFollowing ? 1 : -1));
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading hub...</div>;
  if (!hub) return <div style={{ textAlign: 'center', padding: '4rem' }}>Hub not found</div>;

  return (
    <div className="animate-fade-in" style={{ padding: '2rem 0', maxWidth: '900px', margin: '0 auto' }}>
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', background: `linear-gradient(to right, ${hub.color}20, transparent)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: hub.color, boxShadow: `0 0 20px ${hub.color}40` }}></div>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: hub.color }}>{hub.name}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{hub.description}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{followerCount} Followers</p>
          </div>
        </div>
        
        <button 
          onClick={handleFollow}
          className={isFollowing ? "btn btn-secondary" : "btn btn-primary"}
          style={{ padding: '0.5rem 1.5rem' }}
        >
          {isFollowing ? 'Following' : 'Follow Hub'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {doubts.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No doubts found in this hub.</p>
        ) : (
          doubts.map(doubt => (
            <DoubtCard key={doubt.id} doubt={doubt} />
          ))
        )}
      </div>
    </div>
  );
}
