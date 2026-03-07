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
  PieChart as PieChartIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { formatCurrency } from '../utils/formatters';
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
  Cell,
  PieChart,
  Pie
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

  if (loading) {
    return (
      <div className="p-6 lg:p-10 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse">Analyzing performance data...</p>
      </div>
    );
  }

  const totalRevenue = salesData.reduce((acc, curr) => acc + curr.total_commission, 0);
  const totalSales = salesData.reduce((acc, curr) => acc + curr.total_sales, 0);
  const totalDeals = salesData.reduce((acc, curr) => acc + curr.deal_count, 0);

  const chartData = salesData.map(item => ({
    name: formatMonth(item.month),
    revenue: item.total_commission,
    sales: item.total_sales,
    deals: item.deal_count
  }));

  return (
    <div className="p-6 lg:p-10 space-y-12 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <PageHeader 
          title="Performance Analytics" 
          subtitle="Deep insights into your brokerage's growth and efficiency."
        />
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl border-slate-200">
            <Calendar size={18} className="mr-2" />
            Last 12 Months
          </Button>
          <Button className="rounded-xl shadow-lg shadow-emerald-200">
            <Download size={18} className="mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* High-Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <Card className="p-8 border-none shadow-sm ring-1 ring-slate-200/50 bg-white relative overflow-hidden group">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Total Commission</p>
          <div className="flex items-end gap-3">
            <h3 className="text-3xl font-black text-slate-900">{formatCurrency(totalRevenue)}</h3>
          </div>
          <div className="mt-4 flex items-center text-emerald-600 font-bold text-xs">
            <ArrowUpRight size={14} className="mr-1" />
            +14.2%
          </div>
        </Card>

        <Card className="p-8 border-none shadow-sm ring-1 ring-slate-200/50 bg-white relative overflow-hidden group">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Gross Sales</p>
          <div className="flex items-end gap-3">
            <h3 className="text-3xl font-black text-slate-900">{formatCurrency(totalSales)}</h3>
          </div>
          <div className="mt-4 flex items-center text-emerald-600 font-bold text-xs">
            <ArrowUpRight size={14} className="mr-1" />
            +8.5%
          </div>
        </Card>

        <Card className="p-8 border-none shadow-sm ring-1 ring-slate-200/50 bg-white relative overflow-hidden group">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Closed Deals</p>
          <div className="flex items-end gap-3">
            <h3 className="text-3xl font-black text-slate-900">{totalDeals}</h3>
          </div>
          <div className="mt-4 flex items-center text-rose-600 font-bold text-xs">
            <TrendingUp size={14} className="mr-1 rotate-180" />
            -2.4%
          </div>
        </Card>

        <Card className="p-8 border-none shadow-sm ring-1 ring-slate-200/50 bg-emerald-600 relative overflow-hidden group">
          <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-[0.2em] mb-4">Conversion Rate</p>
          <div className="flex items-end gap-3">
            <h3 className="text-3xl font-black text-white">18.4%</h3>
          </div>
          <div className="mt-4 flex items-center text-emerald-100 font-bold text-xs">
            <Target size={14} className="mr-1" />
            Above Target
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 p-10 border-none shadow-sm ring-1 ring-slate-200/50 bg-white">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-900">Revenue Trajectory</h3>
              <p className="text-sm text-slate-400 font-medium">Monthly commission earnings over time</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Commission</span>
            </div>
          </div>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  tickFormatter={(value) => `₹${value / 100000}L`}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 700 }}
                  labelStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Distribution / Performance */}
        <div className="space-y-10">
          <Card className="p-10 border-none shadow-sm ring-1 ring-slate-200/50 bg-white">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Deal Distribution</h3>
              <PieChartIcon size={18} className="text-slate-300" />
            </div>
            
            <div className="h-[200px] w-full flex items-center justify-center">
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
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black text-slate-900">{totalDeals}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
              </div>
            </div>

            <div className="space-y-4 mt-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-600">Closed</span>
                </div>
                <span className="text-xs font-black text-slate-900">100%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-xs font-bold text-slate-600">Negotiation</span>
                </div>
                <span className="text-xs font-black text-slate-900">40%</span>
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-slate-900 text-white border-none relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center">
                  <Award size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Top Performer</p>
                  <h4 className="text-lg font-black">Rajesh Kumar</h4>
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Earnings</p>
                  <p className="text-2xl font-black">₹12.4 L</p>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-none px-3 py-1 font-black text-[10px]">
                  8 DEALS
                </Badge>
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-[0.1] group-hover:opacity-[0.2] transition-opacity">
              <Users size={120} className="text-white" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function formatMonth(monthStr: string) {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return format(date, 'MMM yy');
}

function Award({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  );
}
