import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  History,
  Edit2,
  Users,
  MessageSquare,
  MoreHorizontal,
  Star,
  ArrowRight,
  Filter
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { formatPhone, formatDate } from '../utils/formatters';
import { cn } from '../utils/cn';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  type: 'Buyer' | 'Seller' | 'Both';
  notes: string;
  created_at: string;
}

export default function Clients() {
  const api = useApi();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'All' | 'Buyer' | 'Seller'>('All');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'Buyer',
    notes: ''
  });

  const fetchClients = async () => {
    setLoading(true);
    try {
      const data = await api.get('/clients');
      setClients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/clients', formData);
      setIsModalOpen(false);
      fetchClients();
    } catch (err) {
      alert('Error creating client');
    }
  };

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                         c.phone.includes(search);
    const matchesTab = activeTab === 'All' || c.type === activeTab || c.type === 'Both';
    return matchesSearch && matchesTab;
  });

  return (
    <div className="p-6 lg:p-10 space-y-12 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <PageHeader 
          title="Client Directory" 
          subtitle="Nurture relationships and manage your contact database."
        />
        <Button onClick={() => setIsModalOpen(true)} className="rounded-xl shadow-lg shadow-emerald-200">
          <Plus size={18} className="mr-2" />
          Add Client
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex bg-white border border-slate-200 rounded-2xl p-1 shadow-sm w-fit overflow-x-auto no-scrollbar">
          {['All', 'Buyer', 'Seller'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                activeTab === tab 
                  ? "bg-slate-900 text-white shadow-lg" 
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              )}
            >
              {tab}s
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-slate-400 font-medium animate-pulse">Loading your contacts...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredClients.map((client, idx) => (
              <motion.div
                layout
                key={client.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="group p-0 border-none shadow-sm ring-1 ring-slate-200/50 bg-white hover:ring-emerald-500/30 transition-all rounded-[2rem] overflow-hidden h-full flex flex-col">
                  <div className="p-8 flex-1">
                    <div className="flex items-start justify-between mb-8">
                      <div className="flex items-center">
                        <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-[1.25rem] flex items-center justify-center font-bold text-xl mr-5 border border-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-100 transition-all">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{client.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={cn(
                              "border-none text-[9px] font-black uppercase tracking-widest px-2 py-0.5",
                              client.type === 'Buyer' ? "bg-blue-500 text-white" :
                              client.type === 'Seller' ? "bg-amber-500 text-white" :
                              "bg-emerald-500 text-white"
                            )}>
                              {client.type}
                            </Badge>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: #{client.id}</span>
                          </div>
                        </div>
                      </div>
                      <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                        <MoreHorizontal size={20} />
                      </button>
                    </div>

                    <div className="space-y-4 mb-8">
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-white group-hover:border-emerald-100 transition-all">
                        <div className="flex items-center gap-3">
                          <Phone size={14} className="text-slate-400" />
                          <span className="text-sm font-bold text-slate-700">{formatPhone(client.phone)}</span>
                        </div>
                        <button className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline">Call</button>
                      </div>
                      {client.email && (
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-white group-hover:border-emerald-100 transition-all">
                          <div className="flex items-center gap-3">
                            <Mail size={14} className="text-slate-400" />
                            <span className="text-sm font-bold text-slate-700 truncate max-w-[150px]">{client.email}</span>
                          </div>
                          <button className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline">Email</button>
                        </div>
                      )}
                    </div>

                    {client.notes && (
                      <div className="relative">
                        <p className="text-xs text-slate-500 italic leading-relaxed line-clamp-2">
                          "{client.notes}"
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center mt-auto">
                    <div className="flex items-center gap-2">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Member since {formatDate(client.created_at)}
                      </span>
                    </div>
                    <button className="flex items-center gap-2 text-[10px] font-black text-slate-900 uppercase tracking-widest group/btn">
                      History
                      <ArrowRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredClients.length === 0 && (
            <div className="col-span-full py-32 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users size={32} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No contacts found</h3>
              <p className="text-slate-500 max-w-xs mx-auto mb-8">We couldn't find any clients matching your current filters or search term.</p>
              <Button variant="outline" className="rounded-xl" onClick={() => { setSearch(''); setActiveTab('All'); }}>
                Reset all filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Add Client Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Client"
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cancel</Button>
            <Button onClick={handleSubmit} className="rounded-xl shadow-lg shadow-emerald-200 px-8">Add Client</Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-10 py-4">
          <div className="flex justify-end">
            <button 
              type="button"
              onClick={() => setFormData({
                name: 'Vikram Singh',
                email: 'vikram@example.com',
                phone: '9988776655',
                type: 'Buyer',
                notes: 'Interested in luxury apartments in West Delhi.'
              })}
              className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest hover:underline"
            >
              Auto-fill sample data
            </button>
          </div>

          <Input 
            label="Full Legal Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="e.g. Vikram Singh"
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <Input 
              label="Primary Phone"
              required
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="e.g. 9876543210"
            />
            <Input 
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="e.g. vikram@example.com"
            />
          </div>
          
          <Select 
            label="Client Classification"
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value as any})}
            options={[
              { value: 'Buyer', label: 'Prospective Buyer' },
              { value: 'Seller', label: 'Property Seller' },
              { value: 'Both', label: 'Hybrid (Buyer & Seller)' },
            ]}
          />
          
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Relationship Notes</label>
            <textarea 
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all duration-200 h-32 resize-none"
              placeholder="Record specific preferences, background, or context..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
