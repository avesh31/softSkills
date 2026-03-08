"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function CreateHubPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [icon, setIcon] = useState('🌐');
  const [color, setColor] = useState('#6366f1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    if (typeof window !== 'undefined') router.push('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/hubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, category, icon, color }),
      });
      const data = await res.json();
      
      if (res.ok) {
        router.push('/');
      } else {
        setError(data.error || 'Failed to create hub');
      }
    } catch (err) {
      setError('A network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const icons = ['🌐', '💻', '🧪', '🔢', '📚', '🎨', '🚀', '🧠', '🛡️', '⚡', '🤖', '🌍'];
  const colors = ['#6366f1', '#10b981', '#ec4899', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#06b6d4'];

  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 1rem', maxWidth: '900px' }}>
      
      {/* 1. Header (Matching Model) */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', marginBottom: '0.5rem' }}>
          Create a Hub
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: 500 }}>
          Launch a new academic community for the students.
        </p>
      </div>

      {/* 2. Glass Form (Matching Model) */}
      <div className="glass-panel" style={{ padding: '3rem', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
        
        {error && (
          <div style={{ 
            padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--accent-danger)', borderRadius: 'var(--radius-md)', marginBottom: '2rem', fontWeight: 700, fontSize: '14px'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Title / Name */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Hub Name</label>
            <input 
              type="text" 
              className="input" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
              placeholder="e.g. Distributed Systems or Advanced Physics"
              style={{ background: 'rgba(0,0,0,0.2)' }}
            />
          </div>

          {/* Grid Row: Category + Choice (Matching Difficulty/Priority Triple) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Category / Topic</label>
              <input 
                type="text" 
                className="input" 
                value={category} 
                onChange={e => setCategory(e.target.value)} 
                required 
                placeholder="e.g. Engineering, Arts, IT"
                style={{ background: 'rgba(0,0,0,0.2)' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Starting Icon</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
                {icons.slice(0, 6).map(i => (
                  <button 
                    key={i} 
                    type="button"
                    onClick={() => setIcon(i)}
                    style={{ 
                      width: '32px', height: '32px', borderRadius: '4px', fontSize: '16px',
                      background: icon === i ? 'var(--accent-primary)' : 'rgba(255,255,255,0.03)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Theme color</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
                {colors.slice(0, 6).map(c => (
                  <button 
                    key={c} 
                    type="button"
                    onClick={() => setColor(c)}
                    style={{ 
                      width: '32px', height: '32px', borderRadius: '4px',
                      background: c,
                      border: color === c ? '2px solid white' : '2px solid transparent',
                      transform: color === c ? 'scale(1.1)' : 'scale(1)',
                      transition: 'all 0.2s'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Description (Matching Detailed Description) */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Detailed Description</label>
            <textarea 
              className="input custom-scrollbar" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              required 
              rows={6}
              style={{ resize: 'none', background: 'rgba(0,0,0,0.2)' }}
              placeholder="Include the goals of this community and what students should expect..."
            />
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1.5rem', marginTop: '1rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <Link href="/" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Cancel
            </Link>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ padding: '1rem 3.5rem', fontWeight: 900, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}
            >
              {loading ? 'Creating Hub...' : 'Create Hub'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
