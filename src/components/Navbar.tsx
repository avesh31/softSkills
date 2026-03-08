"use client";

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar() {
  const { user, logout, isLoading } = useAuth();

  return (
    <nav className="glass-header w-full" style={{ position: 'sticky', top: 0, zIndex: 100, padding: '1rem 0' }}>
      <div className="container flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px', 
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
          }}>
            D
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.025em' }}>
            Doubt<span style={{ color: 'var(--accent-primary)' }}>Hub</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/leaderboard" style={{ fontWeight: 500, color: 'var(--text-secondary)' }} className="hover:text-white transition-colors">
            Leaderboard
          </Link>
          <Link href="/chat" style={{ fontWeight: 500, color: 'var(--text-secondary)' }} className="hover:text-white transition-colors">
            Chat Lounge
          </Link>
          <Link href="/ask">
            <button className="btn btn-primary">Ask a Doubt</button>
          </Link>
          
          {!isLoading && (
            <>
              {user ? (
                <div className="flex items-center gap-4">
                  <Link href="/bookmarks" style={{ fontWeight: 500, color: 'var(--text-secondary)' }} className="hover:text-white">Bookmarks</Link>
                  <NotificationDropdown />
                  <Link href={`/profile/${user.id}`} className="flex items-center gap-2" style={{ fontWeight: 500 }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    {user.username}
                  </Link>
                  <button onClick={logout} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <Link href="/login" style={{ fontWeight: 500 }}>Login</Link>
                  <Link href="/register" className="btn btn-secondary">Sign Up</Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
