import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  Moon
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };
  const navItems = [
    { label: 'DASHBOARD', icon: <LayoutDashboard size={18} />, path: '/' },
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
      <aside className="sidebar">
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
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
          
          <div className="nav-section-label" style={{ marginTop: 20 }}>System</div>
          <Link to="/settings" className="nav-item">
            <span className="nav-icon"><Settings size={18} /></span>
            SETTINGS
          </Link>
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-title">{getPageTitle()}</div>
          <div className="topbar-right">
             <button className="btn btn-ghost btn-sm" onClick={toggleTheme} title="Toggle Theme">
               {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
             </button>
             <button className="btn btn-ghost btn-sm"><Bell size={16} /></button>
             <button className="btn btn-ghost btn-sm"><User size={16} /></button>
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
