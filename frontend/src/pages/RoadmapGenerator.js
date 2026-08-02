import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Sparkles, CheckCircle, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const RoadmapGenerator = ({ currentUser, logoutUser }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    skill_level: currentUser?.skill_level || 'beginner',
    goal: 'crack FAANG',
    known_topics: [],
    time_available: '1-2 hours/day',
  });
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(null);

  useEffect(() => {
    if (!currentUser) navigate('/');
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  const topicOptions = [
    'arrays',
    'strings',
    'linked-lists',
    'trees',
    'graphs',
    'dynamic-programming',
    'binary-search',
    'backtracking',
    'greedy',
    'sorting',
    'hashing',
  ];

  const goalOptions = [
    'crack FAANG',
    'ace college placements',
    'competitive programming',
    'general DSA mastery',
  ];

  const timeOptions = [
    '30 minutes/day',
    '1-2 hours/day',
    '2-3 hours/day',
    '3+ hours/day',
  ];

  const toggleTopic = (t) =>
    setFormData((prev) => ({
      ...prev,
      known_topics: prev.known_topics.includes(t)
        ? prev.known_topics.filter((x) => x !== t)
        : [...prev.known_topics, t],
    }));

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/v2/generate-roadmap`, {
        user_id: currentUser.id,
        skill_level: formData.skill_level,
        known_topics: formData.known_topics,
        goal: formData.goal,
        time_available: formData.time_available,
        weak_areas: [],
      });
      toast.success('Roadmap generated!');
      const roadmapId = res.data.roadmap_id || res.data.id;
      if (roadmapId) {
        navigate(`/roadmap/${roadmapId}`);
      } else {
        setGenerated(res.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to generate roadmap');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    background: '#080c12',
    border: '1px solid rgba(48,54,61,0.8)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#e6edf3',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '13px',
    outline: 'none',
    transition: 'border-color 0.2s',
  };
  const selectStyle = { ...inputStyle, cursor: 'pointer' };
  const labelStyle = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    color: '#00ff88',
    letterSpacing: '0.1em',
    display: 'block',
    marginBottom: '8px',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#030508',
        fontFamily: "'Syne', sans-serif",
      }}
    >
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(0,255,136,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.018) 1px,transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar currentUser={currentUser} logoutUser={logoutUser} />

        <div
          style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px' }}
          data-testid="roadmap-generator-container"
        >
          {/* Header */}
          <div
            style={{
              marginBottom: '36px',
              opacity: 0,
              animation: 'fadeIn 0.5s ease forwards',
            }}
          >
            <p
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                color: '#00ff88',
                letterSpacing: '0.15em',
                marginBottom: '8px',
              }}
            >
              // AI_ROADMAP_GENERATOR_V2
            </p>
            <h1
              style={{
                fontSize: 'clamp(28px,4vw,42px)',
                fontWeight: 800,
                color: '#e6edf3',
                letterSpacing: '-0.02em',
              }}
            >
              Generate Your{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg,#00ff88,#00d4ff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                AI Roadmap
              </span>
            </h1>
            <p style={{ color: '#8b949e', marginTop: '8px', fontSize: '14px' }}>
              Personalized DSA learning path powered by Llama 3.3 70B & topic graphs
            </p>
          </div>

          {!generated ? (
            <div
              style={{
                background: '#0d1117',
                border: '1px solid rgba(48,54,61,0.8)',
                borderRadius: '20px',
                padding: '36px',
                opacity: 0,
                animation: 'fadeInUp 0.5s ease forwards 0.2s',
                position: 'relative',
                overflow: 'hidden',
              }}
              data-testid="roadmap-form"
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background:
                    'linear-gradient(90deg,transparent,#00ff88,#00d4ff,transparent)',
                  opacity: 0.5,
                }}
              />

              <form
                onSubmit={handleGenerate}
                style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
              >
                {/* Skill Level */}
                <div>
                  <label style={labelStyle}>$ skill_level</label>
                  <select
                    value={formData.skill_level}
                    onChange={(e) =>
                      setFormData({ ...formData, skill_level: e.target.value })
                    }
                    style={selectStyle}
                    data-testid="skill-level-select"
                    onFocus={(e) =>
                      (e.target.style.borderColor = 'rgba(0,255,136,0.4)')
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = 'rgba(48,54,61,0.8)')
                    }
                  >
                    <option value="beginner">beginner — just getting started</option>
                    <option value="intermediate">
                      intermediate — some DSA knowledge
                    </option>
                    <option value="advanced">advanced — strong foundation</option>
                  </select>
                </div>

                {/* Goal */}
                <div>
                  <label style={labelStyle}>$ learning_goal</label>
                  <select
                    value={formData.goal}
                    onChange={(e) =>
                      setFormData({ ...formData, goal: e.target.value })
                    }
                    style={selectStyle}
                    data-testid="goal-select"
                    onFocus={(e) =>
                      (e.target.style.borderColor = 'rgba(0,255,136,0.4)')
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = 'rgba(48,54,61,0.8)')
                    }
                  >
                    {goalOptions.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Time Available */}
                <div>
                  <label style={labelStyle}>$ time_available</label>
                  <select
                    value={formData.time_available}
                    onChange={(e) =>
                      setFormData({ ...formData, time_available: e.target.value })
                    }
                    style={selectStyle}
                    data-testid="time-available-select"
                    onFocus={(e) =>
                      (e.target.style.borderColor = 'rgba(0,255,136,0.4)')
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = 'rgba(48,54,61,0.8)')
                    }
                  >
                    {timeOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Known Topics */}
                <div>
                  <label style={labelStyle}>
                    $ known_topics{' '}
                    <span style={{ color: '#484f58' }}>(select topics you know)</span>
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {topicOptions.map((t) => {
                      const isSelected = formData.known_topics.includes(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleTopic(t)}
                          data-testid={`topic-badge-${t}`}
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '11px',
                            fontWeight: 600,
                            letterSpacing: '0.06em',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            background: isSelected
                              ? 'rgba(0,255,136,0.12)'
                              : 'rgba(255,255,255,0.03)',
                            border: isSelected
                              ? '1px solid rgba(0,255,136,0.4)'
                              : '1px solid rgba(48,54,61,0.8)',
                            color: isSelected ? '#00ff88' : '#8b949e',
                          }}
                        >
                          {isSelected ? '✓ ' : ''}
                          {t.replace(/-/g, '_')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  data-testid="generate-roadmap-submit-btn"
                  style={{
                    background: loading
                      ? 'rgba(0,255,136,0.3)'
                      : 'linear-gradient(135deg,#00ff88,#00d4ff)',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '14px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    fontSize: '14px',
                    color: '#030508',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    letterSpacing: '0.06em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                    boxShadow: loading
                      ? 'none'
                      : '0 0 25px rgba(0,255,136,0.25)',
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={16}
                        style={{ animation: 'spin 0.8s linear infinite' }}
                      />{' '}
                      GENERATING_ROADMAP...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} /> GENERATE_ROADMAP →
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                opacity: 0,
                animation: 'fadeInUp 0.5s ease forwards',
              }}
              data-testid="generated-roadmap"
            >
              {/* Success */}
              <div
                style={{
                  background: 'rgba(0,255,136,0.06)',
                  border: '1px solid rgba(0,255,136,0.25)',
                  borderRadius: '14px',
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                <CheckCircle size={24} color="#00ff88" />
                <div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      fontSize: '14px',
                      color: '#00ff88',
                    }}
                  >
                    ROADMAP_GENERATED ✓
                  </div>
                  <div
                    style={{
                      color: '#8b949e',
                      fontSize: '13px',
                      marginTop: '2px',
                    }}
                  >
                    Your personalized learning path is ready
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() =>
                    navigate(
                      `/roadmap/${generated.roadmap_id || generated.id}`
                    )
                  }
                  data-testid="view-full-roadmap-btn"
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg,#00ff88,#00d4ff)',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '13px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    fontSize: '13px',
                    color: '#030508',
                    cursor: 'pointer',
                    letterSpacing: '0.06em',
                    boxShadow: '0 0 20px rgba(0,255,136,0.2)',
                  }}
                >
                  VIEW_FULL_ROADMAP →
                </button>
                <button
                  onClick={() => {
                    setGenerated(null);
                    setFormData({
                      skill_level: currentUser?.skill_level || 'beginner',
                      goal: 'crack FAANG',
                      known_topics: [],
                      time_available: '1-2 hours/day',
                    });
                  }}
                  data-testid="generate-another-btn"
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: '1px solid rgba(48,54,61,0.8)',
                    borderRadius: '10px',
                    padding: '13px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    fontSize: '13px',
                    color: '#8b949e',
                    cursor: 'pointer',
                    letterSpacing: '0.06em',
                  }}
                >
                  GENERATE_ANOTHER
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&family=Syne:wght@400;600;700;800&display=swap');
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
};

export default RoadmapGenerator;