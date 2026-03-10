import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Home, 
  Building2,
  Users, 
  UserCircle, 
  Calendar, 
  Handshake, 
  BarChart3, 
  UserCog,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Settings,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const isManager = user?.role === 'Admin' || user?.role === 'Super Admin';

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Properties', path: '/properties', icon: Home },
    { name: 'Projects', path: '/projects', icon: Building2 },
    { name: 'Leads', path: '/leads', icon: Users },
    { name: 'Clients', path: '/clients', icon: UserCircle },
    { name: 'Visits', path: '/visits', icon: Calendar },
    { name: 'Deals', path: '/deals', icon: Handshake },
    { name: 'Reports', path: '/reports', icon: BarChart3, adminOnly: true },
    { name: 'User Management', path: '/users', icon: UserCog, adminOnly: true },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Toggle */}
      <motion.button 
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-3 bg-white rounded-full shadow-lg border border-slate-200 text-slate-600"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </motion.button>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 transform transition-transform duration-500 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Brand */}
          <div className="p-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200 group cursor-pointer">
                <Building2 className="text-white group-hover:scale-110 transition-transform" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">PropBroker</h1>
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.3em] mt-1.5">Enterprise</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 space-y-1.5 overflow-y-auto no-scrollbar">
            <p className="px-4 mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Main Menu</p>
            {navItems.map((item) => {
              if (item.adminOnly && !isManager) return null;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) => cn(
                    "group flex items-center justify-between px-4 py-3.5 text-sm font-bold rounded-2xl transition-all duration-300",
                    isActive 
                      ? "bg-slate-900 text-white shadow-xl shadow-slate-200" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <div className="flex items-center">
                    <item.icon className={cn(
                      "mr-3 h-5 w-5 transition-transform duration-300",
                      "group-hover:scale-110"
                    )} />
                    {item.name}
                  </div>
                  <ChevronRight className={cn(
                    "h-4 w-4 opacity-0 -translate-x-2 transition-all duration-300",
                    "group-hover:opacity-100 group-hover:translate-x-0"
                  )} />
                </NavLink>
              );
            })}

            <div className="pt-8 space-y-1.5">
              <p className="px-4 mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">System</p>
              {isManager ? (
                <NavLink
                  to="/settings"
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) => cn(
                    "w-full group flex items-center justify-between px-4 py-3.5 text-sm font-bold rounded-2xl transition-all duration-300",
                    isActive ? "bg-slate-900 text-white shadow-xl shadow-slate-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <div className="flex items-center">
                    <Settings className="mr-3 h-5 w-5 group-hover:rotate-45 transition-transform duration-500" />
                    Settings
                  </div>
                </NavLink>
              ) : null}
              <NavLink
                to="/support"
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => cn(
                  "w-full group flex items-center justify-between px-4 py-3.5 text-sm font-bold rounded-2xl transition-all duration-300",
                  isActive ? "bg-slate-900 text-white shadow-xl shadow-slate-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className="flex items-center">
                  <HelpCircle className="mr-3 h-5 w-5" />
                  Support
                </div>
              </NavLink>
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-8 mt-auto">
            <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Sparkles size={40} className="text-slate-900" />
              </div>
              
              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-900 font-black text-lg ring-1 ring-slate-200">
                  {user?.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-900 truncate">{user?.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{user?.role}</p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center justify-center w-full px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-white border border-slate-200 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all shadow-sm relative z-10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-md lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
