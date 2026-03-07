import { useState, useEffect } from 'react';
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
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ResponsiveTable } from '../components/ui/ResponsiveTable';
import { formatCurrency, formatDate } from '../utils/formatters';
import { cn } from '../utils/cn';
import { motion } from 'motion/react';

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
      fetchData();
    } catch (err) {
      alert('Error recording deal');
    }
  };

  const filteredDeals = deals.filter(d => 
    d.property_title.toLowerCase().includes(search.toLowerCase()) || 
    d.lead_title.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = deals.reduce((sum, d) => sum + d.final_value, 0);
  const totalCommission = deals.reduce((sum, d) => sum + d.commission_amount, 0);

  const columns = [
    {
      header: 'Transaction Details',
      accessor: (d: Deal) => (
        <div className="py-2">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-bold text-slate-900">{d.property_title}</p>
            <Badge className={cn(
              "border-none text-[9px] font-black uppercase tracking-widest px-2 py-0.5",
              d.status === 'Closed' ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
            )}>
              {d.status}
            </Badge>
          </div>
          <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            <User size={10} className="mr-1" />
            {d.lead_title}
          </div>
        </div>
      )
    },
    {
      header: 'Closing Date',
      accessor: (d: Deal) => (
        <div className="py-2">
          <div className="flex items-center text-sm text-slate-600 font-bold">
            <Calendar size={14} className="mr-2 text-slate-300" />
            {formatDate(d.closing_date)}
          </div>
        </div>
      )
    },
    {
      header: 'Value',
      accessor: (d: Deal) => (
        <div className="py-2">
          <div className="text-sm font-black text-slate-900">
            {formatCurrency(d.final_value)}
          </div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Final Sale Price
          </div>
        </div>
      )
    },
    {
      header: 'Earnings',
      accessor: (d: Deal) => (
        <div className="py-2">
          <div className="text-sm font-black text-emerald-600">
            {formatCurrency(d.commission_amount)}
          </div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            {d.commission_rate}% Commission
          </div>
        </div>
      )
    },
    {
      header: 'Managed By',
      accessor: (d: Deal) => (
        <div className="py-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200">
              {d.broker_name.charAt(0)}
            </div>
            <span className="text-xs font-bold text-slate-600">{d.broker_name}</span>
          </div>
        </div>
      )
    }
  ];

  const estimatedCommission = ((parseFloat(formData.final_value) || 0) * (parseFloat(formData.commission_rate) || 0) / 100);

  return (
    <div className="p-6 lg:p-10 space-y-12 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <PageHeader 
          title="Deal Ledger" 
          subtitle="A comprehensive record of your successful property transactions."
        />
        <Button onClick={handleOpenModal} className="rounded-xl shadow-lg shadow-emerald-200">
          <Plus size={18} className="mr-2" />
          Record Deal
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="p-8 border-none shadow-sm ring-1 ring-slate-200/50 bg-white relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Total Closed Deals</p>
            <div className="flex items-end gap-3">
              <h3 className="text-5xl font-black text-slate-900">{deals.length}</h3>
              <div className="mb-2 flex items-center text-emerald-600 font-bold text-xs">
                <ArrowUpRight size={14} className="mr-1" />
                +12%
              </div>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
            <Handshake size={160} />
          </div>
        </Card>

        <Card className="p-8 border-none shadow-sm ring-1 ring-slate-200/50 bg-white relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Total Revenue</p>
            <div className="flex items-end gap-3">
              <h3 className="text-4xl font-black text-slate-900">{formatCurrency(totalRevenue)}</h3>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
            <TrendingUp size={160} />
          </div>
        </Card>

        <Card className="p-8 border-none shadow-sm ring-1 ring-slate-200/50 bg-emerald-600 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-[0.2em] mb-4">Net Commission</p>
            <div className="flex items-end gap-3">
              <h3 className="text-4xl font-black text-white">{formatCurrency(totalCommission)}</h3>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-[0.1] group-hover:opacity-[0.15] transition-opacity">
            <DollarSign size={160} className="text-white" />
          </div>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search deals by property or lead..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl border-slate-200">
            <Filter size={18} className="mr-2" />
            Filter
          </Button>
          <Button variant="outline" className="rounded-xl border-slate-200">
            Export CSV
          </Button>
        </div>
      </div>

      {/* Deals Table */}
      <Card className="p-0 border-none shadow-sm ring-1 ring-slate-200/50 overflow-hidden bg-white">
        <ResponsiveTable 
          columns={columns}
          data={filteredDeals}
          keyExtractor={(d) => d.id}
          isLoading={loading}
          emptyMessage="No deals recorded yet. Close some deals to see them here!"
          rowClassName="group hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0"
        />
      </Card>

      {/* Record Deal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Transaction"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cancel</Button>
            <Button onClick={handleSubmit} className="rounded-xl shadow-lg shadow-emerald-200 px-8">Confirm Deal</Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-10 py-4">
          <div className="flex justify-end">
            <button 
              type="button"
              onClick={() => {
                if (leads.length > 0 && properties.length > 0) {
                  setFormData({
                    ...formData,
                    lead_id: leads[0].id.toString(),
                    property_id: properties[0].id.toString(),
                    final_value: '12000000',
                    commission_rate: user?.commission_pct?.toString() || '2',
                    closing_date: format(new Date(), 'yyyy-MM-dd'),
                    status: 'Closed'
                  });
                } else {
                  alert('Please add at least one lead and one property first.');
                }
              }}
              className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest hover:underline"
            >
              Auto-fill sample data
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Select 
              label="Select Lead"
              required
              value={formData.lead_id}
              onChange={(e) => setFormData({...formData, lead_id: e.target.value})}
              options={[
                { value: '', label: 'Choose a lead...' },
                ...leads.map(l => ({ value: l.id, label: l.title }))
              ]}
            />
            <Select 
              label="Select Property"
              required
              value={formData.property_id}
              onChange={(e) => setFormData({...formData, property_id: e.target.value})}
              options={[
                { value: '', label: 'Choose a property...' },
                ...properties.map(p => ({ value: p.id, label: p.title }))
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <Input 
              label="Final Sale Price (₹)"
              required
              type="number"
              value={formData.final_value}
              onChange={(e) => setFormData({...formData, final_value: e.target.value})}
              placeholder="e.g. 12000000"
            />
            <Input 
              label="Commission Percentage (%)"
              required
              type="number"
              step="0.1"
              value={formData.commission_rate}
              onChange={(e) => setFormData({...formData, commission_rate: e.target.value})}
              placeholder="e.g. 2"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <Input 
              label="Closing Date"
              required
              type="date"
              value={formData.closing_date}
              onChange={(e) => setFormData({...formData, closing_date: e.target.value})}
            />
            <Select 
              label="Deal Status"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value as any})}
              options={[
                { value: 'Closed', label: 'Closed' },
                { value: 'Negotiation', label: 'Negotiation' },
              ]}
            />
          </div>

          <div className="p-8 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex flex-col items-center text-center">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Estimated Earnings</p>
            <h4 className="text-4xl font-black text-emerald-700">
              {formatCurrency(estimatedCommission)}
            </h4>
            <p className="text-[10px] text-emerald-600/60 mt-2 font-medium italic">Calculated based on {formData.commission_rate || '0'}% commission rate</p>
          </div>
        </form>
      </Modal>
    </div>
  );
}
