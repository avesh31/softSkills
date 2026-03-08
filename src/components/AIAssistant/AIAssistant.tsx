"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Message {
  role: 'user' | 'ai';
  content: string;
  type?: string;
}

interface SimilarDoubt {
  id: string;
  title: string;
}

interface Resource {
  title: string;
  url: string;
}

export default function AIAssistant({ doubtId, autoOpen = false }: { doubtId: string, autoOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: "Hi! I'm your learning companion. I can help you understand the concepts behind this doubt. What would you like to explore?", type: 'general' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [similarDoubts, setSimilarDoubts] = useState<SimilarDoubt[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'similar' | 'resources'>('chat');
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSimilar();
      fetchResources();
    }
  }, [isOpen, doubtId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchSimilar = async () => {
    try {
      const res = await fetch(`/api/doubts/${doubtId}/ai/similar`);
      const data = await res.json();
      if (data.similar) setSimilarDoubts(data.similar);
    } catch (e) { console.error(e); }

  };

  const fetchResources = async () => {
    try {
      const res = await fetch(`/api/doubts/${doubtId}/ai/resources`);
      const data = await res.json();
      if (data.resources) setResources(data.resources);
    } catch (e) { console.error(e); }

  };

  const handleSendMessage = async (msg?: string) => {
    const text = msg || input;
    if (!text.trim()) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`/api/doubts/${doubtId}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (data.answer) {
        setMessages(prev => [...prev, { role: 'ai', content: data.answer, type: data.type }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="btn btn-primary pulse-success"
        style={{ 
          position: 'fixed', 
          bottom: '2rem', 
          right: '2rem', 
          zIndex: 100,
          borderRadius: 'var(--radius-full)',
          padding: '1rem 1.5rem',
          boxShadow: '0 10px 25px rgba(99, 102, 241, 0.5)',
          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
        }}
      >
        <span>🤖</span> Ask AI Assistant
      </button>
    );
  }

  return (
    <div 
      className="glass-panel animate-fade-in"
      style={{ 
        position: 'fixed', 
        bottom: '2rem', 
        right: '2rem', 
        width: '400px', 
        height: '600px', 
        zIndex: 100, 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid rgba(168, 85, 247, 0.3)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
      }}
    >
      {/* Header */}
      <div 
        style={{ 
          padding: '1rem 1.5rem', 
          background: 'linear-gradient(to right, rgba(99, 102, 241, 0.1), rgba(236, 72, 153, 0.1))',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🤖</span>
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem' }}>AI Assistant</h4>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }}></span> Online
            </div>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} style={{ color: 'var(--text-muted)', fontSize: '1.25rem' }}>×</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.1)' }}>
        {(['chat', 'similar', 'resources'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ 
              flex: 1, 
              padding: '0.75rem', 
              fontSize: '0.8rem', 
              color: activeTab === tab ? 'var(--accent-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === tab ? '2px solid var(--accent-primary)' : 'none',
              textTransform: 'capitalize',
              fontWeight: activeTab === tab ? 600 : 400,
              transition: 'all 0.2s'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }} className="custom-scrollbar">
        {activeTab === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map((m, i) => (
              <div 
                key={i} 
                style={{ 
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: m.role === 'user' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  position: 'relative',
                  border: m.role === 'ai' ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  color: m.role === 'user' ? 'white' : 'var(--text-primary)'
                }}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '0.8rem' }}>AI is thinking...</div>
            )}
            <div ref={chatEndRef} />

            {/* Quick Actions */}
            {messages.length === 1 && !loading && (
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>How can I help you?</p>
                <button 
                  onClick={() => handleSendMessage("Can you explain the concept behind this doubt?")}
                  className="btn btn-secondary" style={{ padding: '0.5rem', fontSize: '0.8rem', justifyContent: 'flex-start' }}
                >
                  💡 Explain the concept
                </button>
                <button 
                  onClick={() => handleSendMessage("Give me a step-by-step guidance.")}
                  className="btn btn-secondary" style={{ padding: '0.5rem', fontSize: '0.8rem', justifyContent: 'flex-start' }}
                >
                  📝 Step-by-step guidance
                </button>
                <button 
                  onClick={() => handleSendMessage("Give me some practice questions.")}
                  className="btn btn-secondary" style={{ padding: '0.5rem', fontSize: '0.8rem', justifyContent: 'flex-start' }}
                >
                  🎯 Practice questions
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'similar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Found these similar discussions:</p>
            {similarDoubts.length > 0 ? (
              similarDoubts.map(d => (
                <Link 
                  key={d.id} 
                  href={`/doubt/${d.id}`}
                  className="glass-panel"
                  style={{ padding: '1rem', fontSize: '0.9rem', display: 'block', transition: 'transform 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
                >
                  {d.title}
                </Link>
              ))
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No similar doubts found.</p>
            )}
          </div>
        )}

        {activeTab === 'resources' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Recommended learning materials:</p>
            {resources.length > 0 ? (
              resources.map((r, i) => (
                <a 
                  key={i} 
                  href={r.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="glass-panel"
                  style={{ padding: '1rem', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>{r.title}</span>
                  <span style={{ color: 'var(--accent-primary)' }}>↗</span>
                </a>
              ))
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No specific resources recommended.</p>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      {activeTab === 'chat' && (
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.1)' }}>
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            style={{ display: 'flex', gap: '0.5rem' }}
          >
            <input 
              type="text" 
              className="input" 
              placeholder="Ask anything..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)' }}
              disabled={loading}
            />
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '45px', height: '45px', padding: 0, borderRadius: 'var(--radius-md)' }}
              disabled={loading}
            >
              →
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
