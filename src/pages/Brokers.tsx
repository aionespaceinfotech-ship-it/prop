import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  UserPlus, 
  Mail, 
  Percent, 
  Edit2,
  Trash2,
  Shield,
  Users,
  MoreVertical,
  ArrowUpRight,
  TrendingUp,
  Award,
  Filter
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { formatDate } from '../utils/formatters';
import { cn } from '../utils/cn';

interface Broker {
  id: number;
  name: string;
  email: string;
  role: string;
  commission_pct: number;
  created_at: string;
}

export default function Brokers() {
  const api = useApi();
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBroker, setEditingBroker] = useState<Broker | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    commission_pct: '2.0'
  });

  const fetchBrokers = async () => {
    setLoading(true);
    try {
      const data = await api.get('/brokers');
      setBrokers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrokers();
  }, []);

  const handleOpenModal = (broker?: Broker) => {
    if (broker) {
      setEditingBroker(broker);
      setFormData({
        name: broker.name,
        email: broker.email,
        password: '',
        commission_pct: broker.commission_pct.toString()
      });
    } else {
      setEditingBroker(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        commission_pct: '2.0'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBroker) {
        await api.put(`/brokers/${editingBroker.id}`, {
          name: formData.name,
          email: formData.email,
          commission_pct: parseFloat(formData.commission_pct)
        });
      } else {
        await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            role: 'Broker',
            commission_pct: parseFloat(formData.commission_pct)
          })
        });
      }
      setIsModalOpen(false);
      fetchBrokers();
    } catch (err) {
      alert('Error saving broker');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this broker?')) {
      try {
        await api.delete(`/brokers/${id}`);
        fetchBrokers();
      } catch (err) {
        alert('Error deleting broker');
      }
    }
  };

  const filteredBrokers = brokers.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    b.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-10 space-y-12 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <PageHeader 
          title="Team Management" 
          subtitle="Manage your broker network and commission structures."
        />
        <Button onClick={() => handleOpenModal()} className="rounded-xl shadow-lg shadow-emerald-200">
          <UserPlus size={18} className="mr-2" />
          Invite Broker
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="p-8 border-none shadow-sm ring-1 ring-slate-200/50 bg-white relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Active Brokers</p>
            <div className="flex items-end gap-3">
              <h3 className="text-5xl font-black text-slate-900">{brokers.length}</h3>
              <div className="mb-2 flex items-center text-emerald-600 font-bold text-xs">
                <ArrowUpRight size={14} className="mr-1" />
                +2 this month
              </div>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
            <Users size={160} />
          </div>
        </Card>

        <Card className="p-8 border-none shadow-sm ring-1 ring-slate-200/50 bg-white relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Avg. Commission</p>
            <div className="flex items-end gap-3">
              <h3 className="text-4xl font-black text-slate-900">
                {(brokers.reduce((sum, b) => sum + b.commission_pct, 0) / (brokers.length || 1)).toFixed(1)}%
              </h3>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
            <TrendingUp size={160} />
          </div>
        </Card>

        <Card className="p-8 border-none shadow-sm ring-1 ring-slate-200/50 bg-slate-900 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Top Performer</p>
            <div className="flex items-end gap-3">
              <h3 className="text-2xl font-black text-white">
                {brokers.length > 0 ? brokers[0].name : 'N/A'}
              </h3>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-[0.1] group-hover:opacity-[0.15] transition-opacity">
            <Award size={160} className="text-white" />
          </div>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search brokers by name or email..."
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
            Export Team
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-slate-400 font-medium animate-pulse">Loading team members...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredBrokers.map((broker, idx) => (
              <motion.div
                layout
                key={broker.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="group p-0 border-none shadow-sm ring-1 ring-slate-200/50 bg-white hover:ring-emerald-500/30 transition-all rounded-[2rem] overflow-hidden h-full flex flex-col">
                  <div className="p-8 flex-1">
                    <div className="flex items-start justify-between mb-8">
                      <div className="flex items-center">
                        <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-[1.25rem] flex items-center justify-center font-bold text-xl mr-5 border border-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-100 transition-all">
                          {broker.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{broker.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className="bg-slate-100 text-slate-600 border-none text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
                              <Shield size={10} className="mr-1 inline" /> {broker.role}
                            </Badge>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: #{broker.id}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleOpenModal(broker)}
                          className="p-2 text-slate-300 hover:text-slate-600 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(broker.id)}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4 mb-8">
                      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-white group-hover:border-emerald-100 transition-all">
                        <Mail size={14} className="text-slate-400" />
                        <span className="text-sm font-bold text-slate-700 truncate">{broker.email}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-white group-hover:border-emerald-100 transition-all">
                        <div className="flex items-center gap-3">
                          <Percent size={14} className="text-slate-400" />
                          <span className="text-sm font-bold text-slate-700">Commission Rate</span>
                        </div>
                        <span className="text-sm font-black text-emerald-600">{broker.commission_pct}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center mt-auto">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Joined {formatDate(broker.created_at)}
                    </span>
                    <button className="text-[10px] font-black text-slate-900 uppercase tracking-widest hover:underline">
                      View Performance
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredBrokers.length === 0 && (
            <div className="col-span-full py-32 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users size={32} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No team members found</h3>
              <p className="text-slate-500 max-w-xs mx-auto mb-8">We couldn't find any brokers matching your search term.</p>
              <Button variant="outline" className="rounded-xl" onClick={() => setSearch('')}>
                Clear search
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Invite/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBroker ? 'Modify Team Member' : 'Invite Team Member'}
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cancel</Button>
            <Button onClick={handleSubmit} className="rounded-xl shadow-lg shadow-emerald-200 px-8">
              {editingBroker ? 'Update Profile' : 'Send Invitation'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-10 py-4">
          <Input 
            label="Full Legal Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="e.g. John Doe"
          />
          <Input 
            label="Professional Email"
            required
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            placeholder="e.g. john@propcrm.com"
          />
          {!editingBroker && (
            <Input 
              label="Temporary Password"
              required
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="••••••••"
            />
          )}
          <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
            <Input 
              label="Default Commission Rate (%)"
              required
              type="number"
              step="0.1"
              value={formData.commission_pct}
              onChange={(e) => setFormData({...formData, commission_pct: e.target.value})}
              placeholder="e.g. 2.0"
            />
            <p className="text-[10px] text-slate-400 mt-4 font-medium italic">
              This rate will be applied by default to all deals closed by this broker.
            </p>
          </div>
        </form>
      </Modal>
    </div>
  );
}
