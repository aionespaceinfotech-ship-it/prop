import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Home, 
  Building2,
  Users,
  Menu
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BottomNavProps {
  onMenuClick: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onMenuClick }) => {
  const navItems = [
    { name: 'Home', path: '/', icon: LayoutDashboard },
    { name: 'Properties', path: '/properties', icon: Home },
    { name: 'Projects', path: '/projects', icon: Building2 },
    { name: 'Leads', path: '/leads', icon: Users },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-slate-200 pb-safe">
      <nav className="flex items-center justify-around h-16 px-2 max-w-md mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center flex-1 h-full transition-all gap-1",
              isActive ? "text-slate-900" : "text-slate-400"
            )}
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  "p-1.5 rounded-xl transition-all",
                  isActive ? "bg-slate-100 text-slate-900 scale-110" : "bg-transparent"
                )}>
                  <item.icon size={20} />
                </div>
                <span className="text-[10px] font-bold tracking-tight">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center flex-1 h-full text-slate-400 active:scale-95 transition-all gap-1"
        >
          <div className="p-1.5">
            <Menu size={20} />
          </div>
          <span className="text-[10px] font-bold tracking-tight">More</span>
        </button>
      </nav>
    </div>
  );
};
