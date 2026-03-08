"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import DoubtCard from '@/components/DoubtCard';

export default function BookmarksPage() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    fetch('/api/bookmarks')
      .then(res => res.json())
      .then(data => {
        if (data.bookmarks) setBookmarks(data.bookmarks);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [user]);

  if (!user) return (
    <div className="container py-20 flex items-center justify-center">
      <div className="glass-panel p-10 max-w-sm text-center border-white/10 shadow-2xl">
        <h2 className="text-2xl font-bold mb-4">Your Bookmarks</h2>
        <p className="text-text-secondary mb-8 leading-relaxed">Please log in to see your saved doubts.</p>
        <Link href="/login" className="btn btn-primary w-full">Sign In</Link>
      </div>
    </div>
  );

  if (loading) return (
    <div className="container py-20 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-white/5 border-t-accent-primary rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="container animate-fade-in py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold mb-4 text-white tracking-tight">Your Bookmarks</h1>
        <p className="text-text-secondary max-w-2xl mx-auto text-lg font-medium">
          Access all the doubts you've saved for later reference.
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        {bookmarks.length === 0 ? (
          <div className="glass-panel p-20 text-center border-white/10" style={{ borderRadius: '32px' }}>
            <div className="text-5xl mb-6">🔖</div>
            <h3 className="text-xl font-bold mb-2 text-white">No bookmarks yet</h3>
            <p className="text-text-secondary mb-8">Save interesting doubts to see them here.</p>
            <Link href="/" className="btn btn-secondary">Explore Doubts</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {bookmarks.map((b) => (
              <DoubtCard key={b.id} doubt={b.doubt} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
