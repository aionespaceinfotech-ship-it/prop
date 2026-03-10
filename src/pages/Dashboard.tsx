import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { usePermissions } from '../hooks/usePermissions';
import { motion } from 'motion/react';
import { 
  Home, 
  Users, 
  Handshake, 
  Calendar, 
  TrendingUp, 
  PlusCircle,
  UserPlus,
  CalendarPlus,
  CheckCircle2,
  Bell,
  ArrowUpRight,
  Target,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

interface Stats {
  totalProperties: number;
  availableProperties: number;
  totalLeads: number;
  activeDeals: number;
  upcomingVisits: number;
}

const chartData = [
  { name: 'Mon', leads: 4, visits: 2 },
  { name: 'Tue', leads: 7, visits: 5 },
  { name: 'Wed', leads: 5, visits: 8 },
  { name: 'Thu', leads: 9, visits: 4 },
  { name: 'Fri', leads: 12, visits: 7 },
  { name: 'Sat', leads: 8, visits: 10 },
  { name: 'Sun', leads: 6, visits: 3 },
];

export default function Dashboard() {
  const api = useApi();
  const { userName, isManager, currentRole } = usePermissions();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats')
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-6 lg:p-10 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-emerald-50 border-t-emerald-600 rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-slate-900 font-bold">Synchronizing Engine</p>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-[0.2em] mt-1">Fetching latest metrics...</p>
        </div>
      </div>
    </div>
  );

  const cards = [
    { title: 'Portfolio', value: stats?.totalProperties, icon: Home, color: 'text-blue-600', bg: 'bg-blue-50', link: '/properties', trend: '+5%' },
    { title: 'Live Inventory', value: stats?.availableProperties, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/properties', trend: '+12%' },
    { title: 'Pipeline', value: stats?.totalLeads, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50', link: '/leads', trend: '+18%' },
    { title: 'Deals Flow', value: stats?.activeDeals, icon: Handshake, color: 'text-indigo-600', bg: 'bg-indigo-50', link: '/deals', trend: '+2%' },
    { title: 'Site Visits', value: stats?.upcomingVisits, icon: Calendar, color: 'text-rose-600', bg: 'bg-rose-50', link: '/visits', trend: '+24%' },
  ];

  return (
    <div className="p-6 lg:p-10 space-y-10 max-w-[1700px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back, {userName?.split(' ')[0]}!</h1>
          <p className="text-slate-500 mt-1 font-medium italic">You are logged in as <span className="text-emerald-600 font-bold not-italic">{currentRole}</span>. Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm relative group">
            <Bell size={20} className="group-hover:shake" />
            <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
          </button>
          <Button className="rounded-2xl shadow-xl shadow-emerald-200 px-6">
            <Zap size={18} className="mr-2" />
            Launch Action
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {cards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05, type: 'spring', stiffness: 100 }}
          >
            <Link to={card.link}>
              <Card className="h-full hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-2 transition-all duration-500 group border-none bg-white shadow-sm ring-1 ring-slate-200/50">
                <div className="p-6">
                  <div className={`w-12 h-12 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-sm`}>
                    <card.icon size={24} />
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{card.title}</p>
                      <h3 className="text-3xl font-black text-slate-900 mt-1 tabular-nums">{card.value}</h3>
                    </div>
                    <span className="flex items-center text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">
                      {card.trend}
                      <ArrowUpRight size={10} className="ml-0.5" />
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Chart */}
        <Card className="xl:col-span-2 border-none shadow-sm ring-1 ring-slate-200/50 p-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <Target size={200} />
          </div>
          
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Performance Velocity</h3>
              <p className="text-sm font-medium text-slate-400">Comparing lead generation vs visit conversion.</p>
            </div>
            <div className="flex items-center gap-6 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Leads</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Visits</span>
              </div>
            </div>
          </div>
          
          <div className="h-[380px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 800 }}
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 800 }}
                />
                <Tooltip 
                  cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="leads" 
                  stroke="#10b981" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorLeads)" 
                  animationDuration={2000}
                />
                <Area 
                  type="monotone" 
                  dataKey="visits" 
                  stroke="#3b82f6" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorVisits)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Quick Actions & Notifications */}
        <div className="space-y-8">
          <Card className="border-none shadow-sm ring-1 ring-slate-200/50 p-8 bg-slate-900 text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent pointer-events-none" />
            <h3 className="text-lg font-black tracking-tight mb-6 relative z-10">Quick Operations</h3>
            <div className="grid grid-cols-2 gap-4 relative z-10">
              {[
                { label: 'Add Property', icon: PlusCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10', link: '/properties' },
                { label: 'New Lead', icon: UserPlus, color: 'text-blue-400', bg: 'bg-blue-400/10', link: '/leads' },
                { label: 'Schedule Visit', icon: CalendarPlus, color: 'text-rose-400', bg: 'bg-rose-400/10', link: '/visits' },
                { label: isManager ? 'Manage Team' : 'My Goals', icon: isManager ? UserPlus : Target, color: 'text-amber-400', bg: 'bg-amber-400/10', link: isManager ? '/users' : '/dashboard' },
              ].map((action) => (
                <Link 
                  key={action.label}
                  to={action.link} 
                  className="flex flex-col items-center justify-center p-5 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5 group"
                >
                  <div className={`p-3 ${action.bg} ${action.color} rounded-xl mb-3 group-hover:scale-110 transition-transform`}>
                    <action.icon size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{action.label}</span>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-slate-200/50 p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Active Pulse</h3>
              <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-rose-100">Live</span>
            </div>
            <div className="space-y-6">
              {[
                { title: 'Visit Reminder', desc: 'Site visit for Seaside Villa at 4:00 PM.', time: '10:30 AM', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
                { title: 'Lead Assigned', desc: '"Apartment Inquiry" needs response.', time: 'Yesterday', icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
                { title: 'Deal Milestone', desc: 'Green Valley Plot entered Negotiation.', time: '2 days ago', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              ].map((note, i) => (
                <div key={i} className="flex gap-4 group cursor-pointer">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 shadow-sm", note.bg, note.color)}>
                    <note.icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold text-slate-900 truncate group-hover:text-emerald-600 transition-colors">{note.title}</p>
                      <span className="text-[9px] font-black text-slate-300 uppercase shrink-0 ml-2">{note.time}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 font-medium">{note.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-10 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-emerald-600 hover:bg-slate-50 rounded-xl py-4 border border-dashed border-slate-200">
              Explore History Log
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
