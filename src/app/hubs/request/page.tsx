"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function RequestHubPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    if (typeof window !== 'undefined') router.push('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch('/api/hubs/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setStatus({ type: 'success', msg: 'Proposal submitted! Our admins will review your community request shortly.' });
        setName('');
        setDescription('');
      } else {
        setStatus({ type: 'error', msg: data.error || 'Failed to submit request.' });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'A network error occurred. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 1rem', maxWidth: '800px' }}>
      
      {/* Header Section */}
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <div style={{ 
          display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', 
          background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: 'var(--radius-full)', marginBottom: '1.5rem'
        }}>
          <span style={{ fontSize: '14px' }}>🏢</span>
          <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--accent-primary)' }}>
            Expand the Network
          </span>
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', marginBottom: '1rem' }}>
          Propose a <span style={{ color: 'var(--accent-primary)' }}>New Hub</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6, fontWeight: 500 }}>
          Is a subject or technology missing? Submit a proposal to start a new community. 
          Moderators review all requests to ensure quality and relevance.
        </p>
      </div>

      {/* Form Section */}
      <div className="glass-panel shadow-glow" style={{ padding: '3rem', border: '1px solid rgba(255,255,255,0.05)' }}>
        
        {status && (
          <div style={{ 
            padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem',
            background: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${status.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            color: status.type === 'success' ? 'var(--accent-success)' : 'var(--accent-danger)',
            fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <span>{status.type === 'success' ? '✅' : '❌'}</span>
            {status.msg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
              <span>🏷️</span> Hub Subject Name
            </label>
            <input 
              type="text" 
              className="input" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
              style={{ padding: '1.25rem' }}
              placeholder="e.g. Quantum Computing, Advanced Calculus, etc."
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
              <span>📝</span> Community Rationale
            </label>
            <textarea 
              className="input custom-scrollbar" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              required 
              rows={6}
              style={{ padding: '1.25rem', resize: 'none' }}
              placeholder="Why is this community needed? What topics will be discussed here? Help our admins understand the value of this new hub."
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <Link href="/" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              ← Back to Dashboard
            </Link>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ padding: '1rem 2.5rem', fontWeight: 900, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}
            >
              {loading ? 'Submitting Proposal...' : 'Submit Proposal'}
            </button>
          </div>
        </form>
      </div>

      {/* Policy Footer */}
      <div style={{ marginTop: '3rem', textAlign: 'center' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
          By submitting a proposal, you agree to follow <Link href="/guidelines" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>Community Guidelines</Link>.
          Duplicate hub requests will be automatically merged.
        </p>
      </div>

    </div>
  );
}
