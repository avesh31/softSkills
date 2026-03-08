"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications', { method: 'POST' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
        aria-label="Notifications"
      >
        <span style={{ fontSize: '1.25rem' }}>🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-accent-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-[#1a1d24]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-3 w-64 bg-[#1a1d24] border border-white/10 overflow-hidden z-50 animate-fade-in shadow-2xl"
          style={{ 
            borderRadius: '10px', 
            boxShadow: '0 6px 20px rgba(0,0,0,0.2)' 
          }}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[10px] text-accent-primary hover:underline font-bold uppercase tracking-wider"
              >
                Mark all
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-[300px] overflow-y-auto border-b border-white/5">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-text-muted font-medium">
                No notifications yet
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((n) => (
                  <Link 
                    key={n.id} 
                    href={n.link || '#'} 
                    onClick={() => {
                      if (!n.isRead) markAsRead(n.id);
                      setIsOpen(false);
                    }}
                    className={`block px-5 py-4 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors ${!n.isRead ? 'bg-white/[0.02]' : ''}`}
                  >
                    <p className={`text-xs ${!n.isRead ? 'text-white' : 'text-text-secondary'}`}>
                      {n.message}
                    </p>
                    <p className="text-[9px] text-text-muted mt-1.5 font-medium uppercase tracking-tighter">
                      {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <Link 
            href="/notifications" 
            className="block text-center py-3.5 hover:bg-white/5 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <span className="text-[11px] font-bold text-text-secondary hover:text-white transition-colors">
              See all notifications
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
