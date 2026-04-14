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
  User
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
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

  const navItemBase =
    "flex items-center gap-2.5 border-l-2 border-transparent px-5 py-2.5 text-[15px] font-medium tracking-[0.03em] text-slate-400 no-underline transition-colors [font-family:'Barlow_Condensed',sans-serif] hover:bg-slate-900 hover:text-slate-200";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-200 [font-family:'Barlow',sans-serif]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[1100] bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-[1200] flex h-screen w-[220px] min-w-[220px] flex-col border-r border-slate-800 bg-slate-950 transition-transform duration-200 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="border-b border-slate-800 px-5 pb-4 pt-5">
          <div className="text-[22px] font-extrabold leading-none tracking-[0.12em] text-cyan-400 [font-family:'Barlow_Condensed',sans-serif]">DOCK SYS</div>
          <div className="mt-1 text-[9px] uppercase tracking-[0.15em] text-slate-500 [font-family:'IBM_Plex_Mono',monospace]">Vessel & Logistics</div>
        </div>
        
        <nav className="flex-1 py-3">
          <div className="px-5 pb-1 pt-2 text-[9px] uppercase tracking-[0.2em] text-slate-500 [font-family:'IBM_Plex_Mono',monospace]">Main Navigation</div>
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`${navItemBase} ${location.pathname === item.path ? 'border-l-cyan-400 bg-cyan-500/10 text-cyan-300' : ''}`}
              onClick={closeSidebar}
            >
              <span className="flex w-5 items-center justify-center text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
          
          <div className="mt-5 px-5 pb-1 pt-2 text-[9px] uppercase tracking-[0.2em] text-slate-500 [font-family:'IBM_Plex_Mono',monospace]">System</div>
          <Link to="/settings" className={navItemBase} onClick={closeSidebar}>
            <span className="flex w-5 items-center justify-center text-base"><Settings size={18} /></span>
            SETTINGS
          </Link>
        </nav>
      </aside>

      <main className="flex w-full flex-1 flex-col overflow-hidden">
        <header className="flex h-[50px] flex-shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-3 lg:h-[52px] lg:px-6">
          <div className="flex items-center gap-2.5">
            <button
              className="inline-flex items-center rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-slate-100 lg:hidden"
              onClick={toggleSidebar}
              title="Toggle Navigation"
              aria-label="Toggle Navigation Menu"
            >
              <Menu size={16} />
            </button>
            <div className="max-w-[60vw] truncate text-base font-bold tracking-[0.07em] text-slate-100 [font-family:'Barlow_Condensed',sans-serif] lg:max-w-none lg:text-xl">{getPageTitle()}</div>
          </div>
          <div className="flex items-center gap-1.5 lg:gap-2">
             <button className="inline-flex items-center rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-slate-100"><Bell size={16} /></button>
             <button className="inline-flex items-center rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-slate-100"><User size={16} /></button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-3 lg:p-6">
          {children}
        </section>
      </main>
    </div>
  );
};

export default MainLayout;
