import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Anchor, 
  Truck, 
  Scale,
  FileText, 
  Settings,
  Menu,
  Bell,
  User,
  Sun,
  Moon,
  Users,
  LogOut
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    navigate('/');
  };

  const navItems = [
    { label: 'DASHBOARD', icon: <LayoutDashboard size={18} />, path: '/dashboard' },
    { label: 'PARTY MASTER', icon: <Users size={18} />, path: '/party-master' },
    { label: 'VESSEL OPS', icon: <Anchor size={18} />, path: '/vessels' },
    { label: 'VEHICLE LOGISTICS', icon: <Truck size={18} />, path: '/vehicles' },
    { label: 'WEIGHBRIDGE TERMINAL', icon: <Scale size={18} />, path: '/weighbridge' },
    { label: 'REPORTS & BILLING', icon: <FileText size={18} />, path: '/finance' },
  ];

  const getPageTitle = () => {
    const item = navItems.find(i => i.path === location.pathname);
    return item ? item.label : 'DOCK SYSTEM';
  };

  return (
    <div className="app">
      {sidebarOpen && <div className="sidebar-backdrop" onClick={closeSidebar} />}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-mark">DOCK SYS</div>
          <div className="logo-sub">Vessel & Logistics</div>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-section-label">Main Navigation</div>
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
          
          <div className="nav-section-label" style={{ marginTop: 20 }}>System</div>
          <Link to="/settings" className="nav-item" onClick={closeSidebar}>
            <span className="nav-icon"><Settings size={18} /></span>
            SETTINGS
          </Link>
          

        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="btn btn-ghost btn-sm mobile-menu-btn" onClick={toggleSidebar} title="Toggle Navigation" aria-label="Toggle Navigation Menu">
              <Menu size={16} />
            </button>
            <div className="topbar-title">{getPageTitle()}</div>
          </div>
          <div className="topbar-right">
             <button className="btn btn-ghost btn-sm" onClick={toggleTheme} title="Toggle Theme">
               {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
             </button>
             <button className="btn btn-ghost btn-sm"><Bell size={16} /></button>
             
             <div ref={profileRef} style={{ position: 'relative' }}>
               <button 
                 className={`btn btn-ghost btn-sm ${profileOpen ? 'active' : ''}`} 
                 onClick={() => setProfileOpen(!profileOpen)}
               >
                 <User size={16} />
               </button>
               
               {profileOpen && (
                 <div style={{
                   position: 'absolute',
                   top: 'calc(100% + 8px)',
                   right: 0,
                   width: '180px',
                   backgroundColor: 'var(--bg2)',
                   border: '1px solid var(--border)',
                   borderRadius: '8px',
                   boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2), 0 4px 6px -2px rgba(0,0,0,0.1)',
                   zIndex: 100,
                   overflow: 'hidden'
                 }}>
                   <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                     My Account
                   </div>
                   <button
                     style={{
                       width: '100%',
                       background: 'transparent',
                       border: 'none',
                       padding: '12px 16px',
                       display: 'flex',
                       alignItems: 'center',
                       gap: '12px',
                       color: '#e63946',
                       fontSize: '14px',
                       fontWeight: 500,
                       cursor: 'pointer',
                       transition: 'background-color 0.2s',
                       textAlign: 'left'
                     }}
                     onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--hover)')}
                     onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                     onClick={() => {
                       setProfileOpen(false);
                       handleLogout();
                     }}
                   >
                     <LogOut size={16} />
                     Logout
                   </button>
                 </div>
               )}
             </div>
          </div>
        </header>

        <section className="page-content">
          {children}
        </section>
      </main>
    </div>
  );
};

export default MainLayout;
