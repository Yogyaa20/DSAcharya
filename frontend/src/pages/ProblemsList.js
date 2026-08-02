import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../App';
import { toast } from 'sonner';
import { Search, ExternalLink, CheckCircle, Circle, Clock } from 'lucide-react';
import Navbar from '../components/Navbar';

const ProblemsList = ({ currentUser, logoutUser }) => {
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const topics = ['all','arrays','strings','linked-lists','trees','graphs','dynamic-programming','binary-search','backtracking'];

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const params = {};
        if (currentUser?.id) {
          params.user_id = currentUser.id;
        }
        if (selectedTopic !== 'all') {
          params.topic = selectedTopic;
        }
        if (selectedDifficulty !== 'all') {
          params.difficulty = selectedDifficulty;
        }

        const res = await api.get('/problems', { params });
        setProblems(res.data);

        if (currentUser) {
          const prog = await api.get(`/users/${currentUser.id}/progress`);
          const map = {};
          prog.data.forEach(p => { map[p.problem_id] = p.status; });
          setUserProgress(map);
        }
      } catch { toast.error('Failed to load problems'); }
      finally { setLoading(false); }
    })();
  }, [currentUser, selectedTopic, selectedDifficulty]);

  const updateStatus = async (problemId, status) => {
    if (!currentUser) { toast.error('Login to track progress'); return; }
    try {
      await api.post('/progress', { user_id: currentUser.id, problem_id: problemId, status });
      setUserProgress(prev => ({ ...prev, [problemId]: status }));
      toast.success(`Marked as ${status}`);
    } catch { toast.error('Failed to update'); }
  };

  const filtered = problems.filter(p => {
    const matchTopic = selectedTopic === 'all' || p.topic === selectedTopic;
    const matchDiff = selectedDifficulty === 'all' || p.difficulty === selectedDifficulty;
    const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTopic && matchDiff && matchSearch;
  });

  const diffColor = { easy:'#00ff88', medium:'#ffb300', hard:'#ff5050' };
  const diffBg = { easy:'rgba(0,255,136,0.08)', medium:'rgba(255,179,0,0.08)', hard:'rgba(255,80,80,0.08)' };
  const diffBorder = { easy:'rgba(0,255,136,0.25)', medium:'rgba(255,179,0,0.25)', hard:'rgba(255,80,80,0.25)' };

  const StatusIcon = ({ id }) => {
    const s = userProgress[id];
    if (s === 'completed') return <CheckCircle size={16} color="#00ff88"/>;
    if (s === 'in_progress') return <Clock size={16} color="#ffb300"/>;
    return <Circle size={16} color="#484f58"/>;
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#030508', display:'flex', flexDirection:'column' }}>
      {currentUser && <Navbar currentUser={currentUser} logoutUser={logoutUser}/>}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ width:'40px', height:'40px', border:'2px solid rgba(0,255,136,0.1)', borderTop:'2px solid #00ff88', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#030508', fontFamily:"'Syne',sans-serif" }}>
      <div style={{ position:'fixed', inset:0, backgroundImage:'linear-gradient(rgba(0,255,136,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.018) 1px,transparent 1px)', backgroundSize:'40px 40px', pointerEvents:'none', zIndex:0 }}/>
      <div style={{ position:'relative', zIndex:1 }}>
        {currentUser && <Navbar currentUser={currentUser} logoutUser={logoutUser}/>}

        <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'40px 24px' }} data-testid="problems-list-container">

          {/* Header */}
          <div style={{ marginBottom:'36px', opacity:0, animation:'fadeIn 0.5s ease forwards' }}>
            <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#00ff88', letterSpacing:'0.15em', marginBottom:'8px' }}>// DSA_PROBLEMS</p>
            <h1 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:800, color:'#e6edf3', letterSpacing:'-0.02em' }}>
              Problem <span style={{ background:'linear-gradient(135deg,#00ff88,#00d4ff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Library</span>
            </h1>
            <p style={{ color:'#8b949e', marginTop:'8px', fontSize:'14px' }}>Browse and solve curated problems to master DSA</p>
          </div>

          {/* Stats row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'24px' }}>
            {[
              { label:'Total', value:filtered.length, color:'#e6edf3' },
              { label:'Easy', value:filtered.filter(p=>p.difficulty==='easy').length, color:'#00ff88' },
              { label:'Medium', value:filtered.filter(p=>p.difficulty==='medium').length, color:'#ffb300' },
              { label:'Hard', value:filtered.filter(p=>p.difficulty==='hard').length, color:'#ff5050' },
            ].map((s,i) => (
              <div key={s.label} style={{ background:'#0d1117', border:'1px solid rgba(48,54,61,0.8)', borderRadius:'12px', padding:'16px', textAlign:'center', opacity:0, animation:`fadeInUp 0.5s ease forwards ${0.1+i*0.08}s` }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'28px', fontWeight:800, color:s.color, lineHeight:1 }}>{s.value}</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'#484f58', letterSpacing:'0.1em', marginTop:'6px', textTransform:'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ background:'#0d1117', border:'1px solid rgba(48,54,61,0.8)', borderRadius:'16px', padding:'20px 24px', marginBottom:'24px', display:'flex', gap:'12px', flexWrap:'wrap', alignItems:'center' }} data-testid="filters-card">
            {/* Search */}
            <div style={{ position:'relative', flex:'1', minWidth:'200px' }}>
              <Search size={13} color="#484f58" style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)' }}/>
              <input
                placeholder="Search problems..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                data-testid="search-input"
                style={{ width:'100%', background:'#080c12', border:'1px solid rgba(48,54,61,0.8)', borderRadius:'8px', padding:'9px 14px 9px 34px', color:'#e6edf3', fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', outline:'none', transition:'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor='rgba(0,255,136,0.35)'}
                onBlur={e => e.target.style.borderColor='rgba(48,54,61,0.8)'}
              />
            </div>

            {/* Topic filter */}
            <select value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)} data-testid="topic-filter"
              style={{ background:'#080c12', border:'1px solid rgba(48,54,61,0.8)', borderRadius:'8px', padding:'9px 14px', color:'#e6edf3', fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', cursor:'pointer', outline:'none' }}>
              {topics.map(t => <option key={t} value={t}>{t === 'all' ? 'ALL_TOPICS' : t.toUpperCase().replace('-','_')}</option>)}
            </select>

            {/* Difficulty filter */}
            <select value={selectedDifficulty} onChange={e => setSelectedDifficulty(e.target.value)} data-testid="difficulty-filter"
              style={{ background:'#080c12', border:'1px solid rgba(48,54,61,0.8)', borderRadius:'8px', padding:'9px 14px', color:'#e6edf3', fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', cursor:'pointer', outline:'none' }}>
              {['all','easy','medium','hard'].map(d => <option key={d} value={d}>{d === 'all' ? 'ALL_LEVELS' : d.toUpperCase()}</option>)}
            </select>
          </div>

          {/* Problems list */}
          <div style={{ background:'#0d1117', border:'1px solid rgba(48,54,61,0.8)', borderRadius:'16px', overflow:'hidden' }} data-testid="problems-table">
            <div style={{ padding:'16px 24px', borderBottom:'1px solid rgba(48,54,61,0.6)', display:'flex', alignItems:'center', gap:'8px' }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:'#e6edf3', fontWeight:700, letterSpacing:'0.04em' }}>PROBLEMS</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#484f58' }}>({filtered.length})</span>
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 24px', color:'#484f58', fontFamily:"'JetBrains Mono',monospace", fontSize:'13px' }}>
                No problems found matching filters
              </div>
            ) : (
              <div>
                {filtered.map((problem, idx) => (
                  <div key={problem.id} data-testid={`problem-item-${problem.id}`}
                    style={{ padding:'18px 24px', borderBottom:'1px solid rgba(48,54,61,0.4)', display:'flex', alignItems:'center', gap:'16px', transition:'background 0.15s' }}
                    onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                    onMouseOut={e => e.currentTarget.style.background='transparent'}>

                    {/* Index */}
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:'#484f58', minWidth:'28px' }}>#{idx+1}</span>

                    {/* Status */}
                    {currentUser && <StatusIcon id={problem.id}/>}

                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px', flexWrap:'wrap' }}>
                        <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'14px', color:'#e6edf3' }}>{problem.title}</h3>
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', fontWeight:700, letterSpacing:'0.08em', padding:'2px 8px', borderRadius:'4px', color:diffColor[problem.difficulty], background:diffBg[problem.difficulty], border:`1px solid ${diffBorder[problem.difficulty]}` }}>{problem.difficulty.toUpperCase()}</span>
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'#484f58', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(48,54,61,0.8)', borderRadius:'4px', padding:'2px 8px' }}>{problem.topic.replace(/-/g,'_')}</span>
                      </div>
                      <p style={{ color:'#8b949e', fontSize:'12px', lineHeight:1.5 }}>{problem.description}</p>
                    </div>

                    {/* Actions */}
                    <div style={{ display:'flex', flexDirection:'column', gap:'8px', alignItems:'flex-end' }}>
                      {problem.solution_link && (
                        <button onClick={() => window.open(problem.solution_link,'_blank')} data-testid={`problem-link-${problem.id}`}
                          style={{ display:'flex', alignItems:'center', gap:'5px', background:'transparent', border:'1px solid rgba(0,212,255,0.3)', borderRadius:'6px', padding:'6px 12px', color:'#00d4ff', fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', cursor:'pointer', fontWeight:600, transition:'all 0.2s' }}
                          onMouseOver={e => { e.currentTarget.style.background='rgba(0,212,255,0.08)'; e.currentTarget.style.borderColor='rgba(0,212,255,0.5)'; }}
                          onMouseOut={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='rgba(0,212,255,0.3)'; }}>
                          <ExternalLink size={11}/> SOLVE
                        </button>
                      )}
                      {currentUser && (
                        <select value={userProgress[problem.id]||'pending'} onChange={e => updateStatus(problem.id, e.target.value)} data-testid={`status-select-${problem.id}`}
                          style={{ background:'#080c12', border:'1px solid rgba(48,54,61,0.8)', borderRadius:'6px', padding:'5px 10px', color: userProgress[problem.id]==='completed'?'#00ff88':userProgress[problem.id]==='in_progress'?'#ffb300':'#484f58', fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', cursor:'pointer', outline:'none' }}>
                          <option value="pending">PENDING</option>
                          <option value="in_progress">IN_PROGRESS</option>
                          <option value="completed">COMPLETED</option>
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&family=Syne:wght@400;600;700;800&display=swap');
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
};
export default ProblemsList;