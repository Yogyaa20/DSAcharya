import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import { Sparkles, BookOpen, TrendingUp, Target, CheckCircle2, Clock, AlertCircle, BarChart3 } from 'lucide-react';
import Navbar from '../components/Navbar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const StatCard = ({ label, value, icon: Icon, color, delay }) => (
  <div style={{ background:'#0d1117', border:'1px solid rgba(48,54,61,0.8)', borderRadius:'16px', padding:'24px', position:'relative', overflow:'hidden', opacity:0, animation:`fadeInUp 0.5s ease forwards ${delay}s`, transition:'all 0.25s' }}
    onMouseOver={e => { e.currentTarget.style.borderColor=color+'44'; e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow=`0 0 30px ${color}12`; }}
    onMouseOut={e => { e.currentTarget.style.borderColor='rgba(48,54,61,0.8)'; e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>
    <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:`linear-gradient(90deg,transparent,${color},transparent)`, opacity:0.5 }}/>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
      <div>
        <p style={{ fontFamily:"'Space Mono',monospace", fontSize:'10px', color:'rgba(255,255,255,0.45)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'12px' }}>{label}</p>
        <p style={{ fontFamily:"'Space Mono',monospace", fontSize:'36px', fontWeight:800, background:`linear-gradient(135deg,${color},#ffffff)`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', lineHeight:1 }}>{value}</p>
      </div>
      <div style={{ width:'40px', height:'40px', background:`${color}15`, border:`1px solid ${color}30`, borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Icon size={18} color={color}/>
      </div>
    </div>
  </div>
);

const Dashboard = ({ currentUser, logoutUser }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) { navigate('/'); return; }
    (async () => {
      try {
        setLoading(true);
        const [s, r] = await Promise.all([
          api.get(`/users/${currentUser.id}/dashboard-stats`),
          api.get(`/users/${currentUser.id}/roadmaps`),
        ]);
        setStats(s.data); setRoadmaps(r.data);

        // Check streak & roadmap reschedule
        axios.post(`${BACKEND_URL}/v2/leaderboard/streak/update`, { user_id: currentUser.id }).catch(() => {});
        axios.post(`${BACKEND_URL}/v2/roadmap/reschedule`, { user_id: currentUser.id }).then(res => {
          if (res.data && res.data.rescheduled) {
            toast.info(`Welcome back! You were away ${res.data.missed_days} day(s). Your roadmap has been rescheduled.`);
            localStorage.setItem('roadmap_rescheduled', 'true');
          }
        }).catch(() => {});
      } catch { toast.error('Failed to load dashboard'); }
      finally { setLoading(false); }
    })();
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0a0a0f', display:'flex', flexDirection:'column' }}>
      <Navbar currentUser={currentUser} logoutUser={logoutUser}/>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ width:'40px', height:'40px', border:'2px solid rgba(232,194,122,0.1)', borderTop:'2px solid #e8c27a', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      </div>
    </div>
  );

  const completion = stats?.completion_rate || 0;

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0f', fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ position:'fixed', inset:0, backgroundImage:'linear-gradient(rgba(232,194,122,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(232,194,122,0.018) 1px,transparent 1px)', backgroundSize:'40px 40px', pointerEvents:'none', zIndex:0 }}/>
      <div style={{ position:'relative', zIndex:1 }}>
        <Navbar currentUser={currentUser} logoutUser={logoutUser}/>

        <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'40px 24px' }} data-testid="dashboard-container">

          {/* Header */}
          <div style={{ marginBottom:'40px', opacity:0, animation:'fadeIn 0.5s ease forwards' }}>
            <p style={{ fontFamily:"'Space Mono',monospace", fontSize:'11px', color:'#e8c27a', letterSpacing:'0.15em', marginBottom:'8px' }}>// WELCOME_BACK</p>
            <h1 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:800, color:'#ffffff', letterSpacing:'-0.02em', lineHeight:1.1 }}>
              Hey, <span style={{ background:'linear-gradient(135deg,#e8c27a,#a8d8a8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{currentUser.username}</span> 👾
            </h1>
            <p style={{ color:'rgba(255,255,255,0.55)', marginTop:'8px', fontSize:'14px' }}>Track your pattern mastery and continue your learning journey</p>
          </div>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:'16px', marginBottom:'32px' }}>
            <StatCard label="Total Problems" value={stats?.total_problems||0} icon={BookOpen} color="#e8c27a" delay={0.1} data-testid="stat-total-problems"/>
            <StatCard label="Completed" value={stats?.completed_problems||0} icon={CheckCircle2} color="#a8d8a8" delay={0.2} data-testid="stat-completed"/>
            <StatCard label="In Progress" value={stats?.in_progress_problems||0} icon={Clock} color="#c4a8d8" delay={0.3} data-testid="stat-in-progress"/>
            <StatCard label="Completion Rate" value={`${completion.toFixed(0)}%`} icon={TrendingUp} color="#e8c27a" delay={0.4} data-testid="stat-completion-rate"/>
          </div>

          {/* Progress */}
          {stats?.total_problems > 0 && (
            <div style={{ background:'#0d1117', border:'1px solid rgba(48,54,61,0.8)', borderRadius:'16px', padding:'24px', marginBottom:'32px', opacity:0, animation:'fadeInUp 0.5s ease forwards 0.5s' }} data-testid="progress-card">
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <BarChart3 size={16} color="#e8c27a"/>
                  <span style={{ fontFamily:"'Space Mono',monospace", fontSize:'12px', color:'#ffffff', fontWeight:600, letterSpacing:'0.04em' }}>OVERALL_PROGRESS</span>
                </div>
                <span style={{ fontFamily:"'Space Mono',monospace", fontSize:'12px', color:'#e8c27a' }}>{completion.toFixed(1)}%</span>
              </div>
              <div style={{ height:'6px', background:'rgba(255,255,255,0.05)', borderRadius:'3px', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${completion}%`, background:'linear-gradient(90deg,#e8c27a,#a8d8a8)', borderRadius:'3px', transition:'width 1s cubic-bezier(0.4,0,0.2,1)' }}/>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:'10px' }}>
                <span style={{ fontFamily:"'Space Mono',monospace", fontSize:'11px', color:'rgba(255,255,255,0.45)' }}>{stats.completed_problems} completed</span>
                <span style={{ fontFamily:"'Space Mono',monospace", fontSize:'11px', color:'rgba(255,255,255,0.45)' }}>{stats.total_problems} total</span>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'16px', marginBottom:'32px' }}>
            {[
              { icon:'⚡', title:'Generate Acharya Roadmap', desc:'AI-powered pattern-based learning path', cta:'START_GENERATING →', path:'/generate-roadmap', color:'#e8c27a', testId:'quick-action-generate-roadmap' },
              { icon:'🧠', title:'Take Diagnostic Quiz', desc:'Assess your knowledge & build a targeted roadmap', cta:'TAKE_QUIZ →', path:'/diagnostic', color:'#00ff88', testId:'quick-action-take-diagnostic-quiz' },
              { icon:'🎯', title:'Browse Problems', desc:'Explore curated DSA problem library', cta:'VIEW_PROBLEMS →', path:'/problems', color:'#c4a8d8', testId:'quick-action-browse-problems' },
              { icon:'🏆', title:'View Leaderboard', desc:'Rank up, compete with friends & college mates', cta:'LEADERBOARD →', path:'/leaderboard', color:'#00d4ff', testId:'quick-action-leaderboard' },
            ].map((a, i) => (
              <div key={a.path} onClick={() => navigate(a.path)} data-testid={a.testId}
                style={{ background:'#0d1117', border:`1px solid ${a.color}25`, borderRadius:'16px', padding:'28px', cursor:'pointer', transition:'all 0.25s', opacity:0, animation:`fadeInUp 0.5s ease forwards ${0.6+i*0.1}s`, position:'relative', overflow:'hidden' }}
                onMouseOver={e => { e.currentTarget.style.borderColor=a.color+'55'; e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 0 30px ${a.color}12`; }}
                onMouseOut={e => { e.currentTarget.style.borderColor=a.color+'25'; e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:`linear-gradient(90deg,transparent,${a.color},transparent)`, opacity:0.5 }}/>
                <div style={{ fontSize:'28px', marginBottom:'12px' }}>{a.icon}</div>
                <h3 style={{ fontFamily:"'Space Mono',monospace", fontWeight:700, fontSize:'14px', color:'#ffffff', marginBottom:'8px', letterSpacing:'0.02em' }}>{a.title}</h3>
                <p style={{ color:'rgba(255,255,255,0.55)', fontSize:'13px', marginBottom:'20px' }}>{a.desc}</p>
                <span style={{ fontFamily:"'Space Mono',monospace", fontSize:'12px', color:a.color, fontWeight:700, letterSpacing:'0.04em' }}>{a.cta}</span>
              </div>
            ))}
          </div>

          {/* My Roadmaps */}
          <div style={{ background:'#0d1117', border:'1px solid rgba(48,54,61,0.8)', borderRadius:'16px', padding:'28px', opacity:0, animation:'fadeInUp 0.5s ease forwards 0.8s' }} data-testid="roadmaps-section">
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'24px' }}>
              <Target size={16} color="#e8c27a"/>
              <span style={{ fontFamily:"'Space Mono',monospace", fontSize:'13px', color:'#ffffff', fontWeight:700, letterSpacing:'0.04em' }}>MY_ROADMAPS</span>
              <span style={{ fontFamily:"'Space Mono',monospace", fontSize:'11px', color:'rgba(255,255,255,0.45)', marginLeft:'4px' }}>({roadmaps.length})</span>
            </div>

            {roadmaps.length === 0 ? (
              <div style={{ textAlign:'center', padding:'48px 24px' }} data-testid="no-roadmaps-message">
                <AlertCircle size={40} color="#484f58" style={{ margin:'0 auto 16px' }}/>
                <p style={{ color:'rgba(255,255,255,0.55)', fontSize:'14px', marginBottom:'20px' }}>No roadmaps yet. Generate your first Acharya roadmap!</p>
                <button onClick={() => navigate('/generate-roadmap')}
                  style={{ background:'#e8c27a', border:'none', borderRadius:'8px', padding:'10px 24px', fontFamily:"'Space Mono',monospace", fontWeight:700, fontSize:'12px', color:'#0a0a0f', cursor:'pointer', letterSpacing:'0.04em' }}>
                  GENERATE_ROADMAP →
                </button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                {roadmaps.map((rm, i) => (
                  <div key={rm.id} onClick={() => navigate(`/roadmap/${rm.id}`)} data-testid={`roadmap-item-${rm.id}`}
                    style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(48,54,61,0.6)', borderRadius:'12px', padding:'18px 20px', cursor:'pointer', transition:'all 0.2s', display:'flex', justifyContent:'space-between', alignItems:'center' }}
                    onMouseOver={e => { e.currentTarget.style.borderColor='rgba(232,194,122,0.3)'; e.currentTarget.style.background='rgba(232,194,122,0.03)'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor='rgba(48,54,61,0.6)'; e.currentTarget.style.background='rgba(255,255,255,0.02)'; }}>
                    <div>
                      <h3 style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:'15px', color:'#ffffff', marginBottom:'6px' }}>{rm.title}</h3>
                      <p style={{ color:'rgba(255,255,255,0.55)', fontSize:'13px', marginBottom:'10px' }}>{rm.description}</p>
                      <div style={{ display:'flex', gap:'8px' }}>
                        {[rm.skill_level, `${rm.duration_weeks}w`].map(tag => (
                          <span key={tag} style={{ fontFamily:"'Space Mono',monospace", fontSize:'10px', color:'#e8c27a', background:'rgba(232,194,122,0.08)', border:'1px solid rgba(232,194,122,0.2)', borderRadius:'4px', padding:'2px 8px', letterSpacing:'0.06em' }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                    <span style={{ fontFamily:"'Space Mono',monospace", fontSize:'12px', color:'#e8c27a' }}>VIEW →</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
};
export default Dashboard;