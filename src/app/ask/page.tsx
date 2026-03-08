"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { ReactSketchCanvas } from 'react-sketch-canvas';

export default function AskDoubtPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [hubId, setHubId] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [priority, setPriority] = useState('Medium');
  const [hubs, setHubs] = useState<any[]>([]);
  const [useWhiteboard, setUseWhiteboard] = useState(false);
  const canvasRef = useRef<any>(null);
  
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    fetch('/api/hubs')
      .then(res => res.json())
      .then(data => {
        if (data.hubs) setHubs(data.hubs);
      });
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (title.length >= 3) {
        fetch(`/api/doubts/suggest?q=${encodeURIComponent(title)}`)
          .then(res => res.json())
          .then(data => {
            if (data.suggestions) setSuggestions(data.suggestions);
          });
      } else {
        setSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [title]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    let finalImageUrl = null;
    if (useWhiteboard && canvasRef.current) {
      try {
        finalImageUrl = await canvasRef.current.exportImage('png');
      } catch (e) {
        console.error("Failed to export canvas", e);
      }
    }

    try {
      const res = await fetch('/api/doubts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, description, codeSnippet, hubId, difficulty, priority,
          imageUrl: finalImageUrl
        }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to post doubt');
      
      router.push(`/doubt/${data.doubt.id}`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (isLoading || !user) return null; // Or a loading spinner

  return (
    <div className="animate-fade-in" style={{ padding: '2rem 0', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Ask a Doubt</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Post your academic question to the community.</p>

      {error && <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>{error}</div>}

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit}>
          
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Title</label>
            <input 
              type="text" 
              className="input" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              required 
              placeholder="e.g. How does garbage collection work in V8?"
              style={{ padding: '1rem', fontSize: '1.1rem' }}
            />
            
            {/* Smart Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <div className="glass-panel" style={{ 
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, 
                marginTop: '0.5rem', padding: '0.5rem', background: 'var(--bg-secondary)' 
              }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', padding: '0 0.5rem' }}>
                  Similar doubts found. Has your question already been answered?
                </div>
                {suggestions.map((s) => (
                  <Link href={`/doubt/${s.id}`} key={s.id} style={{ display: 'block', padding: '0.75rem', borderRadius: 'var(--radius-sm)', transition: 'background 0.2s', ...{ ':hover': { background: 'rgba(255,255,255,0.05)' } } as any }}>
                    <div style={{ fontWeight: 500, color: 'var(--accent-primary)' }}>{s.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      {s.status} • {s._count.answers} answers • {s.views} views
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Category / Hub</label>
              <select 
                className="input" 
                value={hubId} 
                onChange={e => setHubId(e.target.value)} 
                required
                style={{ WebkitAppearance: 'none', appearance: 'none' }}
              >
                <option value="" disabled>Select a hub...</option>
                {hubs.map(hub => (
                  <option key={hub.id} value={hub.id}>{hub.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Difficulty</label>
              <select 
                className="input" 
                value={difficulty} 
                onChange={e => setDifficulty(e.target.value)}
                style={{ WebkitAppearance: 'none', appearance: 'none' }}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Priority</label>
              <select 
                className="input" 
                value={priority} 
                onChange={e => setPriority(e.target.value)}
                style={{ WebkitAppearance: 'none', appearance: 'none' }}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Description</label>
            <textarea 
              className="input" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              required 
              rows={8}
              placeholder="Include all the context and what you've tried so far..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Code Snippet (Optional)</label>
            <textarea 
              className="input" 
              value={codeSnippet} 
              onChange={e => setCodeSnippet(e.target.value)} 
              rows={5}
              placeholder="Paste any relevant code here..."
              style={{ fontFamily: 'monospace', fontSize: '0.9rem', background: '#0d0d0d' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '1rem' }}>
              <input 
                type="checkbox" 
                checked={useWhiteboard}
                onChange={e => setUseWhiteboard(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              Attach a Whiteboard Drawing (Mathematics, Electronics, etc.)
            </label>
            
            {useWhiteboard && (
              <div style={{ marginTop: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <div style={{ padding: '0.5rem', background: 'var(--bg-secondary)', display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => canvasRef.current?.undo()}>Undo</button>
                  <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => canvasRef.current?.clearCanvas()}>Clear</button>
                </div>
                <ReactSketchCanvas
                  ref={canvasRef}
                  style={{ height: '300px', width: '100%', border: 'none' }}
                  strokeWidth={4}
                  strokeColor="var(--accent-primary)"
                  canvasColor="var(--bg-primary)"
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Posting...' : 'Post Doubt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
