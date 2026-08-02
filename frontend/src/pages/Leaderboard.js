import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Loader2, Trophy, Copy, Check, Users, Globe, GraduationCap,
  Flame, Star, Zap, Crown, Medal, LogOut
} from 'lucide-react';
import Navbar from '../components/Navbar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// ── helpers ──────────────────────────────────────────────────────────────────

function getInitials(name = '') {
  return name.slice(0, 2).toUpperCase() || '??';
}

function medalColor(rank) {
  if (rank === 1) return '#FFD700';
  if (rank === 2) return '#C0C0C0';
  if (rank === 3) return '#CD7F32';
  return '#8b949e';
}

function medalBg(rank) {
  if (rank === 1) return 'rgba(255,215,0,0.12)';
  if (rank === 2) return 'rgba(192,192,192,0.12)';
  if (rank === 3) return 'rgba(205,127,50,0.12)';
  return 'transparent';
}

// Generate last 30 days activity (placeholder — real implementation uses actual data)
function buildActivityGrid(lastActiveDateStr) {
  const today = new Date();
  const lastActive = lastActiveDateStr ? new Date(lastActiveDateStr) : null;
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const isToday = i === 0;
    const isActive = lastActive && Math.abs(d - lastActive) < 86400000 * 2;
    days.push({ date: d, isToday, isActive });
  }
  return days;
}

// Count-up hook
function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setValue(start);
      if (start >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

// ── sub-components ────────────────────────────────────────────────────────────

const Avatar = ({ name, size = 40, color = '#00ff88' }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: `linear-gradient(135deg,${color}22,${color}44)`,
    border: `1px solid ${color}55`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'JetBrains Mono', monospace", fontWeight: 800,
    fontSize: size * 0.35, color,
    flexShrink: 0,
  }}>
    {getInitials(name)}
  </div>
);

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={handleCopy} style={{
      display: 'flex', alignItems: 'center', gap: '4px',
      background: copied ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.06)',
      border: `1px solid ${copied ? 'rgba(0,255,136,0.4)' : 'rgba(48,54,61,0.8)'}`,
      borderRadius: '6px', padding: '5px 10px', cursor: 'pointer',
      fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
      color: copied ? '#00ff88' : '#8b949e', transition: 'all 0.2s',
    }}>
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'COPIED!' : 'COPY'}
    </button>
  );
};

const ActivityGrid = ({ lastActiveDateStr }) => {
  const days = buildActivityGrid(lastActiveDateStr);
  return (
    <div>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#484f58', letterSpacing: '0.1em', marginBottom: '8px' }}>
        // ACTIVITY_STREAK (30d)
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '280px' }}>
        {days.map((d, i) => (
          <div key={i} title={d.date.toDateString()} style={{
            width: '10px', height: '10px', borderRadius: '2px',
            background: d.isActive ? '#00ff88' : 'rgba(255,255,255,0.05)',
            boxShadow: d.isActive ? '0 0 4px rgba(0,255,136,0.5)' : 'none',
            border: d.isToday ? '1px solid #00ff88' : '1px solid transparent',
            transition: 'all 0.2s',
          }} />
        ))}
      </div>
    </div>
  );
};

const LeaderboardRow = ({ entry, isCurrentUser }) => {
  const color = medalColor(entry.rank);
  const bg = medalBg(entry.rank);
  const isTop3 = entry.rank <= 3;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      padding: '14px 20px', borderRadius: '10px',
      background: isCurrentUser ? 'rgba(0,255,136,0.08)' : bg,
      border: isCurrentUser ? '1px solid rgba(0,255,136,0.35)' : '1px solid transparent',
      borderLeft: isCurrentUser ? '3px solid #00ff88' : isTop3 ? `3px solid ${color}` : '3px solid transparent',
      transition: 'background 0.2s',
      marginBottom: '4px',
      animation: `fadeInUp 0.4s ease forwards`,
      opacity: 0,
      animationDelay: `${Math.min(entry.rank * 0.03, 0.5)}s`,
    }}
      onMouseOver={e => { if (!isCurrentUser) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
      onMouseOut={e => { if (!isCurrentUser) e.currentTarget.style.background = bg; }}
    >
      {/* Rank */}
      <div style={{ width: '36px', textAlign: 'center', flexShrink: 0 }}>
        {entry.rank === 1 ? <Crown size={18} color="#FFD700" /> :
          entry.rank === 2 ? <Medal size={18} color="#C0C0C0" /> :
            entry.rank === 3 ? <Medal size={18} color="#CD7F32" /> :
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: '#484f58', fontWeight: 700 }}>
                #{entry.rank}
              </span>}
      </div>

      {/* Avatar */}
      <Avatar name={entry.username} size={36} color={isCurrentUser ? '#00ff88' : color === '#8b949e' ? '#00d4ff' : color} />

      {/* Name + college */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '13px', color: isCurrentUser ? '#00ff88' : '#e6edf3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {entry.username} {isCurrentUser && <span style={{ fontSize: '10px', color: '#00ff88', opacity: 0.7 }}>(you)</span>}
        </div>
        {entry.college_name && (
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#484f58', marginTop: '2px' }}>
            {entry.college_name}
          </div>
        )}
      </div>

      {/* Streak */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
        <span style={{ fontSize: entry.current_streak > 7 ? '1.3rem' : '1rem' }}>🔥</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#e6edf3', fontWeight: 700 }}>
          {entry.current_streak ?? 0}d
        </span>
      </div>

      {/* XP */}
      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '70px' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', fontWeight: 800, color: color === '#8b949e' ? '#00d4ff' : color }}>
          {(entry.xp_points ?? 0).toLocaleString()}
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#484f58' }}>XP</div>
      </div>

      {/* Problems */}
      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '56px' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', fontWeight: 700, color: '#8b949e' }}>
          {entry.total_problems_solved ?? 0}
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#484f58' }}>solved</div>
      </div>
    </div>
  );
};

// ── main component ────────────────────────────────────────────────────────────

const Leaderboard = ({ currentUser, logoutUser }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('global');
  const [globalData, setGlobalData] = useState([]);
  const [collegeData, setCollegeData] = useState([]);
  const [friendGroup, setFriendGroup] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [profileForm, setProfileForm] = useState({ college_name: '', college_year: '1st', course: 'B.Tech CSE' });
  const [savingProfile, setSavingProfile] = useState(false);

  // Group actions
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [groupActionLoading, setGroupActionLoading] = useState(false);
  const [createdGroupInfo, setCreatedGroupInfo] = useState(null);

  const xpDisplay = useCountUp(userProfile?.xp_points || 0);

  useEffect(() => {
    if (!currentUser) { navigate('/'); return; }
    initPage();
  }, [currentUser]);

  const initPage = async () => {
    setLoading(true);
    try {
      // 1. Update streak
      await axios.post(`${BACKEND_URL}/v2/leaderboard/streak/update`, { user_id: currentUser.id });

      // 2. Fetch profile
      const profRes = await axios.get(`${BACKEND_URL}/v2/leaderboard/profile/${currentUser.id}`);
      const prof = profRes.data;
      setUserProfile(prof);
      if (!prof.college_name) setShowProfileSetup(true);

      // 3. Global leaderboard
      const gRes = await axios.get(`${BACKEND_URL}/v2/leaderboard/global?limit=50`);
      setGlobalData(gRes.data);

      // 4. College leaderboard
      if (prof.college_name) {
        const cRes = await axios.get(`${BACKEND_URL}/v2/leaderboard/college/${encodeURIComponent(prof.college_name)}?limit=50`);
        setCollegeData(cRes.data);
      }

      // 5. Friend group
      const grpRes = await axios.get(`${BACKEND_URL}/v2/leaderboard/group/by-user/${currentUser.id}`);
      setFriendGroup(grpRes.data);
    } catch (err) {
      console.error('Leaderboard init error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileForm.college_name.trim()) { toast.error('Please enter your college name'); return; }
    setSavingProfile(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/v2/leaderboard/profile/update`, {
        user_id: currentUser.id,
        ...profileForm,
      });
      setUserProfile(res.data);
      setShowProfileSetup(false);
      toast.success('Profile updated!');
      // Refresh college leaderboard
      const cRes = await axios.get(`${BACKEND_URL}/v2/leaderboard/college/${encodeURIComponent(profileForm.college_name)}?limit=50`);
      setCollegeData(cRes.data);
    } catch { toast.error('Failed to save profile'); }
    finally { setSavingProfile(false); }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) { toast.error('Please enter a group name'); return; }
    setGroupActionLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/v2/leaderboard/group/create`, {
        user_id: currentUser.id,
        group_name: groupName,
      });
      setCreatedGroupInfo(res.data);
      // Refresh group state
      const grpRes = await axios.get(`${BACKEND_URL}/v2/leaderboard/group/by-user/${currentUser.id}`);
      setFriendGroup(grpRes.data);
      toast.success(`Gang "${groupName}" created!`);
    } catch { toast.error('Failed to create group'); }
    finally { setGroupActionLoading(false); }
  };

  const handleJoinGroup = async () => {
    if (inviteCode.trim().length !== 6) { toast.error('Enter the 6-character code'); return; }
    setGroupActionLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/v2/leaderboard/group/join`, {
        user_id: currentUser.id,
        invite_code: inviteCode.trim().toUpperCase(),
      });
      setFriendGroup(res.data);
      toast.success(`Joined gang "${res.data.group_name}"!`);
      setShowJoinGroup(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid code');
    } finally { setGroupActionLoading(false); }
  };

  const handleLeaveGroup = async () => {
    if (!friendGroup) return;
    try {
      await axios.post(`${BACKEND_URL}/v2/leaderboard/group/${friendGroup.group_id}/leave?user_id=${currentUser.id}`);
      setFriendGroup(null);
      toast.success('Left the gang');
    } catch { toast.error('Could not leave group'); }
  };

  if (!currentUser) return null;

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#030508', display: 'flex', flexDirection: 'column' }}>
      <Navbar currentUser={currentUser} logoutUser={logoutUser} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} color="#00ff88" style={{ animation: 'spin 0.8s linear infinite' }} />
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const tabs = [
    { id: 'global', label: 'GLOBAL', icon: '🌍' },
    { id: 'college', label: 'COLLEGE', icon: '🏫' },
    { id: 'friends', label: 'FRIENDS', icon: '👥' },
  ];

  const myGlobalRank = globalData.findIndex(e => e.user_id === currentUser.id) + 1;

  return (
    <div style={{ minHeight: '100vh', background: '#030508', fontFamily: "'Syne', sans-serif" }}>
      {/* Grid bg */}
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: 'linear-gradient(rgba(0,255,136,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.018) 1px,transparent 1px)',
        backgroundSize: '40px 40px', pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar currentUser={currentUser} logoutUser={logoutUser} />

        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 24px' }}>

          {/* ── Page header ── */}
          <div style={{ marginBottom: '32px', opacity: 0, animation: 'fadeIn 0.5s ease forwards' }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#00ff88', letterSpacing: '0.15em', marginBottom: '8px' }}>
              // LEADERBOARD_SYSTEM
            </p>
            <h1 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800, color: '#e6edf3', letterSpacing: '-0.02em' }}>
              Compete &{' '}
              <span style={{ background: 'linear-gradient(135deg,#00ff88,#00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Rank Up
              </span>
            </h1>
            <p style={{ color: '#8b949e', marginTop: '8px', fontSize: '14px' }}>
              Track your progress against the DSA community
            </p>
          </div>

          {/* ── Profile setup modal ── */}
          {showProfileSetup && (
            <div style={{
              background: '#0d1117', border: '1px solid rgba(0,255,136,0.4)', borderRadius: '20px',
              padding: '32px', marginBottom: '28px', position: 'relative', overflow: 'hidden',
              opacity: 0, animation: 'fadeIn 0.5s ease forwards',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg,transparent,#00ff88,#00d4ff,transparent)' }} />
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#00ff88', letterSpacing: '0.1em', marginBottom: '12px' }}>
                // SETUP_YOUR_PROFILE
              </p>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: 800, color: '#e6edf3', marginBottom: '6px' }}>
                Set up your college profile
              </h2>
              <p style={{ color: '#8b949e', fontSize: '13px', marginBottom: '24px' }}>
                Join your college leaderboard and compete with batchmates
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={labelStyle}>$ college_name</label>
                  <input value={profileForm.college_name} onChange={e => setProfileForm(p => ({ ...p, college_name: e.target.value }))}
                    placeholder="e.g. IIT Delhi" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>$ year</label>
                  <select value={profileForm.college_year} onChange={e => setProfileForm(p => ({ ...p, college_year: e.target.value }))} style={selectStyle}>
                    {['1st', '2nd', '3rd', '4th'].map(y => <option key={y} value={y}>{y} Year</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>$ course</label>
                  <select value={profileForm.course} onChange={e => setProfileForm(p => ({ ...p, course: e.target.value }))} style={selectStyle}>
                    {['B.Tech CSE', 'B.Tech IT', 'MCA', 'BCA', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleSaveProfile} disabled={savingProfile} style={primaryBtn}>
                  {savingProfile ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : null}
                  SAVE_PROFILE →
                </button>
                <button onClick={() => setShowProfileSetup(false)} style={ghostBtn}>SKIP FOR NOW</button>
              </div>
            </div>
          )}

          {/* ── My rank card ── */}
          {userProfile && (
            <div style={{
              background: '#0d1117', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '20px',
              padding: '28px', marginBottom: '28px', position: 'relative', overflow: 'hidden',
              opacity: 0, animation: 'fadeIn 0.5s ease forwards 0.15s',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg,transparent,#00ff88,#00d4ff,transparent)' }} />

              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>

                {/* Rank badge + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '14px',
                    background: 'linear-gradient(135deg,rgba(0,255,136,0.15),rgba(0,212,255,0.1))',
                    border: '1px solid rgba(0,255,136,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: '16px', color: '#00ff88',
                  }}>
                    #{myGlobalRank || '?'}
                  </div>
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '16px', color: '#e6edf3' }}>
                      {currentUser.username}
                    </div>
                    {userProfile.college_name && (
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#484f58', marginTop: '3px' }}>
                        {userProfile.college_name} · {userProfile.college_year} · {userProfile.course}
                      </div>
                    )}
                  </div>
                </div>

                {/* Streak + activity grid */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: (userProfile.current_streak || 0) > 7 ? '2rem' : '1.5rem' }}>🔥</span>
                    <div>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: '24px', color: '#e6edf3' }}>
                        {userProfile.current_streak || 0}
                      </span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#8b949e', marginLeft: '4px' }}>
                        day streak
                      </span>
                    </div>
                    {(userProfile.longest_streak || 0) > 0 && (
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#484f58', marginLeft: '8px' }}>
                        best: {userProfile.longest_streak}d
                      </span>
                    )}
                  </div>
                  <ActivityGrid lastActiveDateStr={userProfile.last_active_date} />
                </div>

                {/* XP */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace", fontWeight: 900,
                    fontSize: '28px', color: '#00ff88',
                    textShadow: '0 0 20px rgba(0,255,136,0.4)',
                  }}>
                    {xpDisplay.toLocaleString()}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#484f58', letterSpacing: '0.1em' }}>
                    XP POINTS
                  </div>
                </div>

                {/* Problems solved */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: '28px', color: '#00d4ff' }}>
                    {userProfile.total_problems_solved || 0}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#484f58', letterSpacing: '0.1em' }}>
                    SOLVED
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab bar ── */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', opacity: 0, animation: 'fadeIn 0.5s ease forwards 0.25s' }}>
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '9px 20px', borderRadius: '20px', cursor: 'pointer',
                    border: isActive ? 'none' : '1px solid rgba(48,54,61,0.8)',
                    background: isActive ? 'linear-gradient(135deg,#00ff88,#00d4ff)' : 'transparent',
                    color: isActive ? '#030508' : '#8b949e',
                    fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '12px',
                    letterSpacing: '0.06em', transition: 'all 0.2s',
                  }}>
                  <span>{tab.icon}</span> {tab.label}
                </button>
              );
            })}
          </div>

          {/* ── TAB 1: GLOBAL ── */}
          {activeTab === 'global' && (
            <div style={{ opacity: 0, animation: 'fadeIn 0.4s ease forwards' }}>
              <LeaderboardTable data={globalData} currentUserId={currentUser.id} title="// GLOBAL_RANKINGS" subtitle="Top 50 coders worldwide" />
            </div>
          )}

          {/* ── TAB 2: COLLEGE ── */}
          {activeTab === 'college' && (
            <div style={{ opacity: 0, animation: 'fadeIn 0.4s ease forwards' }}>
              {!userProfile?.college_name ? (
                <div style={{ background: '#0d1117', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '20px', padding: '48px', textAlign: 'center' }}>
                  <GraduationCap size={40} color="#484f58" style={{ marginBottom: '16px' }} />
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '18px', color: '#e6edf3', marginBottom: '8px' }}>
                    Set up your college profile
                  </h3>
                  <p style={{ color: '#8b949e', fontSize: '13px', marginBottom: '20px' }}>
                    Enter your college to join the college leaderboard
                  </p>
                  <button onClick={() => setShowProfileSetup(true)} style={primaryBtn}>
                    SETUP_COLLEGE_PROFILE →
                  </button>
                </div>
              ) : (
                <LeaderboardTable data={collegeData} currentUserId={currentUser.id}
                  title={`// ${userProfile.college_name.toUpperCase().replace(/ /g, '_')}`}
                  subtitle="Top coders in your college" />
              )}
            </div>
          )}

          {/* ── TAB 3: FRIENDS ── */}
          {activeTab === 'friends' && (
            <div style={{ opacity: 0, animation: 'fadeIn 0.4s ease forwards' }}>
              {!friendGroup ? (
                <div>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#00ff88', letterSpacing: '0.12em', marginBottom: '20px' }}>
                    // CREATE_OR_JOIN_A_GANG
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '16px' }}>
                    {/* Create group */}
                    <div style={cardStyle}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg,transparent,#00ff88,transparent)', opacity: 0.5 }} />
                      <div style={{ fontSize: '28px', marginBottom: '12px' }}>⚔️</div>
                      <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '17px', color: '#e6edf3', marginBottom: '6px' }}>
                        Create a Gang
                      </h3>
                      <p style={{ color: '#8b949e', fontSize: '13px', marginBottom: '20px' }}>
                        Start your own private group and share the code with friends
                      </p>
                      {!showCreateGroup ? (
                        <button onClick={() => setShowCreateGroup(true)} style={primaryBtn}>
                          CREATE_GANG →
                        </button>
                      ) : createdGroupInfo ? (
                        <div>
                          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#00ff88', marginBottom: '8px' }}>
                            ✓ Gang created! Share this code:
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '8px', padding: '10px 14px' }}>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: '22px', color: '#00ff88', letterSpacing: '0.2em' }}>
                              {createdGroupInfo.invite_code}
                            </span>
                            <CopyButton text={createdGroupInfo.invite_code} />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <input value={groupName} onChange={e => setGroupName(e.target.value)}
                            placeholder="Gang name..." style={{ ...inputStyle, marginBottom: '12px' }} />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={handleCreateGroup} disabled={groupActionLoading} style={primaryBtn}>
                              {groupActionLoading ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : null}
                              CREATE →
                            </button>
                            <button onClick={() => setShowCreateGroup(false)} style={ghostBtn}>CANCEL</button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Join group */}
                    <div style={cardStyle}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg,transparent,#00d4ff,transparent)', opacity: 0.5 }} />
                      <div style={{ fontSize: '28px', marginBottom: '12px' }}>🔗</div>
                      <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '17px', color: '#e6edf3', marginBottom: '6px' }}>
                        Join a Gang
                      </h3>
                      <p style={{ color: '#8b949e', fontSize: '13px', marginBottom: '20px' }}>
                        Got an invite code? Paste it here to join your friend's group
                      </p>
                      {!showJoinGroup ? (
                        <button onClick={() => setShowJoinGroup(true)} style={{ ...primaryBtn, background: 'linear-gradient(135deg,#00d4ff,#a855f7)' }}>
                          JOIN_GANG →
                        </button>
                      ) : (
                        <div>
                          <input value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())}
                            placeholder="6-CHAR CODE" maxLength={6}
                            style={{ ...inputStyle, letterSpacing: '0.3em', fontSize: '18px', textAlign: 'center', marginBottom: '12px' }} />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={handleJoinGroup} disabled={groupActionLoading} style={{ ...primaryBtn, background: 'linear-gradient(135deg,#00d4ff,#a855f7)' }}>
                              {groupActionLoading ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : null}
                              JOIN →
                            </button>
                            <button onClick={() => setShowJoinGroup(false)} style={ghostBtn}>CANCEL</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Group header */}
                  <div style={{ ...cardStyle, marginBottom: '20px' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg,transparent,#00ff88,#00d4ff,transparent)', opacity: 0.5 }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#00ff88', letterSpacing: '0.1em', marginBottom: '4px' }}>
                          // YOUR_GANG
                        </p>
                        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '22px', color: '#e6edf3' }}>
                          {friendGroup.group_name}
                        </h2>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '8px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 900, fontSize: '18px', color: '#00ff88', letterSpacing: '0.2em' }}>
                            {friendGroup.invite_code}
                          </span>
                          <CopyButton text={friendGroup.invite_code} />
                        </div>
                        <button onClick={handleLeaveGroup} title="Leave gang" style={{
                          background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.25)',
                          borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#ff5050',
                          display: 'flex', alignItems: 'center',
                        }}>
                          <LogOut size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Group leaderboard */}
                  <LeaderboardTable
                    data={friendGroup.members || []}
                    currentUserId={currentUser.id}
                    title="// GANG_RANKINGS"
                    subtitle={`${(friendGroup.members || []).length} members competing`}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800;900&family=Syne:wght@400;600;700;800&display=swap');
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse-border{0%,100%{border-color:rgba(0,255,136,0.4)}50%{border-color:rgba(0,212,255,0.4)}}
      `}</style>
    </div>
  );
};

// ── shared LeaderboardTable sub-component ─────────────────────────────────────

const LeaderboardTable = ({ data, currentUserId, title, subtitle }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ background: '#0d1117', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '20px', padding: '48px', textAlign: 'center' }}>
        <Trophy size={40} color="#484f58" style={{ marginBottom: '16px' }} />
        <p style={{ color: '#484f58', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>
          No data yet — be the first to rank!
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: '#0d1117', border: '1px solid rgba(48,54,61,0.8)', borderRadius: '20px', overflow: 'hidden' }}>
      <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(48,54,61,0.6)' }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#00ff88', letterSpacing: '0.12em', marginBottom: '4px' }}>
          {title}
        </p>
        <p style={{ color: '#8b949e', fontSize: '13px' }}>{subtitle}</p>
      </div>
      {/* Column headers */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 20px', borderBottom: '1px solid rgba(48,54,61,0.4)' }}>
        <div style={{ width: '36px', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#484f58', letterSpacing: '0.08em' }}>RANK</div>
        <div style={{ width: '36px' }} />
        <div style={{ flex: 1, fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#484f58', letterSpacing: '0.08em' }}>USERNAME</div>
        <div style={{ width: '50px', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#484f58', letterSpacing: '0.08em', textAlign: 'center' }}>STREAK</div>
        <div style={{ width: '70px', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#484f58', letterSpacing: '0.08em', textAlign: 'right' }}>XP</div>
        <div style={{ width: '56px', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#484f58', letterSpacing: '0.08em', textAlign: 'right' }}>SOLVED</div>
      </div>
      <div style={{ padding: '12px 8px' }}>
        {data.map(entry => (
          <LeaderboardRow key={entry.user_id} entry={entry} isCurrentUser={entry.user_id === currentUserId} />
        ))}
      </div>
    </div>
  );
};

// ── shared styles ─────────────────────────────────────────────────────────────

const labelStyle = {
  fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#00ff88',
  letterSpacing: '0.1em', display: 'block', marginBottom: '6px',
};

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: '#080c12', border: '1px solid rgba(48,54,61,0.8)',
  borderRadius: '8px', padding: '10px 14px',
  color: '#e6edf3', fontFamily: "'JetBrains Mono', monospace",
  fontSize: '13px', outline: 'none',
};

const selectStyle = {
  ...inputStyle, cursor: 'pointer',
  appearance: 'none', WebkitAppearance: 'none',
};

const primaryBtn = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  background: 'linear-gradient(135deg,#00ff88,#00d4ff)',
  border: 'none', borderRadius: '10px', padding: '11px 20px',
  fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '13px',
  color: '#030508', cursor: 'pointer', letterSpacing: '0.06em',
  boxShadow: '0 0 20px rgba(0,255,136,0.2)',
};

const ghostBtn = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  background: 'transparent', border: '1px solid rgba(48,54,61,0.8)',
  borderRadius: '10px', padding: '11px 18px',
  fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '13px',
  color: '#8b949e', cursor: 'pointer', letterSpacing: '0.06em',
};

const cardStyle = {
  background: '#0d1117', border: '1px solid rgba(48,54,61,0.8)',
  borderRadius: '20px', padding: '28px', position: 'relative', overflow: 'hidden',
};

export default Leaderboard;
