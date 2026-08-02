import { useNavigate, useLocation } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LayoutDashboard, Sparkles, BookOpen, Trophy, LogOut, ChevronDown } from 'lucide-react';

const Navbar = ({ currentUser, logoutUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: '/problems', label: 'Problems', icon: BookOpen },
    { path: '/generate-roadmap', label: 'Patterns', icon: Sparkles },
    { path: '/dashboard', label: 'Progress', icon: LayoutDashboard },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  return (
    <nav style={{
      background: 'rgba(10,10,15,0.92)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(232,194,122,0.15)',
      position: 'sticky', top: 0, zIndex: 100,
    }} data-testid="navbar">
      <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'0 24px', height:'60px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>

        {/* Logo */}
        <div
          onClick={() => navigate('/')}
          className="logo-dsacharya"
          style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontFamily: "'Space Mono', monospace", fontSize: '16px', letterSpacing: '0.06em' }}
          data-testid="nav-logo"
        >
          <span style={{ color: '#e8c27a', fontWeight: 700 }}>&gt;_</span>
          <span style={{ color: '#ffffff', fontWeight: 700 }}>DSAcharya</span>
        </div>

        {/* Links */}
        {currentUser && (
          <div style={{ display:'flex', gap:'6px' }}>
            {navLinks.map(({ path, label, icon: Icon }, idx) => (
              <button key={`${path}-${idx}`} onClick={() => navigate(path)} data-testid={`nav-${label.toLowerCase()}`}
                style={{
                  display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px',
                  background: isActive(path) ? 'rgba(232,194,122,0.12)' : 'transparent',
                  border: isActive(path) ? '1px solid rgba(232,194,122,0.3)' : '1px solid transparent',
                  borderRadius:'8px',
                  color: isActive(path) ? '#e8c27a' : 'rgba(255,255,255,0.6)',
                  fontFamily:"'Space Mono',monospace", fontSize:'12px', fontWeight:600,
                  cursor:'pointer', transition:'all 0.2s', letterSpacing:'0.02em',
                }}
                onMouseOver={e => { if(!isActive(path)){ e.currentTarget.style.color='#ffffff'; e.currentTarget.style.background='rgba(232,194,122,0.06)'; }}}
                onMouseOut={e => { if(!isActive(path)){ e.currentTarget.style.color='rgba(255,255,255,0.6)'; e.currentTarget.style.background='transparent'; }}}
              >
                <Icon size={13}/> {label}
              </button>
            ))}
          </div>
        )}

        {/* User dropdown */}
        {currentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button style={{
                display:'flex', alignItems:'center', gap:'8px',
                background:'rgba(232,194,122,0.08)', border:'1px solid rgba(232,194,122,0.25)',
                borderRadius:'10px', padding:'6px 12px', cursor:'pointer',
              }} data-testid="nav-user-menu">
                <div style={{
                  width:'26px', height:'26px', background:'#e8c27a',
                  borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center',
                  fontFamily:"'Space Mono',monospace", fontSize:'12px', fontWeight:800, color:'#0a0a0f',
                }}>{currentUser.username.charAt(0).toUpperCase()}</div>
                <span style={{ fontFamily:"'Space Mono',monospace", fontSize:'12px', color:'#ffffff', fontWeight:600 }}>{currentUser.username}</span>
                <ChevronDown size={12} color="#e8c27a"/>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" style={{ background:'#0a0a0f', border:'1px solid rgba(232,194,122,0.2)', borderRadius:'12px', minWidth:'180px' }}>
              <DropdownMenuLabel>
                <div style={{ fontFamily:"'Space Mono',monospace" }}>
                  <div style={{ color:'#ffffff', fontWeight:700, fontSize:'13px' }}>{currentUser.username}</div>
                  <div style={{ color:'rgba(255,255,255,0.45)', fontSize:'11px', marginTop:'2px' }}>{currentUser.email}</div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator style={{ background:'rgba(232,194,122,0.15)' }}/>
              {navLinks.map(({ label, path, icon: Icon }, idx) => (
                <DropdownMenuItem key={`menu-${path}-${idx}`} onClick={() => navigate(path)} style={{ color:'rgba(255,255,255,0.7)', fontFamily:"'Space Mono',monospace", fontSize:'12px', cursor:'pointer' }}>
                  <Icon size={13} style={{ marginRight:'8px', color: '#e8c27a' }}/>{label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator style={{ background:'rgba(255,80,80,0.12)' }}/>
              <DropdownMenuItem onClick={() => { logoutUser(); navigate('/'); }} data-testid="menu-logout" style={{ color:'#ff5050', fontFamily:"'Space Mono',monospace", fontSize:'12px', cursor:'pointer' }}>
                <LogOut size={13} style={{ marginRight:'8px' }}/> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </nav>
  );
};
export default Navbar;