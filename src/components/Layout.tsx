import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  FileBox, 
  LogOut, 
  ShieldCheck,
  Moon,
  Sun,
  Menu,
  X,
  ScrollText,
  UserCog
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { useState } from 'react';

export function Layout() {
  const { profile, logout, darkMode, toggleDarkMode } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Batches', icon: Users, path: '/batches' },
    { label: 'Reports', icon: FileBox, path: '/reports' },
  ];

  const adminItems = [
    { label: 'User Management', icon: UserCog, path: '/admin/users' },
    { label: 'Audit Log', icon: ScrollText, path: '/admin/audit' },
  ];

  const sidebar = (
    <>
      <div className="p-8">
        <Link to="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
          <div className="w-10 h-10 bg-[#5A5A40] rounded-xl flex items-center justify-center">
            <span className="text-white font-serif text-xl font-bold">C</span>
          </div>
          <div>
            <h2 className="font-serif text-xl text-[#1a1a1a]">Cohort</h2>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Attendance Tracker</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
                         (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 group",
                isActive 
                  ? "bg-[#1a1a1a] text-white" 
                  : "text-gray-500 hover:bg-gray-100"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </div>
              {isActive && (
                <motion.div layoutId="activeNav" className="w-1.5 h-1.5 bg-[#5A5A40] rounded-full" />
              )}
            </Link>
          );
        })}

        {profile?.role === 'admin' && (
          <div className="pt-6 border-t border-[#f0f0ed] mt-4">
            <p className="px-4 text-[10px] uppercase font-bold text-gray-400 mb-2">Administration</p>
            {adminItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200",
                    isActive 
                      ? "bg-[#5A5A40] text-white" 
                      : "text-gray-500 hover:bg-gray-100"
                  )}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <div className="p-6 border-t border-[#f0f0ed]">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-100 rounded-2xl transition-colors font-medium mb-3"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <div className="flex items-center gap-3 mb-6 bg-gray-50 p-4 rounded-2xl">
          <div className="w-10 h-10 rounded-full bg-[#e5e5e0] flex items-center justify-center text-sm font-bold text-gray-600">
            {profile?.fullName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate text-[#1a1a1a]">{profile?.fullName}</p>
            <p className="text-[10px] uppercase text-gray-400 font-bold">{profile?.role}</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-2xl transition-colors font-medium"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[#f5f5f0] overflow-hidden">
      {/* Mobile menu button */}
      <button 
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white rounded-xl border border-[#e5e5e0] flex items-center justify-center shadow-lg"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "bg-white border-r border-[#e5e5e0] flex flex-col flex-shrink-0 transition-transform duration-300 z-40",
        "w-72",
        "lg:relative lg:translate-x-0",
        "fixed h-full",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {sidebar}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scroll-smooth">
        <div className="p-6 lg:p-10 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
