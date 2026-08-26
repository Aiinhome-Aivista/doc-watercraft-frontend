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
  LogOut,
  Key
} from 'lucide-react';
import logo from '../assets/logo.jpeg';
import { Modal, Input, Button, GlobalLoader } from '@/components/ui';
import { authService } from '@/services/authService';
import { toast } from 'react-hot-toast';


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

  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [changePasswordForm, setChangePasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [changePasswordErrors, setChangePasswordErrors] = useState<Record<string, string>>({});
  const [changePasswordGlobalError, setChangePasswordGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  // Read user data and access rights from localStorage
  let userRole = '';
  let allowedModules: string[] = [];
  try {
    const raw = localStorage.getItem('user_data');
    if (raw) {
      const user = JSON.parse(raw);
      userRole = user.role || '';
      allowedModules = user.access_rights?.modules || [];
    }
  } catch (e) {
    console.error('Failed to parse user data in MainLayout', e);
  }

  const isAdmin = userRole === 'admin';

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

  const toggleSubMenu = (module: string) => {
    setExpandedMenu((prev) => (prev === module ? null : module));
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    navigate('/');
  };

  const handleChangePasswordChange = (field: string, value: string) => {
    setChangePasswordForm((prev) => ({ ...prev, [field]: value }));
    if (changePasswordErrors[field]) {
      setChangePasswordErrors((prev) => ({ ...prev, [field]: "" }));
    }
    setChangePasswordGlobalError(null);
  };

  const handleChangePasswordSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!changePasswordForm.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setChangePasswordErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      await authService.changePassword({
        new_password: changePasswordForm.newPassword
      });
      
      toast.success("Password updated successfully");
      setIsChangePasswordModalOpen(false);
      setChangePasswordForm({ newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      console.error("Failed to change password:", err);
      const errMsg = err.response?.data?.message || "Failed to update password. Please try again.";
      setChangePasswordGlobalError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Map from module key -> { label, icon, path }
  const allNavItems = [
    { module: 'DASHBOARD', label: 'DASHBOARD', icon: <LayoutDashboard size={18} />, path: '/dashboard' },
    { module: 'PARTY_MASTER', label: 'PARTY MASTER', icon: <Users size={18} />, path: '/party-master' },
    { module: 'VEHICLE_MASTER', label: 'VEHICLE MASTER', icon: <Truck size={18} />, path: '/vehicle-master' },
    { module: 'VESSEL_OPS', label: 'VESSEL OPS', icon: <Anchor size={18} />, path: '/vessels' },
    { module: 'VEHICLE_LOGISTICS', label: 'VEHICLE LOGISTICS', icon: <Truck size={18} />, path: '/vehicles' },
    { module: 'WEIGHBRIDGE_TERMINAL', label: 'WEIGHBRIDGE TERMINAL', icon: <Scale size={18} />, path: '/weighbridge' },
    { 
      module: 'REPORTS_BILLING', 
      label: 'REPORTS & BILLING', 
      icon: <FileText size={18} />, 
      path: '#', // Parent items don't have a direct route
      children: [
        { module: 'FINANCE_GENERATE_BILL', label: 'GENERATE BILL', path: '/finance/generate-bill' },
        { module: 'FINANCE_ALL_BILLS', label: 'ALL BILLS', path: '/finance/all-bills' },
        { module: 'FINANCE_VESSEL_REPORT', label: 'VESSEL REPORT', path: '/finance/vessel-report' },
      ]
    },
  ];

  // Filter nav items based on the user's allowed modules
  const navItems = allNavItems.filter((item) => {
    if (item.children) {
      return item.children.some((child) => allowedModules.includes(child.module));
    }
    return allowedModules.includes(item.module);
  });

  const getPageTitle = () => {
    let titleItem = navItems.find(i => i.path === location.pathname);
    if (!titleItem) {
      navItems.forEach(i => {
        if (i.children) {
          const child = i.children.find(c => c.path === location.pathname);
          if (child) titleItem = child;
        }
      });
    }
    if (titleItem) return titleItem.label;
    if (location.pathname === '/settings' && isAdmin) return 'SETTINGS';
    return 'DOCK SYSTEM';
  };

  return (
    <div className="app">
      {loading && <GlobalLoader />}
      {sidebarOpen && <div className="sidebar-backdrop" onClick={closeSidebar} />}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <img src={logo} alt="IRC Group" className="sidebar-logo-img" />
          <div>
            <div className="logo-mark">DOCK SYS</div>
            <div className="logo-sub">Vessel & Logistics</div>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-section-label">Main Navigation</div>
          {navItems.map((item) => {
            if (item.children) {
              const hasActiveChild = item.children.some((c) => location.pathname.startsWith(c.path));
              const isExpanded = expandedMenu === item.module || hasActiveChild;
              
              return (
                <div key={item.module} className="nav-item-group">
                  <div 
                    className={`nav-item ${hasActiveChild ? 'active' : ''}`}
                    onClick={() => toggleSubMenu(item.module)}
                    style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="nav-icon">{item.icon}</span>
                      {item.label}
                    </div>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </div>
                  {isExpanded && (
                    <div className="sub-nav" style={{ paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px', marginBottom: '8px' }}>
                      {item.children.filter((child) => allowedModules.includes(child.module)).map((child) => (
                        <Link 
                          key={child.path} 
                          to={child.path} 
                          className={`nav-item ${location.pathname === child.path ? 'active' : ''}`}
                          onClick={closeSidebar}
                          style={{ fontSize: '13px', padding: '8px 12px', minHeight: 'auto', background: 'transparent' }}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
          
          
          {isAdmin && (
            <>
              <div className="nav-section-label" style={{ marginTop: 20 }}>System</div>
              <Link to="/settings" className={`nav-item ${location.pathname === '/settings' ? 'active' : ''}`} onClick={closeSidebar}>
                <span className="nav-icon"><Settings size={18} /></span>
                SETTINGS
              </Link>
            </>
          )}
          

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
                       color: 'var(--text)',
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
                       setIsChangePasswordModalOpen(true);
                       setChangePasswordForm({ newPassword: "", confirmPassword: "" });
                       setChangePasswordErrors({});
                       setChangePasswordGlobalError(null);
                     }}
                   >
                     <Key size={16} />
                     Change Password
                   </button>
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

      {isChangePasswordModalOpen && (
        <Modal
          title="CHANGE MY PASSWORD"
          onClose={() => setIsChangePasswordModalOpen(false)}
          width={400}
          footer={
            <>
              <Button variant="ghost" onClick={() => setIsChangePasswordModalOpen(false)}>
                CANCEL
              </Button>
              <Button variant="primary" onClick={handleChangePasswordSubmit}>
                UPDATE PASSWORD
              </Button>
            </>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "8px 0" }}>
            {changePasswordGlobalError && (
              <div style={{ padding: "12px", backgroundColor: "rgba(230, 57, 70, 0.1)", border: "1px solid #e63946", borderRadius: "8px", color: "#e63946", fontSize: "14px", textAlign: "center", fontWeight: "bold" }}>
                {changePasswordGlobalError}
              </div>
            )}
            <Input label="New Password *" placeholder="••••••••" type="password" value={changePasswordForm.newPassword} onChange={(e) => handleChangePasswordChange("newPassword", e.target.value)} error={changePasswordErrors.newPassword} />
            <Input label="Confirm New Password *" placeholder="••••••••" type="password" value={changePasswordForm.confirmPassword} onChange={(e) => handleChangePasswordChange("confirmPassword", e.target.value)} error={changePasswordErrors.confirmPassword} />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MainLayout;
