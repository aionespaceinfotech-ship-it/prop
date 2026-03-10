import { useState, useEffect, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import { 
  Plus, 
  Handshake, 
  Calendar, 
  User, 
  Home, 
  IndianRupee,
  TrendingUp,
  CheckCircle2,
  ArrowUpRight,
  DollarSign,
  Briefcase,
  Search,
  Filter,
  FileText,
  Target,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { AdaptiveDrawer } from '../components/ui/AdaptiveDrawer';
import { ResponsiveTable } from '../components/ui/ResponsiveTable';
import { DataPageLayout } from '../components/ui/DataPageLayout';
import { formatCurrency, formatDate } from '../utils/formatters';
import { cn } from '../utils/cn';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface Deal {
  id: number;
  lead_id: number;
  lead_title: string;
  property_id: number;
  property_title: string;
  broker_id: number;
  broker_name: string;
  final_value: number;
  commission_rate: number;
  commission_amount: number;
  closing_date: string;
  status: 'Negotiation' | 'Closed';
}

interface Lead {
  id: number;
  title: string;
}

interface Property {
  id: number;
  title: string;
}

export default function Deals() {
  const api = useApi();
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    lead_id: '',
    property_id: '',
    final_value: '',
    commission_rate: user?.commission_pct?.toString() || '2',
    closing_date: format(new Date(), 'yyyy-MM-dd'),
    status: 'Closed'
  });

  useEffect(() => {
    if (user?.commission_pct) {
      setFormData(prev => ({ ...prev, commission_rate: user.commission_pct.toString() }));
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dealsData, leadsData, propsData] = await Promise.all([
        api.get('/deals'),
        api.get('/leads'),
        api.get('/properties')
      ]);
      setDeals(dealsData);
      setLeads(leadsData);
      setProperties(propsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = () => {
    setFormData({
      lead_id: '',
      property_id: '',
      final_value: '',
      commission_rate: user?.commission_pct?.toString() || '2',
      closing_date: format(new Date(), 'yyyy-MM-dd'),
      status: 'Closed'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/deals', {
        ...formData,
        lead_id: parseInt(formData.lead_id),
        property_id: parseInt(formData.property_id),
        broker_id: user?.id,
        final_value: parseFloat(formData.final_value),
        commission_rate: parseFloat(formData.commission_rate)
      });
      setIsModalOpen(false);
      toast.success('Deal recorded successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to record deal');
    }
  };

  const filteredDeals = useMemo(() => {
    return deals.filter(d => 
      d.property_title.toLowerCase().includes(search.toLowerCase()) || 
      d.lead_title.toLowerCase().includes(search.toLowerCase()) ||
      d.broker_name.toLowerCase().includes(search.toLowerCase())
    );
  }, [deals, search]);

  const totalRevenue = deals.reduce((sum, d) => sum + d.final_value, 0);
  const totalCommission = deals.reduce((sum, d) => sum + d.commission_amount, 0);

  const stats = (
    <>
      <Card className="p-6 bg-white ring-1 ring-slate-200 border-none shadow-sm relative overflow-hidden group">
        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
          <Handshake size={60} />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none">Successful Closures</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-black text-slate-900">{deals.length}</h3>
          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">+4</span>
        </div>
      </Card>
      
      <Card className="p-6 bg-white ring-1 ring-slate-200 border-none shadow-sm relative overflow-hidden group">
        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
          <IndianRupee size={60} />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none">Gross Transaction Value</p>
        <h3 className="text-2xl font-black text-slate-900 truncate">{formatCurrency(totalRevenue)}</h3>
      </Card>

      <Card className="p-6 bg-emerald-600 border-none shadow-lg shadow-emerald-100 relative overflow-hidden group">
        <div className="absolute right-0 top-0 p-4 opacity-20 group-hover:scale-110 transition-transform text-white">
          <DollarSign size={60} />
        </div>
        <p className="text-[10px] font-black text-emerald-100 uppercase tracking-[0.2em] mb-2 leading-none">Net Revenue (Comm.)</p>
        <h3 className="text-2xl font-black text-white truncate">{formatCurrency(totalCommission)}</h3>
      </Card>
    </>
  );

  const columns = [
    {
      header: 'Listing & Prospect',
      accessor: (d: Deal) => (
        <div className="py-1 min-w-0">
          <p className="font-black text-slate-900 leading-tight truncate" title={d.property_title}>{d.property_title}</p>
          <div className="flex items-center text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 truncate">
            <User size={10} className="mr-1.5 text-blue-500 shrink-0" />
            {d.lead_title}
          </div>
        </div>
      ),
      className: 'md:min-w-[220px] lg:max-w-[300px]'
    },
    {
      header: 'Closing',
      accessor: (d: Deal) => (
        <div className="flex items-center text-[10px] font-bold text-slate-600">
          <Calendar size={12} className="mr-2 text-slate-300 shrink-0" />
          {formatDate(d.closing_date)}
        </div>
      ),
      className: 'md:min-w-[120px]',
      hideOnMobile: true
    },
    {
      header: 'Market Value',
      accessor: (d: Deal) => (
        <div className="min-w-0">
          <p className="text-xs lg:text-sm font-black text-slate-900 tabular-nums truncate">{formatCurrency(d.final_value)}</p>
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-tighter mt-0.5">Contract Price</p>
        </div>
      ),
      className: 'md:min-w-[140px]'
    },
    {
      header: 'Commission',
      accessor: (d: Deal) => (
        <div className="min-w-0">
          <p className="text-xs lg:text-sm font-black text-emerald-600 tabular-nums truncate">{formatCurrency(d.commission_amount)}</p>
          <p className="text-[8px] font-black text-emerald-400/60 uppercase tracking-tighter mt-0.5">{d.commission_rate}% Yield</p>
        </div>
      ),
      className: 'md:min-w-[140px]'
    },
    {
      header: 'Status',
      accessor: (d: Deal) => (
        <Badge className={cn(
          "border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg shadow-sm",
          d.status === 'Closed' ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
        )}>
          {d.status}
        </Badge>
      ),
      className: 'md:min-w-[90px]'
    }
  ];

  const estimatedCommission = ((parseFloat(formData.final_value) || 0) * (parseFloat(formData.commission_rate) || 0) / 100);

  return (
    <DataPageLayout
      title="Deal Registry"
      subtitle="The ultimate ledger of successful transactions and revenue milestones."
      primaryAction={{
        label: "Record Transaction",
        onClick: handleOpenModal,
        icon: <Plus size={18} className="mr-2" />
      }}
      search={{
        value: search,
        onChange: setSearch,
        placeholder: "Search deals by property, lead or agent..."
      }}
      stats={stats}
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-12 h-12 border-4 border-emerald-50 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Calculating Ledger...</p>
        </div>
      ) : (
        <Card className="p-0 border-none shadow-sm ring-1 ring-slate-200/50 overflow-hidden bg-white rounded-[2.5rem]">
          <ResponsiveTable 
            columns={columns}
            data={filteredDeals}
            keyExtractor={(d) => d.id}
            isLoading={loading}
            emptyMessage="No transactions recognized. Close your first deal to initialize the ledger."
            rowClassName="hover:bg-slate-50/80 transition-all duration-300"
            headerCellClassName="bg-slate-50/50"
          />
        </Card>
      )}

      {/* Record Deal Modal */}
      <AdaptiveDrawer
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Initialize Transaction"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Discard</Button>
            <Button onClick={handleSubmit} className="rounded-2xl shadow-xl shadow-emerald-200 px-8">Confirm Closure</Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-10 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Select 
              label="Associated Prospect"
              required
              value={formData.lead_id}
              onChange={(e) => setFormData({...formData, lead_id: e.target.value})}
              options={[
                { value: '', label: 'Select active lead...' },
                ...leads.map(l => ({ value: l.id, label: l.title }))
              ]}
            />
            <Select 
              label="Target Listing"
              required
              value={formData.property_id}
              onChange={(e) => setFormData({...formData, property_id: e.target.value})}
              options={[
                { value: '', label: 'Select property...' },
                ...properties.map(p => ({ value: p.id, label: p.title }))
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <Input 
              label="Finalized Value (₹)"
              required
              type="number"
              value={formData.final_value}
              onChange={(e) => setFormData({...formData, final_value: e.target.value})}
              placeholder="e.g. 12000000"
            />
            <Input 
              label="Brokerage Yield (%)"
              required
              type="number"
              step="0.1"
              value={formData.commission_rate}
              onChange={(e) => setFormData({...formData, commission_rate: e.target.value})}
              placeholder="e.g. 2.0"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <Input 
              label="Execution Date"
              required
              type="date"
              value={formData.closing_date}
              onChange={(e) => setFormData({...formData, closing_date: e.target.value})}
            />
            <Select 
              label="Current Maturity"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value as any})}
              options={[
                { value: 'Closed', label: 'Legally Closed' },
                { value: 'Negotiation', label: 'Final Negotiation' },
              ]}
            />
          </div>

          <div className="p-10 bg-slate-900 rounded-[2.5rem] border border-slate-800 flex flex-col items-center text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform duration-700">
              <Target size={120} className="text-white" />
            </div>
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-3 relative z-10">Calculated Yield</p>
            <h4 className="text-5xl font-black text-white tracking-tighter relative z-10 tabular-nums">
              {formatCurrency(estimatedCommission)}
            </h4>
            <div className="flex items-center gap-2 mt-4 bg-white/5 px-4 py-1.5 rounded-full border border-white/10 relative z-10">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Net commission at {formData.commission_rate || '0'}% yield</span>
              <ArrowRight size={10} className="text-emerald-500" />
            </div>
          </div>
        </form>
      </AdaptiveDrawer>
    </DataPageLayout>
  );
}
