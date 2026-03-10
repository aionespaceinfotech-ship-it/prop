import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, Clock3, MapPin, MessageCircle, Phone, PhoneCall, Plus, Search, User, Filter, X, Share2, Users } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { ResponsiveTable } from '../components/ui/ResponsiveTable';
import { Badge } from '../components/ui/Badge';
import { AdaptiveDrawer } from '../components/ui/AdaptiveDrawer';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { toast } from 'sonner';
import { DataPageLayout } from '../components/ui/DataPageLayout';
import { useApi } from '../hooks/useApi';
import { usePermissions } from '../hooks/usePermissions';
import { formatCurrency, formatDate } from '../utils/formatters';
import { cn } from '../utils/cn';
import {
  APPROVAL_TYPES,
  FACING_OPTIONS,
  LEAD_SOURCES,
  LEAD_STATUSES,
  PROPERTY_TYPES,
  ROAD_WIDTH_PRESETS_FT,
} from '../constants/realEstate';

interface Lead {
  id: number;
  client_id: number;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  source: (typeof LEAD_SOURCES)[number];
  status: (typeof LEAD_STATUSES)[number];
  assigned_to: number | null;
  broker_name: string | null;
  min_budget: number | null;
  max_budget: number | null;
  preferred_location: string | null;
  property_type_interested: (typeof PROPERTY_TYPES)[number] | null;
  authority_preference: (typeof APPROVAL_TYPES)[number] | null;
  notes: string | null;
  created_at: string;
  plot_size: string | null;
  req_corner_plot: number | null;
  req_road_width: number | null;
  req_facing: string | null;
  req_gated_colony: number | null;
  req_park_facing: number | null;
  req_bhk: number | null;
  req_floor_preference: string | null;
  req_lift_required: number | null;
  req_parking: number | null;
  req_furnishing: string | null;
}

interface Property {
  id: number;
  title: string;
  location: string;
  price: number;
  type: (typeof PROPERTY_TYPES)[number];
  area: number;
  approval_type: string | null;
  facing: string | null;
  road_width_ft: number | null;
  corner_plot: number;
  images: string;
}

interface Agent {
  id: number;
  name: string;
}

interface Client {
  id: number;
  name: string;
  phone: string;
  email: string;
}

interface Followup {
  id: number;
  followup_date: string;
  notes: string;
  created_by_name: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  'New Lead': 'bg-blue-600 text-white',
  Contacted: 'bg-cyan-600 text-white',
  Interested: 'bg-emerald-600 text-white',
  'Site Visit': 'bg-indigo-600 text-white',
  Negotiation: 'bg-amber-600 text-white',
  Closed: 'bg-green-700 text-white',
  Lost: 'bg-rose-600 text-white',
};

const DEFAULT_FORM = {
  customer_name: '',
  phone: '',
  email: '',
  source: 'Referral' as (typeof LEAD_SOURCES)[number],
  assigned_to: '',
  notes: '',
  min_budget: '',
  max_budget: '',
  preferred_location: '',
  property_type_interested: 'Plot' as (typeof PROPERTY_TYPES)[number],
  authority_preference: '',
  plot_size: '',
  corner_plot: '0',
  road_width: '',
  facing: 'North',
  park_facing: '0',
  gated_colony: '0',
  bhk: '2',
  floor_preference: '',
  lift_required: '1',
  parking: '1',
  furnishing: 'Semi Furnished',
  next_followup_date: '',
  followup_notes: '',
};

function parseImages(raw?: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isPlotType(type?: string | null) {
  return type === 'Plot' || type === 'Agriculture Land';
}

function isResidentialType(type?: string | null) {
  return type === 'Flat' || type === 'Villa' || type === 'Independent House';
}

export default function Leads() {
  const api = useApi();
  const { isManager } = usePermissions();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('');

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [followupDate, setFollowupDate] = useState('');
  const [followupNotes, setFollowupNotes] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [duplicateLeadText, setDuplicateLeadText] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leadsRes, propertiesRes, agentsRes, clientsRes] = await Promise.all([
        api.get('/leads'),
        api.get('/properties'),
        api.get('/agents'),
        api.get('/clients'),
      ]);
      setLeads(leadsRes);
      setProperties(propertiesRes);
      setAgents(agentsRes);
      setClients(clientsRes);

      if (!selectedLead && leadsRes.length > 0) {
        setSelectedLead(leadsRes[0]);
      } else if (selectedLead) {
        const refreshed = leadsRes.find((item: Lead) => item.id === selectedLead.id);
        setSelectedLead(refreshed || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowups = async (leadId: number) => {
    try {
      const res = await api.get(`/leads/${leadId}/followups`);
      setFollowups(res);
    } catch (err) {
      console.error(err);
      setFollowups([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedLead?.id) {
      fetchFollowups(selectedLead.id);
    } else {
      setFollowups([]);
    }
  }, [selectedLead?.id]);

  useEffect(() => {
    if (!formData.phone.trim()) {
      setDuplicateLeadText('');
      return;
    }

    const phone = formData.phone.trim();
    const existingClient = clients.find((c) => c.phone === phone);
    if (!existingClient) {
      setDuplicateLeadText('');
      return;
    }

    const existingLead = leads.find((lead) => lead.client_phone === phone);
    if (existingLead) {
      setDuplicateLeadText(`This phone number already exists. Last lead status: ${existingLead.status}`);
    } else {
      setDuplicateLeadText('This phone number already exists in customer records.');
    }
  }, [clients, formData.phone, leads]);

  const filteredLeads = useMemo(() => {
    return leads
      .filter((lead) => {
        const q = search.trim().toLowerCase();
        const matchesSearch = !q
          || lead.client_name?.toLowerCase().includes(q)
          || lead.client_phone?.toLowerCase().includes(q);
        const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
        const matchesLocation = !locationFilter.trim()
          || (lead.preferred_location || '').toLowerCase().includes(locationFilter.toLowerCase());
        return matchesSearch && matchesStatus && matchesLocation;
      })
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  }, [leads, search, statusFilter, locationFilter]);

  const matchingProperties = useMemo(() => {
    if (!selectedLead) return [];

    return properties.filter((property) => {
      const matchesType = !selectedLead.property_type_interested || property.type === selectedLead.property_type_interested;
      const matchesLocation = !selectedLead.preferred_location
        || property.location.toLowerCase().includes(selectedLead.preferred_location.toLowerCase());
      const matchesMinBudget = !selectedLead.min_budget || property.price >= selectedLead.min_budget;
      const matchesMaxBudget = !selectedLead.max_budget || property.price <= selectedLead.max_budget;
      const matchesAuthority = !selectedLead.authority_preference || property.approval_type === selectedLead.authority_preference;

      if (isPlotType(selectedLead.property_type_interested)) {
        const matchesRoad = !selectedLead.req_road_width || property.road_width_ft === selectedLead.req_road_width;
        const matchesFacing = !selectedLead.req_facing || property.facing === selectedLead.req_facing;
        const matchesCorner = selectedLead.req_corner_plot == null || property.corner_plot === selectedLead.req_corner_plot;
        return matchesType && matchesLocation && matchesMinBudget && matchesMaxBudget && matchesAuthority && matchesRoad && matchesFacing && matchesCorner;
      }

      return matchesType && matchesLocation && matchesMinBudget && matchesMaxBudget && matchesAuthority;
    });
  }, [properties, selectedLead]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_name.trim() || !formData.phone.trim()) {
      toast.error('Customer name and phone are required');
      return;
    }

    try {
      let clientId: number;
      const existingClient = clients.find((c) => c.phone === formData.phone.trim());

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const clientRes = await api.post('/clients', {
          name: formData.customer_name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          type: 'Buyer',
          notes: formData.notes.trim(),
        });
        clientId = clientRes.id;
      }

      const leadRes = await api.post('/leads', {
        client_id: clientId,
        title: `${formData.customer_name.trim()} Requirement`,
        source: formData.source,
        status: 'New Lead',
        assigned_to: formData.assigned_to ? Number(formData.assigned_to) : undefined,
        min_budget: formData.min_budget ? Number(formData.min_budget) : undefined,
        max_budget: formData.max_budget ? Number(formData.max_budget) : undefined,
        preferred_location: formData.preferred_location.trim(),
        preferred_locations: formData.preferred_location.trim() ? [formData.preferred_location.trim()] : [],
        property_type_interested: formData.property_type_interested,
        authority_preference: formData.authority_preference || undefined,
        email: formData.email.trim(),
        notes: formData.notes.trim(),
        plot_size: isPlotType(formData.property_type_interested) ? formData.plot_size || undefined : undefined,
        corner_plot: isPlotType(formData.property_type_interested) ? Number(formData.corner_plot) : undefined,
        road_width: isPlotType(formData.property_type_interested) && formData.road_width ? Number(formData.road_width) : undefined,
        facing: isPlotType(formData.property_type_interested) ? formData.facing : undefined,
        park_facing: isPlotType(formData.property_type_interested) ? Number(formData.park_facing) : undefined,
        gated_colony: isPlotType(formData.property_type_interested) ? Number(formData.gated_colony) : undefined,
        bhk: isResidentialType(formData.property_type_interested) ? Number(formData.bhk) : undefined,
        floor_preference: isResidentialType(formData.property_type_interested) ? formData.floor_preference || undefined : undefined,
        lift_required: isResidentialType(formData.property_type_interested) ? Number(formData.lift_required) : undefined,
        parking: isResidentialType(formData.property_type_interested) ? Number(formData.parking) : undefined,
        furnishing: isResidentialType(formData.property_type_interested) ? formData.furnishing : undefined,
      });

      if (formData.next_followup_date) {
        await api.post(`/leads/${leadRes.id}/followups`, {
          followup_date: formData.next_followup_date,
          notes: formData.followup_notes || 'Initial follow-up scheduled',
        });
      }

      setFormData(DEFAULT_FORM);
      setDuplicateLeadText('');
      setIsModalOpen(false);
      toast.success('Lead created and pipeline initialized');
      await fetchData();

      const leadsData = await api.get('/leads');
      const leadRow = leadsData.find((item: Lead) => item.id === leadRes.id);
      if (leadRow) setSelectedLead(leadRow);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to create lead');
    }
  };

  const handleStatusChange = async (lead: Lead, status: string) => {
    try {
      await api.put(`/leads/${lead.id}`, { status });
      toast.success(`Lead status updated to ${status}`);
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  const addFollowup = async () => {
    if (!selectedLead) return;
    if (!followupDate) {
      toast.error('Please select a follow-up date');
      return;
    }

    try {
      await api.post(`/leads/${selectedLead.id}/followups`, {
        followup_date: followupDate,
        notes: followupNotes.trim(),
      });
      toast.success('Follow-up activity recorded');
      setFollowupDate('');
      setFollowupNotes('');
      fetchFollowups(selectedLead.id);
    } catch (err) {
      console.error(err);
      toast.error('Failed to add follow-up');
    }
  };

  const shareMatches = () => {
    if (!selectedLead) return;

    const lines = [
      `Hello ${selectedLead.client_name},`,
      '',
      'As per your requirement, here are some matching properties:',
      '',
    ];

    matchingProperties.slice(0, 5).forEach((property, idx) => {
      lines.push(`${idx + 1}. ${property.title}`);
      lines.push(`   Location: ${property.location}`);
      lines.push(`   Size: ${property.area} sqft`);
      lines.push(`   Price: ${formatCurrency(property.price)}`);
      if (property.road_width_ft) lines.push(`   Road: ${property.road_width_ft}ft`);
      if (property.facing) lines.push(`   Facing: ${property.facing}`);
      lines.push('');
    });

    lines.push('Let me know if you would like to schedule a site visit.');

    const url = `https://wa.me/${selectedLead.client_phone || ''}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(url, '_blank');
  };

  const bulkShareMatches = () => {
    if (selectedLeadIds.length === 0) return;
    const selectedLeads = leads.filter(l => selectedLeadIds.includes(l.id));
    
    let text = `📋 *Lead Pipeline Summary*\n`;
    text += `Identified ${selectedLeads.length} active prospects for review:\n\n`;
    
    selectedLeads.slice(0, 10).forEach((l, i) => {
      text += `${i + 1}. *${l.client_name}*\n`;
      text += `   📞 ${l.client_phone}\n`;
      text += `   🏘️ ${l.property_type_interested || 'Any'} | 💰 ${formatCurrency(l.min_budget || 0)} - ${formatCurrency(l.max_budget || 0)}\n`;
      text += `   📍 ${l.preferred_location || 'Any'}\n\n`;
    });

    if (selectedLeads.length > 10) {
      text += `...and ${selectedLeads.length - 10} more prospects in the pipeline.\n\n`;
    }
    
    text += `Manage Pipeline:\n🔗 ${window.location.origin}/leads`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const leadColumns = [
    {
      header: 'Customer',
      accessor: (lead: Lead) => (
        <div className="flex flex-col">
          <p className="font-bold text-slate-900 leading-none truncate md:max-w-[165px] lg:max-w-[220px]" title={lead.client_name}>
            {lead.client_name}
          </p>
          <p className="text-[10px] text-slate-500 mt-1.5 tabular-nums font-medium tracking-wider">{lead.client_phone}</p>
        </div>
      ),
      className: 'md:min-w-[145px]',
    },
    {
      header: 'Budget & Location',
      accessor: (lead: Lead) => (
        <div className="flex flex-col">
          <span className="text-slate-700 font-bold text-xs">
            {formatCurrency(lead.min_budget || 0)} - {formatCurrency(lead.max_budget || 0)}
          </span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1 block truncate md:max-w-[145px] lg:max-w-[210px]" title={lead.preferred_location || '-'}>
            {lead.preferred_location || '-'}
          </span>
        </div>
      ),
      className: 'md:min-w-[170px]',
    },
    {
      header: 'Requirement',
      accessor: (lead: Lead) => <Badge variant="neutral" className="text-[9px] font-black uppercase tracking-widest">{lead.property_type_interested || '-'}</Badge>,
      className: 'md:min-w-[100px]',
      hideOnMobile: true,
    },
    {
      header: 'Status',
      accessor: (lead: Lead) => (
        <Select
          value={lead.status}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => handleStatusChange(lead, e.target.value)}
          className={cn('h-8 py-0 rounded-lg border-none text-[9px] font-black uppercase tracking-widest min-w-[110px] shadow-sm', STATUS_COLORS[lead.status] || 'bg-slate-900 text-white')}
          options={LEAD_STATUSES.map((item) => ({ value: item, label: item }))}
        />
      ),
      className: 'md:min-w-[120px]',
    },
    {
      header: 'Actions',
      accessor: (lead: Lead) => (
        <div className="flex items-center gap-1.5 justify-start md:justify-end" onClick={(e) => e.stopPropagation()}>
          <Button size="icon" variant="outline" className="h-8 w-8 rounded-xl border-slate-200" onClick={() => window.open(`tel:${lead.client_phone}`, '_self')}>
            <PhoneCall size={12} />
          </Button>
          <Button size="icon" variant="outline" className="h-8 w-8 rounded-xl border-slate-200" onClick={() => window.open(`https://wa.me/${lead.client_phone}`, '_blank')}>
            <MessageCircle size={12} />
          </Button>
        </div>
      ),
      className: 'md:min-w-[60px]',
    },
  ];

  const filterContent = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Select
        label="Lead Status"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        options={[{ value: 'All', label: 'All Statuses' }, ...LEAD_STATUSES.map((s) => ({ value: s, label: s }))]}
      />
      <Input
        label="Preferred Location"
        value={locationFilter}
        onChange={(e) => setLocationFilter(e.target.value)}
        placeholder="e.g. Udaipur, Downtown"
      />
      <div className="flex items-end">
        <Button 
          variant="ghost" 
          className="text-slate-500 text-xs uppercase font-bold tracking-widest"
          onClick={() => {
            setStatusFilter('All');
            setLocationFilter('');
            setSearch('');
          }}
        >
          Reset All Filters
        </Button>
      </div>
    </div>
  );

  return (
    <DataPageLayout
      title="Lead Pipeline"
      subtitle="Track requirements and manage prospect conversions."
      primaryAction={{
        label: "Initialize Lead",
        onClick: () => setIsModalOpen(true),
        icon: <Plus size={18} className="mr-2" />
      }}
      search={{
        value: search,
        onChange: setSearch,
        placeholder: "Search by customer name or phone..."
      }}
      filters={{
        content: filterContent
      }}
    >
      <div className="space-y-8">
        {selectedLeadIds.length > 0 && (
          <div className="bg-emerald-600 p-4 rounded-3xl flex items-center justify-between shadow-xl shadow-emerald-100 animate-in slide-in-from-top-4 duration-500 mx-4 sm:mx-0">
            <div className="flex items-center gap-4 ml-2">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0">
                <Users size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-black uppercase tracking-widest leading-none">{selectedLeadIds.length} Selected</p>
                <p className="text-emerald-100 text-[10px] font-medium mt-1">Bulk engagement mode</p>
              </div>
            </div>
            <Button variant="outline" className="bg-white text-emerald-600 border-none rounded-2xl h-11 px-6 shadow-lg shrink-0" onClick={bulkShareMatches}>
              <Share2 size={16} className="mr-2" />
              Share Matches
            </Button>
          </div>
        )}

        {/* Table View */}
        <Card className="p-0 border-none shadow-sm ring-1 ring-slate-200 overflow-hidden bg-white rounded-[2.5rem]">
          <ResponsiveTable
            columns={leadColumns}
            data={filteredLeads}
            keyExtractor={(lead) => lead.id}
            onRowClick={(lead) => setSelectedLead(lead)}
            selectedIds={selectedLeadIds}
            onSelectionChange={(ids) => setSelectedLeadIds(ids as number[])}
            isLoading={loading}
            emptyMessage="No leads identified in your current pipeline."
            rowClassName="hover:bg-slate-50/80 transition-all duration-300"
            headerCellClassName="bg-slate-50/50"
          />
        </Card>

        {/* Detail View */}
        {selectedLead ? (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="p-6 lg:p-8 border-none shadow-sm ring-1 ring-slate-200 xl:col-span-2 space-y-8 rounded-[2.5rem]">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-slate-50 pb-8">
                <div className="min-w-0">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight truncate">{selectedLead.client_name}</h3>
                  <div className="flex items-center gap-3 mt-2 text-slate-500 text-sm font-medium">
                    <span className="flex items-center gap-1.5"><Phone size={14} className="text-emerald-500" />{selectedLead.client_phone}</span>
                    <span className="text-slate-200">|</span>
                    <Badge variant="neutral" className="bg-slate-100 border-none text-[9px] font-black uppercase tracking-widest px-2 py-1">{selectedLead.status}</Badge>
                  </div>
                </div>
                <div className="flex gap-3 shrink-0">
                  <Button variant="outline" size="sm" className="rounded-xl px-5 h-11 border-slate-200" onClick={() => window.open(`tel:${selectedLead.client_phone}`, '_self')}>
                    <PhoneCall size={16} className="mr-2" />
                    Call
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-xl px-5 h-11 border-slate-200" onClick={() => window.open(`https://wa.me/${selectedLead.client_phone}`, '_blank')}>
                    <MessageCircle size={16} className="mr-2" />
                    WhatsApp
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Requirement Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Budget Range</p>
                      <p className="text-sm font-black text-slate-900 mt-1">{formatCurrency(selectedLead.min_budget || 0)} - {formatCurrency(selectedLead.max_budget || 0)}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Property Type</p>
                      <p className="text-sm font-black text-slate-900 mt-1">{selectedLead.property_type_interested || '-'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location Preference</p>
                      <p className="text-sm font-black text-slate-900 mt-1 flex items-center gap-1.5"><MapPin size={12} className="text-rose-500" />{selectedLead.preferred_location || '-'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authority</p>
                      <p className="text-sm font-black text-slate-900 mt-1">{selectedLead.authority_preference || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Detailed Specs</h4>
                  <div className="p-6 bg-slate-900 rounded-[2rem] text-white shadow-xl shadow-slate-200">
                    {isPlotType(selectedLead.property_type_interested) ? (
                      <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                        <div>
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Plot Size</p>
                          <p className="text-sm font-bold mt-0.5">{selectedLead.plot_size || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Facing</p>
                          <p className="text-sm font-bold mt-0.5">{selectedLead.req_facing || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Road Width</p>
                          <p className="text-sm font-bold mt-0.5">{selectedLead.req_road_width ? `${selectedLead.req_road_width}ft` : '-'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Corner Plot</p>
                          <p className="text-sm font-bold mt-0.5">{selectedLead.req_corner_plot ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                        <div>
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Unit BHK</p>
                          <p className="text-sm font-bold mt-0.5">{selectedLead.req_bhk || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Floor Pref</p>
                          <p className="text-sm font-bold mt-0.5">{selectedLead.req_floor_preference || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Parking</p>
                          <p className="text-sm font-bold mt-0.5">{selectedLead.req_parking ? 'Yes' : 'No'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Lift Access</p>
                          <p className="text-sm font-bold mt-0.5">{selectedLead.req_lift_required ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Matching Properties ({matchingProperties.length})</h4>
                  <Button variant="success" size="sm" onClick={shareMatches} disabled={matchingProperties.length === 0} className="rounded-2xl h-11 px-6 text-[10px] uppercase tracking-widest font-black shadow-lg shadow-emerald-100">
                    <Share2 size={16} className="mr-2" />
                    Share Best Matches
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                  {matchingProperties.slice(0, 4).map((property) => {
                    const image = parseImages(property.images)[0] || `https://picsum.photos/seed/prop-${property.id}/800/600`;
                    return (
                      <div key={property.id} className="group relative rounded-[2rem] overflow-hidden border border-slate-100 bg-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                        <div className="h-36 w-full overflow-hidden relative">
                          <img src={image} alt={property.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="p-4">
                          <p className="font-black text-slate-900 text-sm truncate">{property.title}</p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs font-black text-emerald-600">{formatCurrency(property.price)}</p>
                            <Badge className="bg-slate-50 text-slate-400 border-none text-[8px] font-black uppercase tracking-tighter px-2 py-0.5">{property.area} sqft</Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {matchingProperties.length === 0 ? (
                    <div className="col-span-full py-12 text-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                      <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">No matching assets identified.</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>

            <Card className="p-6 lg:p-8 border-none shadow-sm ring-1 ring-slate-200 space-y-8 h-fit sticky top-8 rounded-[2.5rem]">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Timeline Engine</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Lifecycle interactions</p>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-emerald-50/50 rounded-[2rem] border border-emerald-100 space-y-4">
                  <Input label="Next Engagement" type="datetime-local" value={followupDate} onChange={(e) => setFollowupDate(e.target.value)} className="bg-white border-emerald-200" />
                  <textarea 
                    value={followupNotes} 
                    onChange={(e) => setFollowupNotes(e.target.value)} 
                    placeholder="Brief interaction notes..."
                    className="w-full bg-white border border-emerald-200 rounded-2xl py-3 px-4 text-xs h-24 resize-none outline-none focus:ring-4 focus:ring-emerald-500/10"
                  />
                  <Button onClick={addFollowup} className="w-full rounded-2xl h-12 shadow-xl shadow-emerald-200/50">
                    <CalendarClock size={16} className="mr-2" />
                    Commit Activity
                  </Button>
                </div>

                <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">
                    <Clock3 size={14} /> Audit Trail
                  </div>
                  {followups.map((item) => (
                    <div key={item.id} className="relative pl-8 pb-8 border-l-2 border-slate-50 last:pb-0">
                      <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-white border-4 border-emerald-500 shadow-sm" />
                      <p className="text-xs font-bold text-slate-800 leading-relaxed">{item.notes || 'Engagement record'}</p>
                      <p className="text-[10px] text-slate-400 mt-2 font-medium tracking-wide">{formatDate(item.followup_date)} {item.created_by_name ? `• ${item.created_by_name}` : ''}</p>
                    </div>
                  ))}
                  <div className="relative pl-8 border-l-2 border-slate-50">
                    <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-white border-4 border-blue-500 shadow-sm" />
                    <p className="text-xs font-bold text-slate-800">Pipeline Inception</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-medium tracking-wide">{formatDate(selectedLead.created_at)}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ) : null}
      </div>

      {/* Add Lead Modal */}
      <AdaptiveDrawer
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Lead"
        size="xl"
        footer={
          <div className="flex flex-col sm:flex-row justify-between w-full gap-3">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="order-2 sm:order-1">Discard</Button>
            <Button onClick={handleCreateLead} className="shadow-lg shadow-emerald-200 order-1 sm:order-2">Save & Initialize Lead</Button>
          </div>
        }
      >
        <form onSubmit={handleCreateLead} className="space-y-10 py-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pb-2 border-b border-slate-100">Client Contact</h4>
              <Input label="Customer Name" required value={formData.customer_name} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} placeholder="e.g. Rahul Sharma" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Phone Number" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="98765 43210" />
                <Input label="Email (Optional)" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="rahul@example.com" />
              </div>
              <Select label="Inquiry Source" value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value as (typeof LEAD_SOURCES)[number] })} options={LEAD_SOURCES.map((item) => ({ value: item, label: item }))} />
              {isManager && (
                <Select
                  label="Assign to Agent"
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  options={[{ value: '', label: 'Auto-assign or select' }, ...agents.map((agent) => ({ value: String(agent.id), label: agent.name }))]}
                />
              )}
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pb-2 border-b border-slate-100">Preferences</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Min Budget (₹)" type="number" value={formData.min_budget} onChange={(e) => setFormData({ ...formData, min_budget: e.target.value })} placeholder="0" />
                <Input label="Max Budget (₹)" type="number" value={formData.max_budget} onChange={(e) => setFormData({ ...formData, max_budget: e.target.value })} placeholder="Any" />
              </div>
              <Input label="Location Preference" value={formData.preferred_location} onChange={(e) => setFormData({ ...formData, preferred_location: e.target.value })} placeholder="e.g. Udaipur City" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label="Interested In" value={formData.property_type_interested} onChange={(e) => setFormData({ ...formData, property_type_interested: e.target.value as (typeof PROPERTY_TYPES)[number] })} options={PROPERTY_TYPES.map((item) => ({ value: item, label: item }))} />
                <Select
                  label="Required Authority"
                  value={formData.authority_preference}
                  onChange={(e) => setFormData({ ...formData, authority_preference: e.target.value })}
                  options={[{ value: '', label: 'Any / No Preference' }, ...APPROVAL_TYPES.map((item) => ({ value: item, label: item }))]}
                />
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100">
            {isPlotType(formData.property_type_interested) ? (
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pb-2 border-b border-slate-100">Plot Requirements</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Input label="Plot Size" value={formData.plot_size} onChange={(e) => setFormData({ ...formData, plot_size: e.target.value })} placeholder="1200 sqft" />
                  <Select label="Corner Plot" value={formData.corner_plot} onChange={(e) => setFormData({ ...formData, corner_plot: e.target.value })} options={[{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }]} />
                  <Select label="Road Width" value={formData.road_width} onChange={(e) => setFormData({ ...formData, road_width: e.target.value })} options={[{ value: '', label: 'Select' }, ...ROAD_WIDTH_PRESETS_FT.map((v) => ({ value: String(v), label: `${v}ft` }))]} />
                  <Select label="Facing" value={formData.facing} onChange={(e) => setFormData({ ...formData, facing: e.target.value })} options={FACING_OPTIONS.map((v) => ({ value: v, label: v }))} />
                  <Select label="Park Facing" value={formData.park_facing} onChange={(e) => setFormData({ ...formData, park_facing: e.target.value })} options={[{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }]} />
                  <Select label="Gated Colony" value={formData.gated_colony} onChange={(e) => setFormData({ ...formData, gated_colony: e.target.value })} options={[{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }]} />
                </div>
              </div>
            ) : isResidentialType(formData.property_type_interested) ? (
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pb-2 border-b border-slate-100">Flat / Villa Requirements</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Select label="BHK" value={formData.bhk} onChange={(e) => setFormData({ ...formData, bhk: e.target.value })} options={[1, 2, 3, 4, 5].map((v) => ({ value: String(v), label: String(v) }))} />
                  <Input label="Floor Pref" value={formData.floor_preference} onChange={(e) => setFormData({ ...formData, floor_preference: e.target.value })} placeholder="Mid floor" />
                  <Select label="Lift" value={formData.lift_required} onChange={(e) => setFormData({ ...formData, lift_required: e.target.value })} options={[{ value: '1', label: 'Needed' }, { value: '0', label: 'Not Required' }]} />
                  <Select label="Parking" value={formData.parking} onChange={(e) => setFormData({ ...formData, parking: e.target.value })} options={[{ value: '1', label: 'Needed' }, { value: '0', label: 'Not Required' }]} />
                  <Select
                    label="Furnishing"
                    value={formData.furnishing}
                    onChange={(e) => setFormData({ ...formData, furnishing: e.target.value })}
                    options={[
                      { value: 'Furnished', label: 'Fully Furnished' },
                      { value: 'Semi Furnished', label: 'Semi-Furnished' },
                      { value: 'Unfurnished', label: 'Unfurnished' },
                    ]}
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="pt-8 border-t border-slate-100">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pb-4 block">Engagement Strategy</h4>
            <div className="bg-slate-50 rounded-3xl p-6 lg:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input label="First Follow-up Date" type="datetime-local" value={formData.next_followup_date} onChange={(e) => setFormData({ ...formData, next_followup_date: e.target.value })} />
                <Input label="Engagement Notes" value={formData.followup_notes} onChange={(e) => setFormData({ ...formData, followup_notes: e.target.value })} placeholder="e.g. Schedule a site visit" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Contextual Background</label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all duration-200 h-24 resize-none"
                  placeholder="Record unique preferences or background history..."
                />
              </div>
            </div>
          </div>
        </form>
      </AdaptiveDrawer>
    </DataPageLayout>
  );
}
