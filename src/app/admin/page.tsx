"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingDeps, setLoadingDeps] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoading) return;
    
    // Check if the user is genuinely an admin. We verify by trying to fetch the requests.
    // Realistically you should decode the JWT or fetch the user model.
    fetch('/api/hubs/requests')
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then(data => {
        setRequests(data.requests || []);
      })
      .catch(err => {
        setError('You are not authorized to view the Admin Dashboard.');
      })
      .finally(() => {
        setLoadingDeps(false);
      });
  }, [user, isLoading, router]);

  const handleAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const res = await fetch(`/api/hubs/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        // Remove locally
        setRequests(prev => prev.map(req => req.id === id ? { ...req, status: action + 'D' } : req));
      } else {
        alert('Action failed');
      }
    } catch {
      alert('Network error');
    }
  };

  if (isLoading || loadingDeps) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading Admin Panel...</div>;

  if (error) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--accent-danger)', fontSize: '2rem', marginBottom: '1rem' }}>Access Denied</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const pastRequests = requests.filter(r => r.status !== 'PENDING');

  return (
    <div className="animate-fade-in" style={{ padding: '2rem 0', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', background: 'linear-gradient(to right, #f87171, #facc15)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Admin Dashboard
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Manage Hub requests and platform moderation.</p>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Pending Hub Requests ({pendingRequests.length})</h2>
        
        {pendingRequests.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No pending requests.</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {pendingRequests.map(req => (
              <div key={req.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--accent-primary)', marginBottom: '0.25rem' }}>{req.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>{req.description}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Requested by {req.user.username} on {new Date(req.createdAt).toLocaleDateString()}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={() => handleAction(req.id, 'APPROVE')} className="btn btn-primary" style={{ backgroundColor: 'var(--accent-success)' }}>
                    Approve
                  </button>
                  <button onClick={() => handleAction(req.id, 'REJECT')} className="btn btn-secondary" style={{ color: 'var(--accent-danger)', borderColor: 'var(--accent-danger)' }}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Recent Decisions</h2>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {pastRequests.slice(0, 10).map(req => (
            <div key={req.id} className="glass-panel" style={{ padding: '1rem', opacity: 0.7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 500 }}>{req.name}</span>
                <span style={{ 
                  color: req.status === 'APPROVED' ? 'var(--accent-success)' : 'var(--accent-danger)',
                  fontSize: '0.85rem', fontWeight: 600
                }}>
                  {req.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
