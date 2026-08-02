import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { api } from '../App';
import { toast } from 'sonner';
import { Target, Calendar, Clock, ArrowLeft, ChevronDown, ChevronUp, CheckCircle, HelpCircle, Code, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const RoadmapView = ({ currentUser, logoutUser }) => {
  const navigate = useNavigate();
  const { roadmapId } = useParams();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openWeek, setOpenWeek] = useState(1);
  const [showRescheduledBanner, setShowRescheduledBanner] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('roadmap_rescheduled') === 'true') {
      setShowRescheduledBanner(true);
      localStorage.removeItem('roadmap_rescheduled');
      const timer = setTimeout(() => setShowRescheduledBanner(false), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) { navigate('/'); return; }
    (async () => {
      try {
        setLoading(true);
        // Auto-trigger reschedule check on mount
        try {
          const res = await axios.post(`${BACKEND_URL}/v2/roadmap/reschedule`, { user_id: currentUser.id });
          if (res.data && res.data.rescheduled) {
            localStorage.setItem('roadmap_rescheduled', 'true');
            setShowRescheduledBanner(true);
            toast.info(`Roadmap adjusted — you were away ${res.data.missed_days} day(s)`);
            setTimeout(() => setShowRescheduledBanner(false), 5000);
          }
        } catch (e) {
          console.error('Reschedule check error:', e);
        }

        const res = await api.get(`/roadmaps/${roadmapId}`);
        setRoadmap(res.data);
      } catch {
        toast.error('Failed to load roadmap');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser, roadmapId, navigate]);

  if (!currentUser) return null;

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#030508', display:'flex', flexDirection:'column' }}>
      <Navbar currentUser={currentUser} logoutUser={logoutUser}/>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ width:'40px', height:'40px', border:'2px solid rgba(0,255,136,0.1)', borderTop:'2px solid #00ff88', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!roadmap) return null;

  const topicsData = roadmap.topics || {};
  const v2Roadmap = Array.isArray(topicsData.roadmap) ? topicsData.roadmap : null;
  const weeklyPlan = Array.isArray(topicsData.weekly_plan) ? topicsData.weekly_plan : [];

  const getPriorityStyle = (priority) => {
    const p = (priority || '').toLowerCase();
    if (p === 'high') {
      return {
        color: '#ff4d4d',
        background: 'rgba(255,77,77,0.1)',
        border: '1px solid rgba(255,77,77,0.3)',
      };
    }
    if (p === 'medium') {
      return {
        color: '#ffd700',
        background: 'rgba(255,215,0,0.1)',
        border: '1px solid rgba(255,215,0,0.3)',
      };
    }
    return {
      color: '#8b949e',
      background: 'rgba(139,148,158,0.1)',
      border: '1px solid rgba(139,148,158,0.3)',
    };
  };

  return (
    <div style={{ minHeight:'100vh', background:'#030508', fontFamily:"'Syne',sans-serif" }}>
      <div style={{ position:'fixed', inset:0, backgroundImage:'linear-gradient(rgba(0,255,136,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.018) 1px,transparent 1px)', backgroundSize:'40px 40px', pointerEvents:'none', zIndex:0 }}/>
      <div style={{ position:'relative', zIndex:1 }}>
        <Navbar currentUser={currentUser} logoutUser={logoutUser}/>

        <div style={{ maxWidth:'860px', margin:'0 auto', padding:'40px 24px' }} data-testid="roadmap-view-container">

          {/* Back */}
          <button onClick={() => navigate('/dashboard')} data-testid="back-to-dashboard-btn"
            style={{ display:'flex', alignItems:'center', gap:'6px', background:'transparent', border:'none', color:'#8b949e', fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', cursor:'pointer', marginBottom:'28px', letterSpacing:'0.04em', transition:'color 0.2s' }}
            onMouseOver={e => e.currentTarget.style.color='#00ff88'} onMouseOut={e => e.currentTarget.style.color='#8b949e'}>
            <ArrowLeft size={14}/> BACK_TO_DASHBOARD
          </button>

          {/* Rescheduled Banner */}
          {showRescheduledBanner && (
            <div style={{
              background: 'rgba(0,212,255,0.08)',
              border: '1px solid rgba(0,212,255,0.3)',
              color: '#00d4ff',
              borderRadius: '12px',
              padding: '14px 20px',
              marginBottom: '20px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.02em',
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              animation: 'fadeIn 0.4s ease forwards',
            }} data-testid="roadmap-rescheduled-banner">
              <span>// ROADMAP_RESCHEDULED — adjusted for your absence. Back on track!</span>
            </div>
          )}

          {/* Header card */}
          <div style={{ background:'#0d1117', border:'1px solid rgba(48,54,61,0.8)', borderRadius:'20px', padding:'32px', marginBottom:'24px', position:'relative', overflow:'hidden', opacity:0, animation:'fadeIn 0.5s ease forwards' }} data-testid="roadmap-header">
            <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:'linear-gradient(90deg,transparent,#00ff88,#00d4ff,transparent)' }}/>
            <div style={{ display:'flex', alignItems:'flex-start', gap:'16px' }}>
              <div style={{ width:'48px', height:'48px', background:'linear-gradient(135deg,rgba(0,255,136,0.15),rgba(0,212,255,0.1))', border:'1px solid rgba(0,255,136,0.25)', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Target size={22} color="#00ff88"/>
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#00ff88', letterSpacing:'0.12em', marginBottom:'6px' }}>// YOUR_ROADMAP</p>
                <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(20px,3vw,28px)', fontWeight:800, color:'#e6edf3', marginBottom:'10px', lineHeight:1.2 }}>{roadmap.title}</h1>
                <p style={{ color:'#8b949e', fontSize:'14px', lineHeight:1.6, marginBottom:'16px' }}>{roadmap.description}</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'10px' }}>
                  {[
                    { icon: Target, label: roadmap.skill_level, color:'#00ff88' },
                    { icon: Calendar, label: roadmap.duration_weeks ? `${roadmap.duration_weeks} weeks` : 'Personalized', color:'#00d4ff' },
                    { icon: Clock, label: roadmap.generated_at ? new Date(roadmap.generated_at).toLocaleDateString() : 'Active', color:'#a855f7' },
                  ].map(({ icon: Icon, label, color }) => (
                    <div key={label} style={{ display:'flex', alignItems:'center', gap:'6px', background:`${color}10`, border:`1px solid ${color}25`, borderRadius:'8px', padding:'5px 12px' }}>
                      <Icon size={12} color={color}/> <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color, letterSpacing:'0.04em' }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* V2 Render: Flat list of topic cards */}
          {v2Roadmap ? (
            <div style={{ display:'flex', flexDirection:'column', gap:'16px', marginBottom:'24px', opacity:0, animation:'fadeInUp 0.5s ease forwards 0.2s' }} data-testid="v2-roadmap-topics">
              <div style={{ padding:'12px 4px', borderBottom:'1px solid rgba(48,54,61,0.6)', marginBottom:'8px' }}>
                <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#00ff88', letterSpacing:'0.12em', marginBottom:'4px' }}>// TOPIC_PATHWAY (V2)</p>
                <p style={{ color:'#8b949e', fontSize:'13px' }}>Master these topics step-by-step according to priority</p>
              </div>

              {v2Roadmap.map((item, idx) => {
                const priorityStyle = getPriorityStyle(item.priority);
                const isCompleted = item.status === 'completed' || item.status === 'done' || item.completed === true;

                let isOverdue = !isCompleted && (item.is_overdue || item.overdue || false);
                if (!isCompleted && item.estimated_start) {
                  try {
                    const startDate = new Date(item.estimated_start);
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    if (startDate < today) isOverdue = true;
                  } catch (e) {}
                }

                const borderLeftColor = isCompleted ? '#00ff88' : isOverdue ? '#ff4444' : 'transparent';
                const cardOpacity = isCompleted ? 0.7 : 1;

                return (
                  <div key={idx} style={{
                    background:'#0d1117',
                    border:'1px solid rgba(48,54,61,0.8)',
                    borderLeft: borderLeftColor !== 'transparent' ? `4px solid ${borderLeftColor}` : '1px solid rgba(48,54,61,0.8)',
                    borderRadius:'16px',
                    padding:'24px',
                    position:'relative',
                    overflow:'hidden',
                    opacity: cardOpacity,
                    transition: 'all 0.3s ease'
                  }} data-testid={`v2-topic-card-${item.topic}`}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'12px', marginBottom:'14px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:'20px', fontWeight:800, color: isCompleted ? '#8b949e' : '#00ff88', textTransform:'capitalize' }}>
                            {item.topic}
                          </h3>
                          {isCompleted && (
                            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', fontWeight:700, padding:'3px 8px', borderRadius:'4px', color:'#00ff88', background:'rgba(0,255,136,0.1)', border:'1px solid rgba(0,255,136,0.3)', display:'inline-flex', alignItems:'center', gap:'4px' }}>
                              <CheckCircle size={12}/> ✓ COMPLETED
                            </span>
                          )}
                          {isOverdue && (
                            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', fontWeight:700, padding:'3px 8px', borderRadius:'4px', color:'#ff4444', background:'rgba(255,68,68,0.1)', border:'1px solid rgba(255,68,68,0.3)', display:'inline-flex', alignItems:'center', gap:'4px' }}>
                              <AlertCircle size={12}/> ⚠ OVERDUE
                            </span>
                          )}
                        </div>
                        {item.estimated_days && (
                          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:'#8b949e', marginTop:'4px', display:'inline-block' }}>
                            Estimated time: <span style={{ color:'#00d4ff' }}>{item.estimated_days} days</span>
                          </span>
                        )}
                      </div>

                      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', fontWeight:700, padding:'4px 10px', borderRadius:'6px', textTransform:'uppercase', ...priorityStyle }}>
                          {item.priority || 'medium'} priority
                        </span>
                      </div>
                    </div>

                    {/* Resources / Problem Chips */}
                    {item.resources && item.resources.length > 0 && (
                      <div style={{ marginBottom:'18px' }}>
                        <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#484f58', letterSpacing:'0.1em', marginBottom:'8px' }}>// PRACTICE_PROBLEMS</p>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                          {item.resources.map((res, rIdx) => {
                            const isObj = typeof res === 'object' && res !== null;
                            const title = isObj ? (res.title || res.problem_title || 'Problem') : res;
                            const platform = isObj ? (res.platform || 'leetcode') : 'leetcode';
                            const link = isObj ? res.problem_link : null;
                            const platColor = ({ leetcode: '#FFA116', gfg: '#2F8D46', codeforces: '#1F8ACB', hackerrank: '#00EA64', interviewbit: '#1F6FEB' }[(platform || '').toLowerCase()] || '#00d4ff');

                            return (
                              <button key={rIdx} onClick={() => link ? window.open(link, '_blank') : navigate(`/problems?topic=${encodeURIComponent(item.topic)}`)}
                                style={{ display:'flex', alignItems:'center', gap:'6px', background:`${platColor}10`, border:`1px solid ${platColor}35`, borderRadius:'6px', padding:'6px 12px', color:'#e6edf3', fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', cursor:'pointer', transition:'all 0.2s' }}
                                onMouseOver={e => { e.currentTarget.style.background=`${platColor}25`; e.currentTarget.style.borderColor=platColor; }}
                                onMouseOut={e => { e.currentTarget.style.background=`${platColor}10`; e.currentTarget.style.borderColor=`${platColor}35`; }}>
                                <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 5px', borderRadius:'3px', color:platColor, background:`${platColor}20`, textTransform:'uppercase' }}>
                                  {platform}
                                </span>
                                <Code size={12} color={platColor}/> {title}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Topic actions */}
                    <div style={{ display:'flex', gap:'10px', marginTop:'14px' }}>
                      <button onClick={() => navigate(`/quiz/${encodeURIComponent(item.topic)}`)} data-testid={`quiz-btn-${item.topic}`}
                        style={{ display:'flex', alignItems:'center', gap:'8px', background:'linear-gradient(135deg,rgba(0,255,136,0.15),rgba(0,212,255,0.15))', border:'1px solid rgba(0,255,136,0.4)', borderRadius:'8px', padding:'10px 16px', fontFamily:"'JetBrains Mono',monospace", fontWeight:700, fontSize:'12px', color:'#00ff88', cursor:'pointer', transition:'all 0.2s' }}
                        onMouseOver={e => e.currentTarget.style.background='linear-gradient(135deg,#00ff88,#00d4ff)'}
                        onMouseOverCapture={e => e.currentTarget.style.color='#030508'}
                        onMouseOut={e => { e.currentTarget.style.background='linear-gradient(135deg,rgba(0,255,136,0.15),rgba(0,212,255,0.15))'; e.currentTarget.style.color='#00ff88'; }}>
                        <HelpCircle size={14}/> Take Quiz on this Topic
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Fallback: Old Weekly plan */
            <div style={{ background:'#0d1117', border:'1px solid rgba(48,54,61,0.8)', borderRadius:'20px', overflow:'hidden', marginBottom:'24px', opacity:0, animation:'fadeInUp 0.5s ease forwards 0.2s' }} data-testid="weekly-breakdown">
              <div style={{ padding:'20px 28px', borderBottom:'1px solid rgba(48,54,61,0.6)' }}>
                <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#00ff88', letterSpacing:'0.12em', marginBottom:'4px' }}>// WEEKLY_LEARNING_PLAN</p>
                <p style={{ color:'#8b949e', fontSize:'13px' }}>Follow this structured path to master DSA week by week</p>
              </div>

              {weeklyPlan.length === 0 ? (
                <div style={{ padding:'48px', textAlign:'center', color:'#484f58', fontFamily:"'JetBrains Mono',monospace", fontSize:'13px' }}>No weekly plan available</div>
              ) : (
                <div data-testid="weeks-accordion">
                  {weeklyPlan.map((week, idx) => (
                    <div key={week.week} style={{ borderBottom: idx < weeklyPlan.length-1 ? '1px solid rgba(48,54,61,0.4)' : 'none' }}>
                      {/* Week header */}
                      <button onClick={() => setOpenWeek(openWeek === week.week ? null : week.week)} data-testid={`week-trigger-${week.week}`}
                        style={{ width:'100%', padding:'18px 28px', background: openWeek===week.week ? 'rgba(0,255,136,0.04)' : 'transparent', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', transition:'background 0.2s' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
                          <div style={{ width:'36px', height:'36px', background: openWeek===week.week ? 'linear-gradient(135deg,#00ff88,#00d4ff)' : 'rgba(255,255,255,0.04)', border: openWeek===week.week ? 'none' : '1px solid rgba(48,54,61,0.8)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'JetBrains Mono',monospace", fontWeight:800, fontSize:'13px', color: openWeek===week.week ? '#030508' : '#8b949e', transition:'all 0.2s', flexShrink:0 }}>
                            {week.week}
                          </div>
                          <div style={{ textAlign:'left' }}>
                            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700, fontSize:'13px', color: openWeek===week.week ? '#00ff88' : '#e6edf3', letterSpacing:'0.04em' }}>WEEK_{week.week}</div>
                            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#484f58', marginTop:'2px' }}>{week.topics?.length||0} topics · {week.problem_count||5} problems</div>
                          </div>
                        </div>
                        {openWeek===week.week ? <ChevronUp size={15} color="#00ff88"/> : <ChevronDown size={15} color="#484f58"/>}
                      </button>

                      {/* Week content */}
                      {openWeek === week.week && (
                        <div style={{ padding:'0 28px 24px 78px', animation:'fadeIn 0.3s ease' }}>
                          {week.topics?.length > 0 && (
                            <div style={{ marginBottom:'16px' }}>
                              <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'#484f58', letterSpacing:'0.1em', marginBottom:'10px' }}>// TOPICS</p>
                              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                                {week.topics.map((t,i) => (
                                  <span key={i} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#00d4ff', background:'rgba(0,212,255,0.08)', border:'1px solid rgba(0,212,255,0.2)', borderRadius:'4px', padding:'3px 10px', letterSpacing:'0.04em' }}>{t}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {week.concepts?.length > 0 && (
                            <div style={{ marginBottom:'20px' }}>
                              <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'#484f58', letterSpacing:'0.1em', marginBottom:'10px' }}>// KEY_CONCEPTS</p>
                              <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                                {week.concepts.map((c,i) => (
                                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                                    <CheckCircle size={12} color="#00ff88"/>
                                    <span style={{ color:'#8b949e', fontSize:'13px' }}>{c}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(48,54,61,0.6)', borderRadius:'10px', padding:'12px 16px', marginBottom:'16px' }}>
                            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#8b949e' }}>Recommended problems</span>
                            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#00ff88', background:'rgba(0,255,136,0.08)', border:'1px solid rgba(0,255,136,0.2)', borderRadius:'4px', padding:'2px 10px' }}>{week.problem_count||5}</span>
                          </div>

                          <button onClick={() => navigate('/problems')} data-testid={`week-${week.week}-start-btn`}
                            style={{ width:'100%', background:'transparent', border:'1px solid rgba(0,255,136,0.25)', borderRadius:'8px', padding:'11px', fontFamily:"'JetBrains Mono',monospace", fontWeight:700, fontSize:'12px', color:'#00ff88', cursor:'pointer', letterSpacing:'0.06em', transition:'all 0.2s' }}
                            onMouseOver={e => { e.currentTarget.style.background='rgba(0,255,136,0.08)'; e.currentTarget.style.borderColor='rgba(0,255,136,0.5)'; }}
                            onMouseOut={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='rgba(0,255,136,0.25)'; }}>
                            START_WEEK_{week.week}_PROBLEMS →
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bottom actions */}
          <div style={{ display:'flex', gap:'12px', opacity:0, animation:'fadeInUp 0.5s ease forwards 0.4s' }}>
            <button onClick={() => navigate('/problems')} data-testid="browse-problems-btn"
              style={{ flex:1, background:'linear-gradient(135deg,#00ff88,#00d4ff)', border:'none', borderRadius:'10px', padding:'13px', fontFamily:"'JetBrains Mono',monospace", fontWeight:700, fontSize:'13px', color:'#030508', cursor:'pointer', letterSpacing:'0.06em', boxShadow:'0 0 20px rgba(0,255,136,0.2)' }}>
              BROWSE_ALL_PROBLEMS →
            </button>
            <button onClick={() => navigate('/generate-roadmap')} data-testid="generate-new-roadmap-btn"
              style={{ flex:1, background:'transparent', border:'1px solid rgba(48,54,61,0.8)', borderRadius:'10px', padding:'13px', fontFamily:"'JetBrains Mono',monospace", fontWeight:700, fontSize:'13px', color:'#8b949e', cursor:'pointer', letterSpacing:'0.06em' }}>
              GENERATE_NEW_ROADMAP
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&family=Syne:wght@400;600;700;800&display=swap');
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
};

export default RoadmapView;