import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight,
  BarChart3,
  Target,
  Users,
  Briefcase,
  Calendar,
  Download,
  Filter,
  PieChart as PieChartIcon,
  Award,
  Zap,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { DataPageLayout } from '../components/ui/DataPageLayout';
import { formatCurrency } from '../utils/formatters';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface SalesReport {
  month: string;
  total_sales: number;
  total_commission: number;
  deal_count: number;
}

export default function Reports() {
  const api = useApi();
  const [salesData, setSalesData] = useState<SalesReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/sales')
      .then(setSalesData)
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = salesData.reduce((acc, curr) => acc + curr.total_commission, 0);
  const totalSales = salesData.reduce((acc, curr) => acc + curr.total_sales, 0);
  const totalDeals = salesData.reduce((acc, curr) => acc + curr.deal_count, 0);

  const chartData = salesData.map(item => ({
    name: formatMonth(item.month),
    revenue: item.total_commission,
    sales: item.total_sales,
    deals: item.deal_count
  }));

  const stats = (
    <>
      <Card className="p-6 bg-white ring-1 ring-slate-200 border-none shadow-sm relative overflow-hidden group">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none">Net Brokerage</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-black text-slate-900 tabular-nums">{formatCurrency(totalRevenue)}</h3>
          <span className="text-[10px] font-bold text-emerald-500">+14%</span>
        </div>
      </Card>
      <Card className="p-6 bg-white ring-1 ring-slate-200 border-none shadow-sm relative overflow-hidden group">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none">Gross Volume</p>
        <h3 className="text-2xl font-black text-slate-900 tabular-nums truncate">{formatCurrency(totalSales)}</h3>
      </Card>
      <Card className="p-6 bg-white ring-1 ring-slate-200 border-none shadow-sm relative overflow-hidden group">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none">Closed Assets</p>
        <h3 className="text-2xl font-black text-slate-900 tabular-nums">{totalDeals}</h3>
      </Card>
      <Card className="p-6 bg-slate-900 border-none shadow-xl relative overflow-hidden group">
        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
          <Target size={60} className="text-white" />
        </div>
        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-2 leading-none">Efficiency</p>
        <h3 className="text-2xl font-black text-white tabular-nums">18.4%</h3>
      </Card>
    </>
  );

  return (
    <DataPageLayout
      title="Intelligence & Analytics"
      subtitle="Comprehensive performance auditing and growth trajectory visualization."
      primaryAction={{
        label: "Export Audit",
        onClick: () => alert('Exporting report...'),
        icon: <Download size={18} className="mr-2" />
      }}
      stats={stats}
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-12 h-12 border-4 border-emerald-50 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Synthesizing Analytics...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2 p-10 border-none shadow-sm ring-1 ring-slate-200/50 bg-white rounded-[2.5rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
              <TrendingUp size={200} />
            </div>
            
            <div className="flex items-center justify-between mb-12 relative z-10">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Revenue Trajectory</h3>
                <p className="text-sm font-medium text-slate-400">Auditing monthly brokerage yields</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Brokerage (INR)</span>
              </div>
            </div>
            
            <div className="h-[420px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                    dy={15}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                    tickFormatter={(value) => `₹${value / 100000}L`}
                  />
                  <Tooltip 
                    cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                    contentStyle={{ 
                      borderRadius: '20px', 
                      border: 'none', 
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                      padding: '16px'
                    }}
                    itemStyle={{ fontSize: '13px', fontWeight: 900, color: '#10b981' }}
                    labelStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.1em' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={5}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    animationDuration={2500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Performance Breakdown */}
          <div className="space-y-10">
            <Card className="p-10 border-none shadow-sm ring-1 ring-slate-200/50 bg-white rounded-[2.5rem]">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Asset Conversion</h3>
                <PieChartIcon size={18} className="text-slate-200" />
              </div>
              
              <div className="h-[220px] w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Closed', value: totalDeals },
                        { name: 'Negotiation', value: Math.floor(totalDeals * 0.4) },
                        { name: 'Lost', value: Math.floor(totalDeals * 0.1) }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={75}
                      outerRadius={95}
                      paddingAngle={10}
                      dataKey="value"
                      animationBegin={500}
                      animationDuration={1500}
                    >
                      <Cell fill="#10b981" stroke="none" />
                      <Cell fill="#f59e0b" stroke="none" />
                      <Cell fill="#f1f5f9" stroke="none" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black text-slate-900 tabular-nums">{totalDeals}</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Audit Unit</span>
                </div>
              </div>

              <div className="space-y-5 mt-10">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Closed Wins</span>
                  </div>
                  <span className="text-xs font-black text-slate-900">100%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Active Pipeline</span>
                  </div>
                  <span className="text-xs font-black text-slate-900">40%</span>
                </div>
              </div>
            </Card>

            <Card className="p-8 bg-slate-900 text-white border-none rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <Award size={100} className="text-emerald-400" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center shadow-2xl">
                    <Zap size={24} className="text-emerald-400 fill-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">MVD (Most Valued Dealer)</p>
                    <h4 className="text-lg font-black tracking-tight group-hover:text-emerald-400 transition-colors">Rajesh Kumar</h4>
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 leading-none">Yield Value</p>
                    <p className="text-2xl font-black tabular-nums">₹12.4 L</p>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 group-hover:bg-emerald-500/10 transition-all">
                    <span className="text-[10px] font-black uppercase tracking-widest">8 DEALS</span>
                    <ChevronRight size={12} className="text-emerald-500" />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </DataPageLayout>
  );
}

function formatMonth(monthStr: string) {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return format(date, 'MMM yy');
}
