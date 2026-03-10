import { useState, useEffect, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  UserCircle,
  MoreHorizontal,
  Star,
  ArrowRight,
  PhoneCall,
  MessageCircle,
  ShieldCheck,
  UserCheck,
  Trash2
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { AdaptiveDrawer } from '../components/ui/AdaptiveDrawer';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { DataPageLayout } from '../components/ui/DataPageLayout';
import { formatPhone, formatDate } from '../utils/formatters';
import { cn } from '../utils/cn';
import { toast } from 'sonner';

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
  
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: number | null }>({
    isOpen: false,
    id: null
  });

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
      setFormData({ name: '', email: '', phone: '', type: 'Buyer', notes: '' });
      toast.success('Client registered successfully');
      fetchClients();
    } catch (err) {
      toast.error('Failed to create client');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      await api.delete(`/clients/${deleteConfirm.id}`);
      setDeleteConfirm({ isOpen: false, id: null });
      toast.success('Client record removed');
      fetchClients();
    } catch {
      toast.error('Error deleting client');
    }
  };

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                           c.phone.includes(search) ||
                           (c.email || '').toLowerCase().includes(search.toLowerCase());
      const matchesTab = activeTab === 'All' || c.type === activeTab || c.type === 'Both';
      return matchesSearch && matchesTab;
    });
  }, [clients, search, activeTab]);

  const filterContent = (
    <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-200 w-fit">
      {['All', 'Buyer', 'Seller'].map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab as any)}
          className={cn(
            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            activeTab === tab 
              ? "bg-white text-slate-900 shadow-md ring-1 ring-slate-200" 
              : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
          )}
        >
          {tab}s
        </button>
      ))}
    </div>
  );

  return (
    <DataPageLayout
      title="Client Relations"
      subtitle="Nurture your leads and maintain a high-quality customer database."
      primaryAction={{
        label: "Register Client",
        onClick: () => setIsModalOpen(true),
        icon: <Plus size={18} className="mr-2" />
      }}
      search={{
        value: search,
        onChange: setSearch,
        placeholder: "Search clients by name, phone, or email..."
      }}
      filters={{
        content: filterContent
      }}
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-12 h-12 border-4 border-emerald-50 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Syncing Contact Database...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
          <AnimatePresence mode="popLayout">
            {filteredClients.map((client, idx) => (
              <motion.div
                layout
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="group p-0 border-none shadow-sm ring-1 ring-slate-200/50 bg-white hover:ring-emerald-500/30 transition-all rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden h-full flex flex-col hover:shadow-2xl hover:shadow-slate-200/50">
                  <div className="p-6 lg:p-8 flex-1">
                    <div className="flex items-start justify-between mb-6 lg:mb-8 gap-4">
                      <div className="flex items-center min-w-0">
                        <div className="w-12 h-12 lg:w-16 lg:h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center font-black text-xl lg:text-2xl mr-4 lg:mr-5 border border-slate-100 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all duration-500 shadow-sm shrink-0">
                          {client.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-lg lg:text-xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors leading-tight truncate" title={client.name}>{client.name}</h3>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <Badge className={cn(
                              "border-none text-[8px] lg:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 lg:py-1 rounded-lg shadow-sm",
                              client.type === 'Buyer' ? "bg-blue-500 text-white" :
                              client.type === 'Seller' ? "bg-amber-500 text-white" :
                              "bg-emerald-500 text-white"
                            )}>
                              {client.type}
                            </Badge>
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest truncate">ID: {client.id}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <button className="p-1.5 text-slate-300 hover:text-slate-600 transition-colors">
                          <MoreHorizontal size={18} />
                        </button>
                        <button onClick={() => setDeleteConfirm({ isOpen: true, id: client.id })} className="p-1.5 text-slate-200 hover:text-rose-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 mb-6 lg:mb-8">
                      <button onClick={() => window.open(`tel:${client.phone}`, '_self')} className="flex items-center justify-between p-3 lg:p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group-hover:bg-white group-hover:border-emerald-100 transition-all shadow-sm min-w-0">
                        <div className="flex items-center gap-3 text-slate-600 min-w-0">
                          <PhoneCall size={14} className="shrink-0" />
                          <span className="text-xs lg:text-sm font-black tabular-nums truncate">{formatPhone(client.phone)}</span>
                        </div>
                        <span className="text-[8px] lg:text-[9px] font-black text-emerald-600 uppercase tracking-widest shrink-0 ml-2">Call</span>
                      </button>
                      {client.email && (
                        <button onClick={() => window.open(`mailto:${client.email}`)} className="flex items-center justify-between p-3 lg:p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group-hover:bg-white group-hover:border-emerald-100 transition-all shadow-sm min-w-0">
                          <div className="flex items-center gap-3 text-slate-600 min-w-0">
                            <Mail size={14} className="shrink-0" />
                            <span className="text-xs lg:text-sm font-black truncate">{client.email}</span>
                          </div>
                          <span className="text-[8px] lg:text-[9px] font-black text-emerald-600 uppercase tracking-widest shrink-0 ml-2">Mail</span>
                        </button>
                      )}
                    </div>

                    {client.notes && (
                      <div className="relative p-4 bg-slate-50/30 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2 lg:line-clamp-3 italic">
                          "{client.notes}"
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="px-6 lg:px-8 py-4 lg:py-6 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center mt-auto">
                    <div className="flex items-center gap-2">
                      <UserCheck size={12} className="text-emerald-500 shrink-0" />
                      <span className="text-[8px] lg:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] truncate">
                        Joined {formatDate(client.created_at)}
                      </span>
                    </div>
                    <button className="flex items-center gap-2 text-[9px] lg:text-[10px] font-black text-slate-900 uppercase tracking-widest group/btn bg-white px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl shadow-sm border border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-300 shrink-0">
                      Profile
                      <ArrowRight size={10} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredClients.length === 0 && (
            <div className="col-span-full py-32 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserCircle size={40} className="text-slate-200" />
              </div>
              <h3 className="text-xl font-black text-slate-900">No relations found</h3>
              <p className="text-slate-500 mt-2 font-medium">Adjust your search or add a new client to get started.</p>
              <Button variant="ghost" onClick={() => { setSearch(''); setActiveTab('All'); }} className="mt-6 text-emerald-600 font-bold uppercase tracking-widest text-[10px]">
                Reset Discovery Filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Add Client Modal */}
      <AdaptiveDrawer
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Initialize New Relation"
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Discard</Button>
            <Button onClick={handleSubmit} className="rounded-2xl shadow-xl shadow-emerald-200 px-8">Confirm Registration</Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-8 py-4">
          <Input 
            label="Full Legal Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="e.g. Vikram Singh"
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input 
              label="Primary Phone"
              required
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="e.g. 9876543210"
            />
            <Input 
              label="Email (Digital ID)"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="e.g. vikram@example.com"
            />
          </div>
          
          <Select 
            label="Categorization"
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value as any})}
            options={[
              { value: 'Buyer', label: 'Prospective Buyer' },
              { value: 'Seller', label: 'Property Seller' },
              { value: 'Both', label: 'Hybrid Client' },
            ]}
          />
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Engagement Context</label>
            <textarea 
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-4 px-5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all duration-200 h-32 resize-none"
              placeholder="Record unique preferences, history or specific background..."
            />
          </div>
        </form>
      </AdaptiveDrawer>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={handleConfirmDelete}
        title="Remove Client Record"
        message="Are you sure you want to remove this client? All associated lead history might be affected."
        confirmText="Confirm Removal"
        variant="danger"
      />
    </DataPageLayout>
  );
}
