"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import DoubtCard from '@/components/DoubtCard';
import ActivityGraph from '@/components/ActivityGraph';

export default function ProfilePage() {
  const { id } = useParams() as { id: string };
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('doubts'); // 'doubts', 'answers', 'bookmarks'
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetch(`/api/users/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setProfile(data.user);
          setIsFollowing(data.user.isFollowing || false);
        }
        setLoading(false);
      });
  }, [id, currentUser]);

  const handleFollowToggle = async () => {
    if (!currentUser) return;
    setIsFollowLoading(true);
    try {
      const res = await fetch(`/api/users/${id}/follow`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setIsFollowing(data.isFollowing);
        setProfile((prev: any) => ({
          ...prev,
          _count: {
            ...prev._count,
            followers: data.isFollowing ? prev._count.followers + 1 : prev._count.followers - 1
          }
        }));
      }
    } catch (e) {
      console.error("Follow error", e);
    } finally {
      setIsFollowLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading Expert Profile...</div>;
  if (!profile) return <div style={{ textAlign: 'center', padding: '4rem' }}>Student Record Not Found</div>;

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="main-layout animate-fade-in" style={{ gridTemplateColumns: '1fr', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. Top Header Profile Identity */}
      <section className="glass-panel" style={{ padding: '2rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', fontWeight: 'bold', boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)' }}>
            {profile.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.25rem' }}>
              <h1 style={{ fontSize: '2.5rem', margin: 0 }}>{profile.username}</h1>
              <span className="badge" style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)', color: 'var(--accent-primary)', fontSize: '0.9rem', padding: '0.2rem 0.6rem' }}>
                {profile.rank}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              <span>Member since {new Date(profile.createdAt).toLocaleDateString()}</span>
              {profile.department && <span>• {profile.department}</span>}
              {profile.yearOfStudy && <span>• Year {profile.yearOfStudy}</span>}
            </div>
            {profile.bio && <p style={{ marginTop: '0.75rem', color: 'var(--text-primary)' }}>{profile.bio}</p>}
            
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', fontSize: '0.95rem' }}>
              <div><strong style={{ color: 'var(--text-primary)' }}>{profile._count?.followers || 0}</strong> <span style={{ color: 'var(--text-muted)' }}>Followers</span></div>
              <div><strong style={{ color: 'var(--text-primary)' }}>{profile._count?.following || 0}</strong> <span style={{ color: 'var(--text-muted)' }}>Following</span></div>
            </div>
          </div>
        </div>

        {!isOwnProfile && currentUser && (
          <button 
            className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`} 
            onClick={handleFollowToggle}
            disabled={isFollowLoading}
            style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}
          >
            {isFollowLoading ? 'Wait...' : isFollowing ? 'Unfollow' : 'Follow User'}
          </button>
        )}
      </section>

      {/* 2. Middle Grid: Stats, Graph, Expertise */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Core Stats */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Reputation Breakdown</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{profile.trustScore}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Trust Score</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>{profile.reputation}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Net Points</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{profile.bestAnswers}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Best Answers</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{profile._count.answers}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Helped</div>
            </div>
          </div>
        </div>

        {/* Activity Graph */}
        <ActivityGraph data={profile.activityGraph} months={4} />

        {/* Hub Expertise & Badges */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
           <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Hub Expertise</h3>
            {profile.expertHubs && profile.expertHubs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {profile.expertHubs.map((hub: any, i: number) => {
                    // Calculate stars max 5 based on points density
                    const stars = Math.min(5, Math.ceil(hub.count / 3));
                    return (
                      <div key={`eh-${i}`} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                        <span style={{ fontWeight: 500 }}>{hub.name}</span>
                        <span style={{ color: 'var(--accent-warning)', letterSpacing: '2px' }}>{'⭐'.repeat(stars)}</span>
                      </div>
                    )
                  })}
                </div>
            ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Not evaluated yet</p>}
           </div>
           
           <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Earned Badges</h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {profile.badges && profile.badges.length > 0 ? profile.badges.map((badge: any) => (
                    <div key={badge.id} title={badge.name} style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                        {badge.icon}
                    </div>
                )) : <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No badges yet</span>}
            </div>
           </div>
        </div>
      </section>

      {/* 3. Bottom Feed Toggle (Doubts / Answers / Bookmarks) */}
      <section>
         <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
            <button 
                onClick={() => setActiveTab('doubts')}
                style={{ padding: '1rem 2rem', background: 'transparent', border: 'none', color: activeTab === 'doubts' ? 'var(--accent-primary)' : 'var(--text-secondary)', borderBottom: activeTab === 'doubts' ? '2px solid var(--accent-primary)' : '2px solid transparent', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            >
                Published Doubts ({profile._count.doubts})
            </button>
            <button 
                onClick={() => setActiveTab('answers')}
                style={{ padding: '1rem 2rem', background: 'transparent', border: 'none', color: activeTab === 'answers' ? 'var(--accent-primary)' : 'var(--text-secondary)', borderBottom: activeTab === 'answers' ? '2px solid var(--accent-primary)' : '2px solid transparent', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            >
                Recent Answers ({profile._count.answers})
            </button>
            {isOwnProfile && (
                <button 
                    onClick={() => setActiveTab('bookmarks')}
                    style={{ padding: '1rem 2rem', background: 'transparent', border: 'none', color: activeTab === 'bookmarks' ? 'var(--accent-primary)' : 'var(--text-secondary)', borderBottom: activeTab === 'bookmarks' ? '2px solid var(--accent-primary)' : '2px solid transparent', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                >
                    Private Bookmarks ({profile.bookmarks?.length || 0})
                </button>
            )}
         </div>

         <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {activeTab === 'doubts' && profile.doubts && profile.doubts.length > 0 ? (
                profile.doubts.map((doubt: any) => <DoubtCard key={`pd-${doubt.id}`} doubt={doubt} />)
            ) : activeTab === 'doubts' ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No doubts published yet.</p>
            ) : null}

            {activeTab === 'bookmarks' && profile.bookmarks && profile.bookmarks.length > 0 ? (
                profile.bookmarks.map((doubt: any) => <DoubtCard key={`bm-${doubt.id}`} doubt={doubt} />)
            ) : activeTab === 'bookmarks' ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Your bookmark reading list is empty.</p>
            ) : null}

            {activeTab === 'answers' && profile.answers && profile.answers.length > 0 ? (
                profile.answers.map((answer: any) => (
                    <div key={`pa-${answer.id}`} className="glass-panel" style={{ padding: '1.5rem', borderLeft: answer.isBestAnswer ? '4px solid var(--accent-success)' : '4px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Link href={`/doubt/${answer.doubt.id}`}>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                                Answered on thread: <span style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>{answer.doubt.title}</span>
                            </div>
                          </Link>
                          {answer.isBestAnswer && <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-success)' }}>✅ Best Answer</span>}
                        </div>
                        <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                        {answer.content}
                        </p>
                    </div>
                ))
            ) : activeTab === 'answers' ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No answers provided yet.</p>
            ) : null}
         </div>
      </section>

    </div>
  );
}
