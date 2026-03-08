"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import AIAssistant from '@/components/AIAssistant/AIAssistant';
import ConceptQuiz from '@/components/ConceptQuiz';

export default function DoubtDetailPage() {
  const { id } = useParams() as { id: string };
  const [doubt, setDoubt] = useState<any>(null);
  
  // User specific state
  const [hasBookmarked, setHasBookmarked] = useState(false);
  const [upvotedDoubt, setUpvotedDoubt] = useState(false);
  const [upvotedAnswers, setUpvotedAnswers] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  const [answerContent, setAnswerContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [autoOpenAI, setAutoOpenAI] = useState(false);

  useEffect(() => {
    fetchDoubt();
  }, [id, user]);

  const fetchDoubt = async () => {
    try {
      const res = await fetch(`/api/doubts/${id}`);
      const data = await res.json();
      if (data.doubt) {
        setDoubt(data.doubt);
        setHasBookmarked(data.hasBookmarked || false);
        setUpvotedDoubt(data.upvotedDoubt || false);
        setUpvotedAnswers(data.upvotedAnswers || []);

        // Auto-open AI Assistant after 5 minutes if no answers
        if (data.doubt.answers.length === 0) {
          const createdAt = new Date(data.doubt.createdAt).getTime();
          const now = new Date().getTime();
          const fiveMinutes = 5 * 60 * 1000;
          
          if (now - createdAt >= fiveMinutes) {
            setAutoOpenAI(true);
          } else {
            // Set a timeout to auto-open
            const timeLeft = fiveMinutes - (now - createdAt);
            const timer = setTimeout(() => {
              setAutoOpenAI(true);
            }, timeLeft);
            return () => clearTimeout(timer);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePostAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert('Please login to answer');
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/doubts/${id}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: answerContent }),
      });
      if (res.ok) {
        setAnswerContent('');
        fetchDoubt();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReaction = async (targetId: string, isDoubt: boolean) => {
    if (!user) return alert('Please login to upvote');

    // Optimistic UI updates
    if (isDoubt) {
      const action = upvotedDoubt ? -1 : 1;
      setUpvotedDoubt(!upvotedDoubt);
      setDoubt({ ...doubt, _count: { ...doubt._count, reactions: doubt._count.reactions + action }});
    } else {
      const hasUpvoted = upvotedAnswers.includes(targetId);
      if (hasUpvoted) {
        setUpvotedAnswers(prev => prev.filter(x => x !== targetId));
      } else {
        setUpvotedAnswers(prev => [...prev, targetId]);
      }
      // Update specific answer count
      setDoubt((prev: any) => {
        const answers = prev.answers.map((ans: any) => {
          if (ans.id === targetId) {
            return { ...ans, _count: { reactions: ans._count.reactions + (hasUpvoted ? -1 : 1) } };
          }
          return ans;
        });
        return { ...prev, answers };
      });
    }

    await fetch('/api/reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(isDoubt ? { doubtId: id } : { answerId: targetId, doubtId: id }),
    });
  };

  const handleBookmark = async () => {
    if (!user) return alert('Please login to bookmark');
    setHasBookmarked(!hasBookmarked);
    await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doubtId: id }),
    });
  };

  const handleMarkBest = async (answerId: string) => {
    if (!user || user.id !== doubt.authorId) return;
    
    await fetch(`/api/answers/${answerId}/best`, { method: 'POST' });
    fetchDoubt();
  };
  
  const handleGenerateAI = async () => {
    setGeneratingAI(true);
    try {
      const res = await fetch('/api/ai-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doubtId: id }),
      });
      if (res.ok) {
        fetchDoubt();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to generate AI explanation');
      }
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleShare = async () => {
    if (!user) return alert('Please login to share');
    const targetUsername = window.prompt("Enter the username of the person you want to share this doubt with:");
    if (!targetUsername) return;
    
    try {
      const res = await fetch('/api/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doubtId: id, targetUsername }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to share');
      alert(`Successfully shared with ${targetUsername}!`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading...</div>;
  if (!doubt) return <div style={{ textAlign: 'center', padding: '4rem' }}>Doubt not found</div>;

  return (
    <div className="main-layout animate-fade-in" style={{ gridTemplateColumns: 'minmax(0, 1fr) 300px' }}>
      <section>
        {/* Question Section */}
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <h1 style={{ fontSize: '1.75rem', lineHeight: 1.3, color: 'var(--text-primary)' }}>
              {doubt.title}
            </h1>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div className="badge" style={{ backgroundColor: doubt.hub.color + '20', color: doubt.hub.color }}>
                {doubt.hub.name}
              </div>
              {doubt.difficulty && (
                <div className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
                  Diff: {doubt.difficulty}
                </div>
              )}
              {doubt.priority && (
                <div className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
                  Pri: {doubt.priority}
                </div>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <span>Asked by <Link href={`/profile/${doubt.author.id}`} style={{ color: 'var(--accent-primary)' }}>{doubt.author.username}</Link></span>
            <span>•</span>
            <span>{new Date(doubt.createdAt).toLocaleDateString()}</span>
            <span>•</span>
            <span>{doubt.views} views</span>
          </div>

          <div style={{ fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '2rem', whiteSpace: 'pre-wrap' }}>
            {doubt.description}
          </div>

          {doubt.imageUrl && (
            <div style={{ marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)', padding: '1rem', background: '#ffffff' }}>
              <img src={doubt.imageUrl} alt="Whiteboard attachment" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
          )}

          {doubt.codeSnippet && (
            <div style={{ background: '#0d0d0d', padding: '1rem', borderRadius: 'var(--radius-md)', fontFamily: 'monospace', overflowX: 'auto', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <pre style={{ margin: 0, color: '#e5e7eb' }}>
                <code>{doubt.codeSnippet}</code>
              </pre>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button 
              onClick={() => handleReaction(id, true)}
              className={upvotedDoubt ? "btn btn-primary" : "btn btn-secondary"} 
              style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
            >
              👍 Upvote ({doubt._count.reactions})
            </button>
            <button 
              onClick={handleBookmark}
              className={hasBookmarked ? "btn btn-primary" : "btn btn-secondary"} 
              style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
            >
              {hasBookmarked ? '⭐ Bookmarked' : '⭐ Bookmark'}
            </button>
            <button 
              onClick={handleShare}
              className="btn btn-secondary" 
              style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
            >
              📤 Share
            </button>
            
            {/* Manual AI Explanation Button */}
            {!doubt.answers.some((a: any) => a.author.username === 'AI_SYSTEM') && (
              <button 
                onClick={handleGenerateAI}
                disabled={generatingAI}
                className="btn btn-secondary" 
                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}
              >
                {generatingAI ? '🤖 Generating...' : '🤖 Generate AI Explanation'}
              </button>
            )}
          </div>
        </div>

        {/* AI Explanation Section */}
        {doubt.answers.find((a: any) => a.author.username === 'AI_SYSTEM') && (
          <div
            className="glass-panel animate-fade-in"
            style={{
              padding: '1.5rem 2rem',
              marginBottom: '1rem',
              border: '1px solid rgba(99,102,241,0.2)',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(0,0,0,0) 100%)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.4rem' }}>🤖</span>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                AI Explanation
              </h3>
            </div>
            <div style={{ fontSize: '0.95rem', lineHeight: 1.75, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
              {doubt.answers.find((a: any) => a.author.username === 'AI_SYSTEM').content}
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Generated by AI Assistant • Supports collaborative learning
            </div>
          </div>
        )}

        {/* Concept Check Quiz */}
        <ConceptQuiz doubtId={id} />

        {/* AI Assistant Component */}
        <AIAssistant doubtId={id} autoOpen={autoOpenAI} />

        {/* Answers Section */}
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>{doubt.answers.length} Answers</h3>
        
        {doubt.answers.map((answer: any) => (
          <div key={answer.id} className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem', border: answer.isBestAnswer ? '1px solid var(--accent-success)' : undefined }}>
            
            {answer.isBestAnswer && (
              <div style={{ color: 'var(--accent-success)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                ✅ Best Answer
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              {/* Voting */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <button 
                  onClick={() => handleReaction(answer.id, false)}
                  style={{ color: upvotedAnswers.includes(answer.id) ? 'var(--accent-primary)' : 'var(--text-muted)', fontSize: '1.2rem' }}>
                  ▲
                </button>
                <strong style={{ fontSize: '1.1rem' }}>{answer._count.reactions}</strong>
              </div>

              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '1rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>
                  {answer.content}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {/* Mark Best button (for author only) */}
                  <div>
                    {user && user.id === doubt.authorId && !answer.isBestAnswer && doubt.status === 'Open' && (
                      <button 
                        onClick={() => handleMarkBest(answer.id)}
                        className="btn btn-secondary" 
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderColor: 'var(--accent-success)', color: 'var(--accent-success)' }}
                      >
                        Mark as Best
                      </button>
                    )}
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                    <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>answered {new Date(answer.createdAt).toLocaleDateString()}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Link href={`/profile/${answer.author.id}`} style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>
                        {answer.author.username}
                      </Link>
                      <span style={{ color: 'var(--text-muted)' }}>• {answer.author.reputation} rep</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        ))}

        {/* Your Answer Section */}
        <div style={{ marginTop: '3rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Your Answer</h3>
          {user ? (
            <form onSubmit={handlePostAnswer}>
              <textarea 
                className="input" 
                rows={6} 
                value={answerContent}
                onChange={e => setAnswerContent(e.target.value)}
                placeholder="Write your answer here..."
                required
                style={{ marginBottom: '1rem' }}
              />
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Posting...' : 'Post Answer'}
              </button>
            </form>
          ) : (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Please log in to post an answer.</p>
              <Link href="/login" className="btn btn-primary">Log In</Link>
            </div>
          )}
        </div>
      </section>

      {/* Right Sidebar */}
      <aside className="right-sidebar">
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Status</h4>
          <div className="badge" style={{ backgroundColor: doubt.status === 'Solved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: doubt.status === 'Solved' ? 'var(--accent-success)' : 'var(--accent-warning)', fontSize: '0.9rem' }}>
            {doubt.status === 'Solved' ? '✅ Solved' : '⏳ Open (Waiting for answers)'}
          </div>
        </div>
      </aside>
    </div>
  );
}
