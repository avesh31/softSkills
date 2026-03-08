"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    avatar: string | null;
  };
}

const GUIDELINES = [
  "Maintain respect and professional tone",
  "No offensive content or toxic behavior",
  "Refrain from spamming or flooding",
  "Protect your privacy at all times",
  "Collaborate and help fellow students",
  "Keep discussions relevant to the room"
];

export default function ChatRoom({ hubId }: { hubId?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasAcceptedGuidelines, setHasAcceptedGuidelines] = useState(false);
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const accepted = localStorage.getItem('doubtHubChatGuidelinesAccepted_v6') === 'true';
      setHasAcceptedGuidelines(accepted);
    } catch (e) {
      console.warn("LocalStorage access failed:", e);
    }
  }, []);

  const fetchMessages = async (isForced = false) => {
    let isAccepted = hasAcceptedGuidelines;
    if (!isAccepted && !isForced) {
        try {
            isAccepted = localStorage.getItem('doubtHubChatGuidelinesAccepted_v6') === 'true';
        } catch (e) {}
    }

    if (!isAccepted && !isForced) {
      setLoading(false);
      return;
    }

    try {
      const url = `/api/chat${hubId ? `?hubId=${hubId}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
      setLoading(false);
    } catch (e) {
      console.error("Fetch Messages Error:", e);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAcceptedGuidelines) {
      fetchMessages();
      const interval = setInterval(() => fetchMessages(), 5000); 
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [hubId, hasAcceptedGuidelines]);

  useEffect(() => {
    if (scrollRef.current && hasAcceptedGuidelines) {
      setTimeout(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);
    }
  }, [messages, hasAcceptedGuidelines]);

  const handleAccept = () => {
    if (!checkboxChecked) return;
    
    try {
      localStorage.setItem('doubtHubChatGuidelinesAccepted_v6', 'true');
      setHasAcceptedGuidelines(true);
      // Immediate fetch after acceptance for "instant" feel
      fetchMessages(true);
    } catch (e) {
      setHasAcceptedGuidelines(true);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !user || sending) return;

    const tempId = 'temp-' + Date.now();
    const optimisticMsg: Message = {
      id: tempId,
      content: inputValue,
      createdAt: new Date().toISOString(),
      author: {
        id: (user as any).id || (user as any).userId || '',
        username: user.username,
        avatar: (user as any).avatar || null
      }
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setInputValue('');
    setSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: inputValue, hubId })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => prev.map(m => m.id === tempId ? data.message : m));
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempId));
      }
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    const previousMessages = [...messages];
    setMessages(prev => prev.filter(m => m.id !== messageId));

    try {
      const res = await fetch(`/api/chat?id=${messageId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) {
        setMessages(previousMessages);
        alert("Failed to delete message: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      setMessages(previousMessages);
      alert("An error occurred while deleting the message.");
    }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-[#08080a]">
      <div className="w-12 h-12 border-4 border-white/5 border-t-accent-primary rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#050507] text-white">
      {/* 🏙️ IMMERSIVE APP HEADER - Conditional visibility */}
      {hasAcceptedGuidelines && (
        <header 
          className="h-[80px] border-b border-white/5 flex items-center justify-between px-10 bg-[#08080a] backdrop-blur-xl sticky top-0 z-50 shrink-0"
        >
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-primary to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-accent-primary/20 text-xl font-black">
              {hubId ? 'S' : 'G'}
            </div>
            <div>
              <h1 className="font-black text-lg tracking-tight leading-none mb-1">
                {hubId ? 'Subject Channel' : 'Global Community'}
              </h1>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent-success animate-pulse"></div>
                <p className="text-[10px] text-accent-success font-black tracking-widest uppercase mt-0.5">Live Lounge Active</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-1">Session Protocol</span>
              <span className="text-xs font-bold text-white/40">Encrypted • P2P Analytics</span>
            </div>
            <div className="h-8 w-[1px] bg-white/5 mx-2"></div>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[#050507] bg-white/10 flex items-center justify-center text-[10px] font-bold">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  <span className="text-[10px] text-white/80 font-black uppercase tracking-widest">24 Members</span>
              </div>
            </div>
          </div>
        </header>
      )}

      {!hasAcceptedGuidelines ? (
        /* ⚖️ PREMIER AUTHORIZATION INTERFACE */
        <div className="lounge-auth-container animate-scale-in">
          {/* Background visuals that won't overlap */}
          <div className="lounge-bg-glow">
            <div className="lounge-glow-top"></div>
            <div className="lounge-glow-bottom"></div>
          </div>

          <div className="lounge-auth-card">
            <div className="text-center" style={{ marginBottom: '3rem' }}>
              <div className="lounge-icon-wrapper">
                ⚖️
              </div>
              <h2 className="lounge-title">Lounge Access</h2>
              <p className="lounge-subtitle">Security Protocol v6.0</p>
            </div>

            <div style={{ marginBottom: '3rem' }}>
              <div className="lounge-guidelines-box">
                <h3 className="lounge-guidelines-title">Core Guidelines</h3>
                <ul className="lounge-guidelines-list">
                  {GUIDELINES.slice(0, 3).map((g, i) => (
                    <li key={i} className="lounge-guideline-item">
                      <span className="lounge-dot"></span>
                      {g}
                    </li>
                  ))}
                </ul>
              </div>

              <label 
                className={`lounge-checkbox-label ${checkboxChecked ? 'checked' : ''}`}
                htmlFor="final-check"
              >
                <div className={`lounge-checkbox-square ${checkboxChecked ? 'checked' : ''}`}>
                    <input 
                        type="checkbox" 
                        id="final-check"
                        checked={checkboxChecked}
                        onChange={(e) => setCheckboxChecked(e.target.checked)}
                        className="sr-only"
                    />
                    {checkboxChecked && (
                      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                </div>
                <div className="lounge-checkbox-text">
                    <span className="lounge-checkbox-main">I accept the terms</span>
                    <span className="lounge-checkbox-sub">Initialize Connection</span>
                </div>
              </label>

              <button 
                onClick={handleAccept}
                disabled={!checkboxChecked}
                className={`lounge-auth-button ${checkboxChecked ? 'active' : 'disabled'}`}
              >
                <span>Authorize Lounge</span>
                <span style={{ fontSize: '1.5rem', marginTop: '-2px' }}>→</span>
              </button>
            </div>
            
            <p className="lounge-footer-text">
              Secured Connection • P2P Validated • 256-bit Interaction Logs
            </p>
          </div>
        </div>
      ) : (
        /* 💬 STUNNING CHAT ENGINE UI */
        <>
          <div 
            ref={scrollRef} 
            className="flex-1 overflow-y-auto custom-scrollbar px-10 py-12 space-y-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full border-4 border-dashed border-white/5 flex items-center justify-center mb-6 animate-pulse">
                    <span className="text-2xl grayscale">📡</span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 animate-pulse">Establishing Connection...</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMine = user && msg.author.id === user.id;
                const prevMsg = idx > 0 ? messages[idx - 1] : null;
                const isGrouped = prevMsg && prevMsg.author.id === msg.author.id && 
                                  (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()) < 300000;

                return (
                  <div 
                    key={msg.id} 
                    className={`group flex gap-6 max-w-[900px] mx-auto w-full transition-all duration-500 animate-slide-up ${isGrouped ? 'mt-[-32px]' : 'mt-0'}`}
                  >
                    {!isGrouped ? (
                      <div 
                        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1a1b23] to-[#12131a] border border-white/5 flex items-center justify-center font-black text-xl text-accent-primary flex-shrink-0 shadow-2xl relative overflow-hidden"
                      >
                        {msg.author.avatar ? (
                            <img src={msg.author.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                            msg.author.username.charAt(0).toUpperCase()
                        )}
                        <div className="absolute inset-0 bg-accent-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    ) : (
                      <div className="w-14 flex-shrink-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-tighter">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      {!isGrouped && (
                        <div className="flex items-center gap-3 mb-2.5">
                          <span className="font-black text-xs text-white/90 uppercase tracking-wider">{msg.author.username}</span>
                          <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] bg-white/[0.03] px-2 py-0.5 rounded-lg">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMine && (
                            <span className="text-[8px] font-black text-accent-primary/50 uppercase tracking-widest border border-accent-primary/20 px-1.5 py-0.5 rounded-md">Author</span>
                          )}
                        </div>
                      )}
                      
                      <div className="relative group/content max-w-full inline-block">
                        <div 
                            className={`text-[14px] text-slate-200 leading-relaxed font-semibold px-6 py-4 rounded-[24px] shadow-2xl transition-all border ${
                                isMine 
                                ? 'bg-white/[0.04] border-white/[0.07] hover:bg-white/[0.06]' 
                                : 'bg-[#15161c] border-white/[0.03] hover:border-white/10'
                            } ${isGrouped ? 'rounded-tl-lg' : ''}`}
                            style={{ whiteSpace: 'pre-wrap' }}
                        >
                            {msg.content}
                        </div>
                        
                        {/* 🗑️ DELETE ACTION */}
                        {(isMine || (user && (user as any).role === 'ADMIN')) && !msg.id.startsWith('temp-') && (
                            <button 
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="absolute -right-12 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 opacity-0 group-hover/content:opacity-100 transition-all hover:bg-red-500 hover:text-white transform hover:scale-110 shadow-lg"
                                title="Delete Message"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                </svg>
                            </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 🌊 DYNAMIC INPUT PANEL */}
          <div className="p-10 bg-gradient-to-t from-[#050507] via-[#050507] to-transparent">
            <div className="max-w-[900px] mx-auto w-full relative">
              <form onSubmit={handleSendMessage} className="group relative">
                <div className="absolute inset-0 bg-accent-primary/20 blur-3xl opacity-0 group-focus-within:opacity-20 transition-opacity"></div>
                
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Transmit your message to the lounge..."
                  className="w-full bg-[#111218]/80 backdrop-blur-xl border border-white/10 rounded-[32px] px-10 py-7 text-sm focus:outline-none focus:border-accent-primary/40 focus:bg-[#111218] transition-all pr-36 shadow-2xl font-bold placeholder:text-white/10 tracking-tight"
                />
                
                <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-3">
                    <button 
                        type="submit" 
                        disabled={sending || !inputValue.trim()}
                        className={`h-14 px-8 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${
                            inputValue.trim() 
                            ? 'bg-accent-primary text-white shadow-xl shadow-accent-primary/20 hover:scale-105 active:scale-95' 
                            : 'bg-white/5 text-white/10 grayscale'
                        }`}
                    >
                        {sending ? (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span>Send</span>
                                <span className="text-sm">⚡</span>
                            </>
                        )}
                    </button>
                </div>
              </form>
              <div className="mt-4 flex items-center justify-between px-6 opacity-30">
                <p className="text-[9px] font-black uppercase tracking-[0.2em]">Markdown Supported</p>
                <p className="text-[9px] font-black uppercase tracking-[0.2em]">Presence Verified</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
