import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  FileBox, 
  LogOut, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export function Layout() {
  const { profile, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Batches', icon: Users, path: '/batches' },
    { label: 'Reports', icon: FileBox, path: '/reports' },
  ];

  return (
    <div className="flex h-screen bg-[#f5f5f0] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-[#e5e5e0] flex flex-col flex-shrink-0">
        <div className="p-8">
          <Link to="/" className="flex items-center gap-3">
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
              <div className="flex items-center gap-3 px-4 py-3 text-gray-500">
                <ShieldCheck size={20} className="text-[#5A5A40]" />
                <span className="font-medium">Admin Panel</span>
              </div>
            </div>
          )}
        </nav>

        <div className="p-6 border-t border-[#f0f0ed]">
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
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scroll-smooth">
        <div className="p-10 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
