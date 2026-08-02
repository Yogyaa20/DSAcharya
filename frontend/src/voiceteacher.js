import React, { useState, useEffect, useRef } from 'react';
import Vapi from "@vapi-ai/web";

// ── Vapi instance (singleton) ──────────────────────────────────────────────
const vapiInstance = new Vapi('0f62e0e2-6c98-4bc0-bcda-1eba72fff361');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are DSA Teacher - an expert Data Structures & Algorithms tutor.
STRICT RULES:
- Keep ALL responses under 4 lines max
- Be direct and point-to-point, no fluff
- Use simple language, no unnecessary words
- For code: give only the key snippet, no full programs unless asked
- Format: answer first, explanation if needed in 1 line
- Never repeat what the user said
- Never say "Great question!" or similar filler phrases`;

// ── Sample notes pulled from localStorage roadmap data ─────────────────────
function getPersonalizedNotes() {
  try {
    const user = JSON.parse(localStorage.getItem('dsa_forge_user') || '{}');
    const roadmaps = JSON.parse(localStorage.getItem(`roadmaps_${user.id}`) || '[]');
    if (roadmaps.length === 0) return null;
    return roadmaps[roadmaps.length - 1]; // latest roadmap
  } catch { return null; }
}

// ── Styles ─────────────────────────────────────────────────────────────────
const S = {
  overlay: {
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 99999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(6px)',
    animation: 'fadeIn 0.25s ease',
  },
  modal: {
    backgroundColor: '#13131f',
    borderRadius: '24px',
    width: '92vw',
    maxWidth: '1000px',
    height: '85vh',
    display: 'flex',
    flexDirection: 'row',
    boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
    border: '1px solid rgba(99,102,241,0.25)',
    overflow: 'hidden',
    animation: 'scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
  },
  // ── LEFT SIDEBAR ──
  sidebar: {
    width: '280px',
    minWidth: '280px',
    backgroundColor: '#0e0e1a',
    borderRight: '1px solid rgba(99,102,241,0.2)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  sidebarHeader: {
    padding: '20px 18px 14px',
    borderBottom: '1px solid rgba(99,102,241,0.15)',
    background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))',
  },
  sidebarTitle: {
    color: '#c4b5fd',
    fontWeight: 700,
    fontSize: '13px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  sidebarContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '14px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  noteCard: {
    backgroundColor: 'rgba(99,102,241,0.08)',
    border: '1px solid rgba(99,102,241,0.2)',
    borderRadius: '12px',
    padding: '12px 14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  noteCardActive: {
    backgroundColor: 'rgba(99,102,241,0.2)',
    border: '1px solid rgba(99,102,241,0.5)',
    borderRadius: '12px',
    padding: '12px 14px',
    cursor: 'pointer',
  },
  noteTag: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '20px',
    fontSize: '10px',
    fontWeight: 700,
    marginBottom: '6px',
    textTransform: 'uppercase',
  },
  noteTitle: {
    color: '#e2e8f0',
    fontSize: '13px',
    fontWeight: 600,
    lineHeight: '1.4',
  },
  noteSubtitle: {
    color: '#64748b',
    fontSize: '11px',
    marginTop: '4px',
  },
  // ── RIGHT MAIN PANEL ──
  mainPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    padding: '16px 22px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  tabBar: {
    display: 'flex',
    gap: '0',
    backgroundColor: '#1a1a2e',
    borderBottom: '1px solid rgba(99,102,241,0.2)',
    flexShrink: 0,
  },
  tab: (active) => ({
    flex: 1,
    padding: '13px',
    border: 'none',
    backgroundColor: active ? 'rgba(99,102,241,0.15)' : 'transparent',
    color: active ? '#a5b4fc' : '#64748b',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: active ? 700 : 500,
    borderBottom: active ? '2px solid #6366f1' : '2px solid transparent',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  }),
};

// ── Topics for notes sidebar (fallback if no roadmap) ───────────────────────
const DEFAULT_TOPICS = [
  { id: 1, title: 'Arrays & Strings', tag: 'Easy', color: '#22c55e', desc: '2 pointers, sliding window', icon: '📦' },
  { id: 2, title: 'Linked Lists', tag: 'Easy', color: '#22c55e', desc: 'Fast/slow pointer tricks', icon: '🔗' },
  { id: 3, title: 'Binary Search', tag: 'Medium', color: '#f59e0b', desc: 'Search space reduction', icon: '🔍' },
  { id: 4, title: 'Trees & BST', tag: 'Medium', color: '#f59e0b', desc: 'DFS, BFS, traversals', icon: '🌳' },
  { id: 5, title: 'Dynamic Programming', tag: 'Hard', color: '#ef4444', desc: 'Memoization, tabulation', icon: '⚡' },
  { id: 6, title: 'Graphs', tag: 'Hard', color: '#ef4444', desc: 'Dijkstra, Union-Find', icon: '🕸️' },
  { id: 7, title: 'Stacks & Queues', tag: 'Easy', color: '#22c55e', desc: 'Monotonic stack patterns', icon: '📚' },
  { id: 8, title: 'Heaps', tag: 'Medium', color: '#f59e0b', desc: 'Priority queue, top-K', icon: '🏔️' },
];

// ── Main Component ─────────────────────────────────────────────────────────
const VoiceTeacher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMode, setActiveMode] = useState('voice'); // 'voice' | 'chat'
  const [isCalling, setIsCalling] = useState(false);
  const [isVapiSpeaking, setIsVapiSpeaking] = useState(false);
  const [vapiConnecting, setVapiConnecting] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeNote, setActiveNote] = useState(null);
  const [vapiError, setVapiError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const assistantId = '1ef3572e-7152-4cc1-8a5d-183f2739ba77';

  // ── Vapi event listeners ──
  useEffect(() => {
    const onStart = () => {
      setIsCalling(true);
      setVapiConnecting(false);
      setVapiError(null);
    };
    const onEnd = () => {
      setIsCalling(false);
      setIsVapiSpeaking(false);
      setVapiConnecting(false);
    };
    const onSpeechStart = () => setIsVapiSpeaking(true);
    const onSpeechEnd = () => setIsVapiSpeaking(false);
    const onError = (e) => {
      console.error('Vapi Error:', e);
      setIsCalling(false);
      setIsVapiSpeaking(false);
      setVapiConnecting(false);
      setVapiError('Voice connection failed. Try again.');
    };

    vapiInstance.on('call-start', onStart);
    vapiInstance.on('call-end', onEnd);
    vapiInstance.on('speech-start', onSpeechStart);
    vapiInstance.on('speech-end', onSpeechEnd);
    vapiInstance.on('error', onError);

    return () => {
      vapiInstance.off('call-start', onStart);
      vapiInstance.off('call-end', onEnd);
      vapiInstance.off('speech-start', onSpeechStart);
      vapiInstance.off('speech-end', onSpeechEnd);
      vapiInstance.off('error', onError);
    };
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when switching to chat
  useEffect(() => {
    if (activeMode === 'chat' && isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [activeMode, isOpen]);

  // Stop call when closing
  const handleClose = () => {
    if (isCalling) vapiInstance.stop();
    setIsOpen(false);
    setIsCalling(false);
    setVapiConnecting(false);
    setVapiError(null);
  };

  // ── Voice controls ──
  const startCall = async () => {
    setVapiError(null);
    setVapiConnecting(true);
    try {
      await vapiInstance.start(assistantId);
    } catch (e) {
      setVapiConnecting(false);
      setVapiError('Mic permission denied ya connection fail. Check mic permissions.');
    }
  };

  const stopCall = () => {
    vapiInstance.stop();
  };

  // ── Chat send ──
  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    const userMsg = { role: 'user', content: inputText.trim() };

    // Inject active note context if selected
    const contextNote = activeNote
      ? `\n[User is currently studying: "${activeNote.title}" - ${activeNote.desc}. Relate your answer to this topic if relevant.]`
      : '';

    const allMsgs = [...messages, userMsg];
    setMessages(allMsgs);
    setInputText('');
    setIsLoading(true);

    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputText.trim(),
          conversation_history: [
            { role: 'system', content: SYSTEM_PROMPT + contextNote },
            ...messages
          ]
        }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const reply = data.reply || 'Error getting response.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Network error. Try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── Notes topics ──
  const topics = DEFAULT_TOPICS; // Can be replaced with roadmap data

  // ── Voice Status Text ──
  const voiceStatus = () => {
    if (vapiConnecting) return { text: '⏳ Connect ho raha hai...', color: '#f59e0b' };
    if (isCalling && isVapiSpeaking) return { text: '🔊 Teacher bol raha hai', color: '#6366f1' };
    if (isCalling) return { text: '🎙️ Bol, sun raha hoon', color: '#22c55e' };
    return { text: 'Voice AI Teacher', color: '#a0a0b0' };
  };

  const vs = voiceStatus();

  return (
    <>
      {/* ── Floating Trigger Button ── */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed', bottom: '28px', left: '28px',
          padding: '13px 22px',
          background: isCalling
            ? 'linear-gradient(135deg, #ef4444, #dc2626)'
            : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: 'white', borderRadius: '50px', zIndex: 99998,
          border: 'none', cursor: 'pointer', fontWeight: 700,
          boxShadow: isCalling
            ? '0 8px 30px rgba(239,68,68,0.5)'
            : '0 8px 30px rgba(99,102,241,0.45)',
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '14px', transition: 'all 0.25s ease',
          letterSpacing: '0.01em',
        }}
      >
        <span style={{ fontSize: '16px' }}>{isCalling ? '🔴' : '🎙️'}</span>
        {isCalling ? 'Call Chal Rahi...' : 'DSA Teacher'}
        {isCalling && (
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            backgroundColor: '#fff', animation: 'blink 1s ease infinite',
            display: 'inline-block',
          }} />
        )}
      </button>

      {/* ── Full Page Modal ── */}
      {isOpen && (
        <div style={S.overlay} onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
          <div style={S.modal}>

            {/* ═══ LEFT SIDEBAR: NOTES ═══════════════════════════════════════ */}
            <div style={S.sidebar}>
              <div style={S.sidebarHeader}>
                <div style={S.sidebarTitle}>
                  <span>📝</span> Meri Notes
                </div>
                <div style={{ color: '#64748b', fontSize: '11px', marginTop: '4px' }}>
                  Topic select karke padho
                </div>
              </div>

              <div style={S.sidebarContent}>
                {/* Ask AI about note button */}
                {activeNote && (
                  <div style={{
                    backgroundColor: 'rgba(99,102,241,0.12)',
                    border: '1px solid rgba(99,102,241,0.35)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    marginBottom: '4px',
                  }}>
                    <div style={{ color: '#a5b4fc', fontSize: '11px', fontWeight: 600, marginBottom: '6px' }}>
                      ✨ Selected Topic
                    </div>
                    <div style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 600 }}>{activeNote.title}</div>
                    <button
                      onClick={() => {
                        setActiveMode('chat');
                        setInputText(`${activeNote.title} ke baare mein explain karo`);
                        setTimeout(() => inputRef.current?.focus(), 150);
                      }}
                      style={{
                        marginTop: '8px', width: '100%',
                        padding: '6px', backgroundColor: '#6366f1',
                        border: 'none', borderRadius: '8px',
                        color: 'white', fontSize: '11px',
                        cursor: 'pointer', fontWeight: 600,
                      }}
                    >
                      💬 Is topic pe AI se pooch
                    </button>
                  </div>
                )}

                {/* Topic Cards */}
                {topics.map(topic => (
                  <div
                    key={topic.id}
                    onClick={() => setActiveNote(activeNote?.id === topic.id ? null : topic)}
                    style={activeNote?.id === topic.id ? S.noteCardActive : S.noteCard}
                    onMouseOver={e => {
                      if (activeNote?.id !== topic.id) {
                        e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.14)';
                      }
                    }}
                    onMouseOut={e => {
                      if (activeNote?.id !== topic.id) {
                        e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.08)';
                      }
                    }}
                  >
                    <span style={{
                      ...S.noteTag,
                      backgroundColor: topic.color + '22',
                      color: topic.color,
                    }}>{topic.tag}</span>
                    <div style={S.noteTitle}>{topic.icon} {topic.title}</div>
                    <div style={S.noteSubtitle}>{topic.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ═══ RIGHT MAIN PANEL ══════════════════════════════════════════ */}
            <div style={S.mainPanel}>

              {/* Header */}
              <div style={S.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px', height: '40px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px',
                  }}>🤖</div>
                  <div>
                    <div style={{ color: 'white', fontWeight: 700, fontSize: '16px' }}>DSA AI Teacher</div>
                    <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px' }}>
                      {activeMode === 'voice' ? vs.text : '💬 Text Chat Mode'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  style={{
                    background: 'rgba(255,255,255,0.2)', border: 'none',
                    color: 'white', width: '34px', height: '34px',
                    borderRadius: '50%', cursor: 'pointer', fontSize: '16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.35)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                >✕</button>
              </div>

              {/* Tab Bar */}
              <div style={S.tabBar}>
                <button style={S.tab(activeMode === 'voice')} onClick={() => setActiveMode('voice')}>
                  🎙️ Voice AI
                  {isCalling && (
                    <span style={{
                      width: '7px', height: '7px', borderRadius: '50%',
                      backgroundColor: '#22c55e', animation: 'blink 1s infinite',
                      display: 'inline-block',
                    }} />
                  )}
                </button>
                <button style={S.tab(activeMode === 'chat')} onClick={() => setActiveMode('chat')}>
                  💬 Chat AI
                  {messages.length > 0 && (
                    <span style={{
                      backgroundColor: '#6366f1', color: 'white',
                      borderRadius: '50%', width: '18px', height: '18px',
                      fontSize: '10px', display: 'inline-flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700,
                    }}>{messages.filter(m => m.role === 'user').length}</span>
                  )}
                </button>
              </div>

              {/* ── VOICE MODE ── */}
              {activeMode === 'voice' && (
                <div style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  padding: '40px 30px', gap: '28px',
                  background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.06) 0%, transparent 70%)',
                }}>
                  {/* Animated orb */}
                  <div style={{ position: 'relative', width: '130px', height: '130px' }}>
                    {(isCalling || vapiConnecting) && (
                      <>
                        <div style={{
                          position: 'absolute', inset: '-18px', borderRadius: '50%',
                          border: `2px solid ${isVapiSpeaking ? 'rgba(99,102,241,0.5)' : 'rgba(34,197,94,0.4)'}`,
                          animation: 'ripple 2s ease-out infinite',
                        }} />
                        <div style={{
                          position: 'absolute', inset: '-36px', borderRadius: '50%',
                          border: `2px solid ${isVapiSpeaking ? 'rgba(99,102,241,0.25)' : 'rgba(34,197,94,0.2)'}`,
                          animation: 'ripple 2s ease-out infinite 0.4s',
                        }} />
                        <div style={{
                          position: 'absolute', inset: '-54px', borderRadius: '50%',
                          border: `1px solid ${isVapiSpeaking ? 'rgba(99,102,241,0.1)' : 'rgba(34,197,94,0.1)'}`,
                          animation: 'ripple 2s ease-out infinite 0.8s',
                        }} />
                      </>
                    )}
                    <div style={{
                      width: '130px', height: '130px', borderRadius: '50%',
                      background: isCalling
                        ? (isVapiSpeaking
                          ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                          : 'linear-gradient(135deg, #22c55e, #16a34a)')
                        : vapiConnecting
                          ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                          : 'linear-gradient(135deg, #374151, #1f2937)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '50px', transition: 'all 0.4s ease',
                      boxShadow: isCalling
                        ? (isVapiSpeaking
                          ? '0 0 40px rgba(99,102,241,0.5)'
                          : '0 0 40px rgba(34,197,94,0.4)')
                        : 'none',
                    }}>
                      {vapiConnecting ? '⏳' : isCalling ? (isVapiSpeaking ? '🔊' : '🎙️') : '🎙️'}
                    </div>
                  </div>

                  {/* Status */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: vs.color, fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                      {vapiConnecting ? 'Connect ho raha hai...' :
                        isCalling ? (isVapiSpeaking ? 'Teacher Bol Raha Hai' : 'Sun Raha Hoon') :
                          'Voice Teacher Ready'}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '13px' }}>
                      {isCalling
                        ? 'DSA ka koi bhi sawaal pooch, seedha bolke'
                        : 'Start call karo aur DSA ke baare mein baat karo'}
                    </div>
                  </div>

                  {/* Error message */}
                  {vapiError && (
                    <div style={{
                      backgroundColor: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: '12px', padding: '12px 16px',
                      color: '#fca5a5', fontSize: '13px', textAlign: 'center',
                      maxWidth: '320px',
                    }}>
                      ⚠️ {vapiError}
                    </div>
                  )}

                  {/* Active note hint */}
                  {activeNote && (
                    <div style={{
                      backgroundColor: 'rgba(99,102,241,0.1)',
                      border: '1px solid rgba(99,102,241,0.25)',
                      borderRadius: '12px', padding: '10px 16px',
                      color: '#a5b4fc', fontSize: '12px',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                      <span>📝</span>
                      <span>Current topic: <strong>{activeNote.title}</strong></span>
                    </div>
                  )}

                  {/* Call Button */}
                  {!isCalling && !vapiConnecting ? (
                    <button
                      onClick={startCall}
                      style={{
                        padding: '15px 48px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        border: 'none', borderRadius: '50px', color: 'white',
                        cursor: 'pointer', fontWeight: 700, fontSize: '16px',
                        boxShadow: '0 8px 25px rgba(99,102,241,0.45)',
                        transition: 'all 0.2s', letterSpacing: '0.02em',
                      }}
                      onMouseOver={e => e.currentTarget.style.transform = 'scale(1.04)'}
                      onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      🎙️ Call Shuru Karo
                    </button>
                  ) : (
                    <button
                      onClick={stopCall}
                      disabled={vapiConnecting}
                      style={{
                        padding: '14px 44px',
                        background: vapiConnecting
                          ? 'linear-gradient(135deg, #6b7280, #4b5563)'
                          : 'linear-gradient(135deg, #ef4444, #dc2626)',
                        border: 'none', borderRadius: '50px', color: 'white',
                        cursor: vapiConnecting ? 'not-allowed' : 'pointer',
                        fontWeight: 700, fontSize: '15px', opacity: vapiConnecting ? 0.7 : 1,
                        boxShadow: '0 8px 25px rgba(239,68,68,0.4)',
                        transition: 'all 0.2s',
                      }}
                    >
                      🛑 Call Khatam Karo
                    </button>
                  )}

                  {/* Tip */}
                  <div style={{ color: '#374151', fontSize: '11px', textAlign: 'center' }}>
                    💡 Tip: Left sidebar se topic select karke voice call mein padh sakte ho
                  </div>
                </div>
              )}

              {/* ── CHAT MODE ── */}
              {activeMode === 'chat' && (
                <>
                  {/* Active note banner */}
                  {activeNote && (
                    <div style={{
                      padding: '8px 16px', flexShrink: 0,
                      backgroundColor: 'rgba(99,102,241,0.08)',
                      borderBottom: '1px solid rgba(99,102,241,0.15)',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                      <span style={{ fontSize: '12px' }}>📝</span>
                      <span style={{ color: '#a5b4fc', fontSize: '12px' }}>
                        Context: <strong>{activeNote.title}</strong> — answers is topic ke context mein honge
                      </span>
                      <button
                        onClick={() => setActiveNote(null)}
                        style={{
                          marginLeft: 'auto', background: 'none', border: 'none',
                          color: '#64748b', cursor: 'pointer', fontSize: '12px',
                        }}
                      >✕ Remove</button>
                    </div>
                  )}

                  {/* Messages */}
                  <div style={{
                    flex: 1, overflowY: 'auto', padding: '18px 20px',
                    display: 'flex', flexDirection: 'column', gap: '12px',
                  }}>
                    {messages.length === 0 && (
                      <div style={{
                        flex: 1, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        color: '#4b5563', textAlign: 'center', padding: '40px',
                      }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                        <div style={{ fontSize: '16px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>
                          DSA ke baare mein kuch bhi pooch!
                        </div>
                        <div style={{ fontSize: '13px', color: '#4b5563' }}>
                          Arrays, Trees, DP, Graphs, Sorting — sab kuch
                        </div>
                        <div style={{
                          display: 'flex', flexWrap: 'wrap', gap: '8px',
                          justifyContent: 'center', marginTop: '20px',
                        }}>
                          {['Two Sum kaise solve karein?', 'BFS vs DFS difference', 'DP memoization explain karo'].map(q => (
                            <button
                              key={q}
                              onClick={() => setInputText(q)}
                              style={{
                                padding: '8px 14px',
                                backgroundColor: 'rgba(99,102,241,0.1)',
                                border: '1px solid rgba(99,102,241,0.25)',
                                borderRadius: '20px', color: '#a5b4fc',
                                cursor: 'pointer', fontSize: '12px',
                                transition: 'all 0.2s',
                              }}
                            >{q}</button>
                          ))}
                        </div>
                      </div>
                    )}

                    {messages.map((msg, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      }}>
                        {msg.role === 'assistant' && (
                          <div style={{
                            width: '28px', height: '28px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '13px', marginRight: '8px', flexShrink: 0, alignSelf: 'flex-end',
                          }}>🤖</div>
                        )}
                        <div style={{
                          maxWidth: '72%',
                          padding: '11px 16px',
                          borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          background: msg.role === 'user'
                            ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                            : '#1e1e35',
                          color: 'white', fontSize: '14px',
                          lineHeight: '1.6', whiteSpace: 'pre-wrap',
                          border: msg.role === 'assistant' ? '1px solid rgba(99,102,241,0.2)' : 'none',
                        }}>{msg.content}</div>
                      </div>
                    ))}

                    {isLoading && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px',
                        }}>🤖</div>
                        <div style={{
                          padding: '12px 16px', backgroundColor: '#1e1e35',
                          borderRadius: '18px 18px 18px 4px',
                          border: '1px solid rgba(99,102,241,0.2)',
                          display: 'flex', gap: '5px', alignItems: 'center',
                        }}>
                          {[0, 0.2, 0.4].map((d, i) => (
                            <div key={i} style={{
                              width: '7px', height: '7px', borderRadius: '50%',
                              backgroundColor: '#6366f1',
                              animation: `bounce 1s ease infinite ${d}s`,
                            }} />
                          ))}
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div style={{
                    padding: '14px 18px',
                    borderTop: '1px solid rgba(99,102,241,0.15)',
                    display: 'flex', gap: '10px', alignItems: 'flex-end',
                    backgroundColor: '#0e0e1a', flexShrink: 0,
                  }}>
                    <textarea
                      ref={inputRef}
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="DSA sawaal likhо... (Enter to send, Shift+Enter for newline)"
                      rows={1}
                      style={{
                        flex: 1, padding: '12px 16px',
                        backgroundColor: '#1a1a2e',
                        border: '1px solid rgba(99,102,241,0.3)',
                        borderRadius: '16px', color: 'white',
                        fontSize: '14px', outline: 'none',
                        resize: 'none', lineHeight: '1.5',
                        maxHeight: '100px', overflowY: 'auto',
                        fontFamily: 'inherit',
                      }}
                      onInput={e => {
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                      }}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={isLoading || !inputText.trim()}
                      style={{
                        width: '44px', height: '44px', flexShrink: 0,
                        background: inputText.trim()
                          ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                          : '#1e1e35',
                        border: 'none', borderRadius: '14px', color: 'white',
                        cursor: inputText.trim() ? 'pointer' : 'default',
                        fontSize: '18px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                        boxShadow: inputText.trim() ? '0 4px 15px rgba(99,102,241,0.4)' : 'none',
                      }}
                    >➤</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Global Animations ── */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes ripple {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; } 50% { opacity: 0.3; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 4px; }
      `}</style>
    </>
  );
};

export default VoiceTeacher;