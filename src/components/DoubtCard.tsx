"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function DoubtCard({ doubt: initialDoubt }: { doubt: any }) {
  const { user } = useAuth();
  const [doubt, setDoubt] = useState(initialDoubt);
  
  const [upvoting, setUpvoting] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);

  // Fallbacks if not provided directly
  const hasUpvoted = doubt.hasUpvoted || false;
  const hasBookmarked = doubt.hasBookmarked || false;

  const handleUpvote = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return alert('Please login to upvote');
    if (upvoting) return;

    setUpvoting(true);
    
    // Optimistic UI Update
    const action = hasUpvoted ? -1 : 1;
    setDoubt((prev: any) => ({
      ...prev,
      hasUpvoted: !hasUpvoted,
      _count: {
        ...prev._count,
        reactions: Math.max(0, prev._count.reactions + action)
      }
    }));

    try {
      await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doubtId: doubt.id }),
      });
    } catch {
      // Revert if failed
      setDoubt((prev: any) => ({
        ...prev,
        hasUpvoted,
        _count: {
          ...prev._count,
          reactions: prev._count.reactions - action
        }
      }));
    } finally {
      setUpvoting(false);
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return alert('Please login to bookmark');
    if (bookmarking) return;

    setBookmarking(true);
    
    // Optimistic Update
    setDoubt((prev: any) => ({
      ...prev,
      hasBookmarked: !hasBookmarked
    }));

    try {
      await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doubtId: doubt.id }),
      });
    } catch {
      // Revert
      setDoubt((prev: any) => ({
        ...prev,
        hasBookmarked
      }));
    } finally {
      setBookmarking(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return alert('Please login to share');
    
    const targetUsername = window.prompt("Enter the username of the person to share with:");
    if (!targetUsername) return;

    try {
      const res = await fetch('/api/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doubtId: doubt.id, targetUsername }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(`Shared with ${targetUsername}!`);
      
      // Optimistically update shares count
      setDoubt((prev: any) => ({
        ...prev,
        _count: {
          ...prev._count,
          shares: (prev._count.shares || 0) + 1
        }
      }));
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', transition: 'transform 0.2s', borderColor: 'var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Header Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="badge" style={{ backgroundColor: doubt.hub.color + '20', color: doubt.hub.color }}>
          {doubt.hub.name}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
            {doubt.author.username.charAt(0).toUpperCase()}
          </div>
          <Link href={`/profile/${doubt.authorId || doubt.author?.id}`} style={{ color: 'var(--accent-primary)' }}>
            {doubt.author.username}
          </Link>
          <span>• {new Date(doubt.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Title & Description */}
      <Link href={`/doubt/${doubt.id}`} style={{ textDecoration: 'none' }}>
        <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
          {doubt.title}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {doubt.description}
        </p>
      </Link>

      {/* Engagement Metrics */}
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.5rem' }}>
        <span><strong>{doubt.views || 0}</strong> views</span>
        <span>|</span>
        <span><strong>{doubt._count.answers || 0}</strong> answers</span>
        <span>|</span>
        <span><strong>{doubt._count.reactions || 0}</strong> likes</span>
        <span>|</span>
        <span><strong>{doubt._count.shares || 0}</strong> shares</span>
      </div>

      {/* Interactive Actions */}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
        <button 
          onClick={handleUpvote}
          className={hasUpvoted ? "btn btn-primary" : "btn btn-secondary"}
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          👍 Like
        </button>

        <Link 
          href={`/doubt/${doubt.id}`}
          className="btn btn-secondary"
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
        >
          💬 Comment / Answer
        </Link>
        
        <button 
          onClick={handleShare}
          className="btn btn-secondary"
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          🔗 Share
        </button>
        
        <button 
          onClick={handleBookmark}
          className={hasBookmarked ? "btn btn-primary" : "btn btn-secondary"}
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto' }}
        >
          {hasBookmarked ? '🔖 Saved' : '🔖 Bookmark'}
        </button>
      </div>

    </div>
  );
}
