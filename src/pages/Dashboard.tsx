import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { motion } from 'motion/react';
import { 
  Home, 
  Users, 
  Handshake, 
  Calendar, 
  TrendingUp, 
  ArrowRight,
  PlusCircle,
  UserPlus,
  CalendarPlus,
  CheckCircle2,
  Bell,
  Search,
  Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { formatCurrency, formatDate } from '../utils/formatters';
import { cn } from '../utils/cn';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
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
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats')
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-6 lg:p-10 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse">Preparing your workspace...</p>
      </div>
    </div>
  );

  const cards = [
    { title: 'Properties', value: stats?.totalProperties, icon: Home, color: 'text-blue-600', bg: 'bg-blue-50', link: '/properties' },
    { title: 'Available', value: stats?.availableProperties, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/properties' },
    { title: 'Leads', value: stats?.totalLeads, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50', link: '/leads' },
    { title: 'Active Deals', value: stats?.activeDeals, icon: Handshake, color: 'text-indigo-600', bg: 'bg-indigo-50', link: '/deals' },
    { title: 'Visits', value: stats?.upcomingVisits, icon: Calendar, color: 'text-rose-600', bg: 'bg-rose-50', link: '/visits' },
  ];

  return (
    <div className="p-6 lg:p-10 space-y-10 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <PageHeader 
          title="Overview" 
          subtitle="Real-time performance metrics and quick actions."
        />
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search anything..." 
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all w-64"
            />
          </div>
          <Button variant="outline" size="sm" className="rounded-xl">
            <Filter size={16} className="mr-2" />
            Filters
          </Button>
          <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {cards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Link to={card.link}>
              <Card className="h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group border-none bg-white shadow-sm ring-1 ring-slate-200/50">
                <div className="p-6">
                  <div className={`w-12 h-12 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                    <card.icon size={24} />
                  </div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{card.title}</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <h3 className="text-3xl font-bold text-slate-900">{card.value}</h3>
                    <span className="text-xs font-bold text-emerald-500">+12%</span>
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Chart */}
        <Card className="xl:col-span-2 border-none shadow-sm ring-1 ring-slate-200/50 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Activity Trends</h3>
              <p className="text-sm text-slate-500">Leads and visits over the last 7 days</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                <span className="text-xs font-bold text-slate-600">Leads</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-xs font-bold text-slate-600">Visits</span>
              </div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="leads" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorLeads)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="visits" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorVisits)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-12 pt-10 border-t border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-slate-900">Recent Deals</h3>
              <Link to="/deals" className="text-xs font-bold text-emerald-600 uppercase tracking-widest hover:underline">View All Deals</Link>
            </div>
            <div className="space-y-4">
              {[
                { title: 'Seaside Villa Sale', client: 'Amit Sharma', amount: '₹1.5 Cr', status: 'Closed', date: '2h ago' },
                { title: 'Skyline Penthouse', client: 'Priya Verma', amount: '₹85 L', status: 'Negotiation', date: '5h ago' },
                { title: 'Green Valley Plot', client: 'Rahul Khanna', amount: '₹45 L', status: 'Closed', date: 'Yesterday' },
              ].map((deal, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-md hover:ring-1 hover:ring-slate-200 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-900 font-black text-xs ring-1 ring-slate-200 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      {deal.client.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{deal.title}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{deal.client} • {deal.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">{deal.amount}</p>
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest",
                      deal.status === 'Closed' ? "text-emerald-500" : "text-amber-500"
                    )}>{deal.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Quick Actions & Tasks */}
        <div className="space-y-8">
          <Card className="border-none shadow-sm ring-1 ring-slate-200/50 p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Add Property', icon: PlusCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/properties' },
                { label: 'New Lead', icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-50', link: '/leads' },
                { label: 'Schedule Visit', icon: CalendarPlus, color: 'text-rose-600', bg: 'bg-rose-50', link: '/visits' },
                { label: 'Record Deal', icon: CheckCircle2, color: 'text-indigo-600', bg: 'bg-indigo-50', link: '/deals' },
              ].map((action) => (
                <Link 
                  key={action.label}
                  to={action.link} 
                  className="flex flex-col items-center justify-center p-5 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-md hover:ring-1 hover:ring-slate-200 transition-all group"
                >
                  <div className={`p-3 ${action.bg} ${action.color} rounded-xl mb-3 group-hover:scale-110 transition-transform`}>
                    <action.icon size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-700">{action.label}</span>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-slate-200/50 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Notifications</h3>
              <span className="px-2 py-1 bg-rose-100 text-rose-600 text-[10px] font-bold rounded-full uppercase tracking-wider">2 New</span>
            </div>
            <div className="space-y-5">
              <div className="flex gap-4 group cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Visit Reminder</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">Site visit for Seaside Villa at 4:00 PM.</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-wider">10:30 AM</p>
                </div>
              </div>
              <div className="flex gap-4 group cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Users size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">New Lead Assigned</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">"Apartment Inquiry" assigned to you.</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-wider">Yesterday</p>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-8 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-emerald-600">
              View All Activity
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
