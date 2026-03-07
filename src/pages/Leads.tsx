import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { 
  Plus, 
  Search, 
  MessageSquare,
  ExternalLink,
  User,
  IndianRupee,
  Calendar,
  Filter,
  MoreHorizontal,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowRight
} from 'lucide-react';
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
import { motion, AnimatePresence } from 'motion/react';

interface Lead {
  id: number;
  client_id: number;
  client_name: string;
  title: string;
  source: 'Call' | 'Website' | 'Referral' | 'Walk-in' | 'WhatsApp' | 'Portal';
  status: 'New' | 'Contacted' | 'Interested' | 'Negotiation' | 'Closed' | 'Lost';
  assigned_to: number;
  broker_name: string;
  min_budget: number;
  max_budget: number;
  preferred_location: string;
  property_type: string;
  required_area: number;
  bhk_requirement: string;
  parking_requirement: string;
  facing_preference: string;
  construction_status: string;
  alternate_phone: string;
  email: string;
  notes: string;
  created_at: string;
}

interface Client {
  id: number;
  name: string;
}

export default function Leads() {
  const api = useApi();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'New' | 'Active' | 'Closed'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewClient, setIsNewClient] = useState(false);
  
  const [formData, setFormData] = useState({
    client_id: '',
    new_client_name: '',
    new_client_phone: '',
    new_client_email: '',
    title: '',
    source: 'Call',
    status: 'New',
    min_budget: '',
    max_budget: '',
    preferred_location: '',
    property_type: 'Plot',
    required_area: '',
    bhk_requirement: '',
    parking_requirement: 'Not Required',
    facing_preference: 'Any',
    construction_status: 'Ready to move',
    alternate_phone: '',
    email: '',
    notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leadsData, clientsData] = await Promise.all([
        api.get('/leads'),
        api.get('/clients')
      ]);
      setLeads(leadsData);
      setClients(clientsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let clientId = formData.client_id;

      if (isNewClient) {
        if (!formData.new_client_name || !formData.new_client_phone) {
          alert('Please enter new client name and phone');
          return;
        }
        const clientRes = await api.post('/clients', {
          name: formData.new_client_name,
          phone: formData.new_client_phone,
          email: formData.new_client_email,
          type: 'Buyer'
        });
        clientId = clientRes.id;
      }

      if (!clientId) {
        alert('Please select or create a client');
        return;
      }

      await api.post('/leads', {
        ...formData,
        client_id: parseInt(clientId.toString()),
        min_budget: parseFloat(formData.min_budget) || 0,
        max_budget: parseFloat(formData.max_budget) || 0,
        required_area: parseFloat(formData.required_area) || 0
      });
      setIsModalOpen(false);
      setIsNewClient(false);
      setFormData({
        client_id: '',
        new_client_name: '',
        new_client_phone: '',
        new_client_email: '',
        title: '',
        source: 'Call',
        status: 'New',
        min_budget: '',
        max_budget: '',
        preferred_location: '',
        property_type: 'Plot',
        required_area: '',
        bhk_requirement: '',
        parking_requirement: 'Not Required',
        facing_preference: 'Any',
        construction_status: 'Ready to move',
        alternate_phone: '',
        email: '',
        notes: ''
      });
      fetchData();
    } catch (err) {
      alert('Error creating lead');
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.put(`/leads/${id}`, { status });
      fetchData();
    } catch (err) {
      alert('Error updating status');
    }
  };

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.title.toLowerCase().includes(search.toLowerCase()) || 
                         l.client_name.toLowerCase().includes(search.toLowerCase());
    
    if (activeTab === 'New') return matchesSearch && l.status === 'New';
    if (activeTab === 'Active') return matchesSearch && ['Contacted', 'Interested', 'Negotiation'].includes(l.status);
    if (activeTab === 'Closed') return matchesSearch && ['Closed', 'Lost'].includes(l.status);
    
    return matchesSearch;
  });

  const columns = [
    {
      header: 'Lead Details',
      accessor: (l: Lead) => (
        <div className="py-2">
          <p className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{l.title}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              <Clock size={10} className="mr-1" />
              {formatDate(l.created_at)}
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-200" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {l.source}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Client',
      accessor: (l: Lead) => (
        <div className="flex items-center py-2">
          <div className="w-9 h-9 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center font-bold text-xs mr-3 border border-slate-200 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-100 transition-colors">
            {l.client_name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700">{l.client_name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Phone size={10} className="text-slate-400" />
              <span className="text-[10px] text-slate-500 font-medium">Contacted via {l.source}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Pipeline Stage',
      accessor: (l: Lead) => (
        <div className="py-2">
          <Select 
            value={l.status}
            onChange={(e) => updateStatus(l.id, e.target.value)}
            className={cn(
              "h-9 py-0 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl w-40 border-none shadow-sm transition-all",
              l.status === 'New' ? 'bg-blue-500 text-white shadow-blue-200' :
              l.status === 'Contacted' ? 'bg-amber-500 text-white shadow-amber-200' :
              l.status === 'Interested' ? 'bg-emerald-500 text-white shadow-emerald-200' :
              l.status === 'Negotiation' ? 'bg-orange-500 text-white shadow-orange-200' :
              l.status === 'Lost' ? 'bg-rose-500 text-white shadow-rose-200' :
              'bg-slate-900 text-white shadow-slate-200'
            )}
            options={[
              { value: 'New', label: '01. NEW LEAD' },
              { value: 'Contacted', label: '02. CONTACTED' },
              { value: 'Interested', label: '03. INTERESTED' },
              { value: 'Negotiation', label: '04. NEGOTIATION' },
              { value: 'Closed', label: '05. CLOSED' },
              { value: 'Lost', label: '06. LOST' },
            ]}
          />
        </div>
      )
    },
    {
      header: 'Requirements',
      accessor: (l: Lead) => (
        <div className="py-2 space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="neutral" className="bg-slate-50 text-slate-600 border-slate-200 text-[9px] font-bold uppercase tracking-widest">
              {l.property_type}
            </Badge>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center">
              <MapPin size={10} className="mr-1" />
              {l.preferred_location}
            </span>
          </div>
          <div className="flex items-center font-black text-slate-900 text-xs">
            <IndianRupee size={12} className="text-emerald-600 mr-1" />
            {formatCurrency(l.min_budget)} - {formatCurrency(l.max_budget)}
          </div>
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: (l: Lead) => (
        <div className="flex gap-2">
          <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all shadow-sm">
            <MessageSquare size={16} />
          </button>
          <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm">
            <MoreHorizontal size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 lg:p-10 space-y-10 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <PageHeader 
          title="Lead Pipeline" 
          subtitle="Convert potential inquiries into successful deals."
        />
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl border-slate-200">
            <Filter size={18} className="mr-2" />
            Filter
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="rounded-xl shadow-lg shadow-emerald-200">
            <Plus size={18} className="mr-2" />
            New Lead
          </Button>
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Leads', value: leads.length, color: 'slate' },
          { label: 'New Inquiries', value: leads.filter(l => l.status === 'New').length, color: 'blue' },
          { label: 'Active Deals', value: leads.filter(l => ['Contacted', 'Interested', 'Negotiation'].includes(l.status)).length, color: 'emerald' },
          { label: 'Conversion Rate', value: '24%', color: 'orange' },
        ].map((stat, i) => (
          <Card key={i} className="p-6 border-none shadow-sm ring-1 ring-slate-200/50 bg-white hover:ring-emerald-500/30 transition-all group">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                stat.color === 'blue' ? "bg-blue-50 text-blue-600" :
                stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                stat.color === 'orange' ? "bg-orange-50 text-orange-600" :
                "bg-slate-50 text-slate-600"
              )}>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex bg-white border border-slate-200 rounded-2xl p-1 shadow-sm w-fit overflow-x-auto no-scrollbar">
          {['All', 'New', 'Active', 'Closed'].map((tab) => (
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
              {tab}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by client, title, or requirement..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Leads Table */}
      <Card className="p-0 border-none shadow-sm ring-1 ring-slate-200/50 overflow-hidden bg-white">
        <ResponsiveTable 
          columns={columns}
          data={filteredLeads}
          keyExtractor={(l) => l.id}
          isLoading={loading}
          emptyMessage="No leads found in this stage."
          rowClassName="group hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0"
        />
      </Card>

      {/* Add Lead Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Lead"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cancel</Button>
            <Button onClick={handleSubmit} className="rounded-xl shadow-lg shadow-emerald-200 px-8">Create Lead</Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-10 py-4">
          <div className="flex justify-end">
            <button 
              type="button"
              onClick={() => {
                setIsNewClient(true);
                setFormData({
                  ...formData,
                  new_client_name: 'Rahul Khanna',
                  new_client_phone: '9876543210',
                  new_client_email: 'rahul@example.com',
                  title: 'Interested in 3BHK Apartment',
                  source: 'Call',
                  min_budget: '6000000',
                  max_budget: '8000000',
                  preferred_location: 'South Delhi',
                  property_type: 'Apartment',
                  required_area: '1500',
                  bhk_requirement: '3 BHK',
                  parking_requirement: 'Required',
                  facing_preference: 'East',
                  construction_status: 'Ready to move',
                  notes: 'Client wants 3 BHK house in gated society near highway.'
                });
              }}
              className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest hover:underline"
            >
              Auto-fill sample data
            </button>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Client Identification</h3>
              <button 
                type="button"
                onClick={() => setIsNewClient(!isNewClient)}
                className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest hover:underline"
              >
                {isNewClient ? 'Select Existing' : '+ Create New Client'}
              </button>
            </div>

            {isNewClient ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="md:col-span-2">
                  <Input 
                    label="Full Name"
                    required={isNewClient}
                    value={formData.new_client_name}
                    onChange={(e) => setFormData({...formData, new_client_name: e.target.value})}
                    placeholder="e.g. Rahul Khanna"
                  />
                </div>
                <Input 
                  label="Primary Phone"
                  required={isNewClient}
                  value={formData.new_client_phone}
                  onChange={(e) => setFormData({...formData, new_client_phone: e.target.value})}
                  placeholder="98765 43210"
                />
                <Input 
                  label="Email Address"
                  type="email"
                  value={formData.new_client_email}
                  onChange={(e) => setFormData({...formData, new_client_email: e.target.value})}
                  placeholder="rahul@example.com"
                />
              </div>
            ) : (
              <Select 
                required={!isNewClient}
                value={formData.client_id}
                onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                options={[
                  { value: '', label: 'Choose a client...' },
                  ...clients.map(c => ({ value: c.id, label: c.name }))
                ]}
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2">
              <Input 
                label="Lead Title / Requirement Summary"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g. Looking for 3BHK in South Delhi"
                className="font-bold"
              />
            </div>

            <Select 
              label="Inquiry Source"
              value={formData.source}
              onChange={(e) => setFormData({...formData, source: e.target.value as any})}
              options={[
                { value: 'Call', label: 'Phone Call' },
                { value: 'Website', label: 'Website Inquiry' },
                { value: 'Referral', label: 'Client Referral' },
                { value: 'Walk-in', label: 'Office Walk-in' },
                { value: 'WhatsApp', label: 'WhatsApp Business' },
                { value: 'Portal', label: 'Property Portal' },
              ]}
            />

            <Select 
              label="Initial Status"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value as any})}
              options={[
                { value: 'New', label: 'New Lead' },
                { value: 'Contacted', label: 'Contacted' },
                { value: 'Interested', label: 'Interested' },
                { value: 'Negotiation', label: 'Negotiation' },
              ]}
            />

            <div className="md:col-span-2 pt-8 border-t border-slate-100">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6">Budget & Location</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Min Budget (₹)"
                    type="number"
                    value={formData.min_budget}
                    onChange={(e) => setFormData({...formData, min_budget: e.target.value})}
                    placeholder="Min"
                  />
                  <Input 
                    label="Max Budget (₹)"
                    type="number"
                    value={formData.max_budget}
                    onChange={(e) => setFormData({...formData, max_budget: e.target.value})}
                    placeholder="Max"
                  />
                </div>
                <Input 
                  label="Preferred Location"
                  value={formData.preferred_location}
                  onChange={(e) => setFormData({...formData, preferred_location: e.target.value})}
                  placeholder="e.g. South Delhi, Gurgaon"
                />
              </div>
            </div>

            <div className="md:col-span-2 pt-8 border-t border-slate-100">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6">Technical Requirements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Select 
                  label="Property Type"
                  value={formData.property_type}
                  onChange={(e) => setFormData({...formData, property_type: e.target.value})}
                  options={[
                    { value: 'Plot', label: 'Residential Plot' },
                    { value: 'House', label: 'Independent House' },
                    { value: 'Apartment', label: 'Apartment / Flat' },
                    { value: 'Shop', label: 'Retail Shop' },
                    { value: 'Office', label: 'Office Space' },
                    { value: 'Villa', label: 'Luxury Villa' },
                    { value: 'Land', label: 'Agricultural Land' },
                    { value: 'Commercial', label: 'Commercial Building' },
                  ]}
                />
                <Input 
                  label="BHK Requirement"
                  value={formData.bhk_requirement}
                  onChange={(e) => setFormData({...formData, bhk_requirement: e.target.value})}
                  placeholder="e.g. 3 BHK + Study"
                />
                <Input 
                  label="Required Area (sq ft)"
                  type="number"
                  value={formData.required_area}
                  onChange={(e) => setFormData({...formData, required_area: e.target.value})}
                  placeholder="e.g. 1500"
                />
                <Select 
                  label="Facing Preference"
                  value={formData.facing_preference}
                  onChange={(e) => setFormData({...formData, facing_preference: e.target.value})}
                  options={[
                    { value: 'Any', label: 'Any Direction' },
                    { value: 'East', label: 'East Facing' },
                    { value: 'North', label: 'North Facing' },
                    { value: 'West', label: 'West Facing' },
                    { value: 'South', label: 'South Facing' },
                  ]}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-8 border-t border-slate-100">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Detailed Notes</label>
            <textarea 
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all duration-200 h-32 resize-none"
              placeholder="Record specific client preferences, timeline, or context..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
