import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, Clock3, MapPin, MessageCircle, Phone, PhoneCall, Plus, Search, User } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ResponsiveTable } from '../components/ui/ResponsiveTable';
import { Badge } from '../components/ui/Badge';
import { useApi } from '../hooks/useApi';
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

  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('');

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
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
      alert('Failed to load lead data');
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
      alert('Customer name and phone are required.');
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
      await fetchData();

      const leadRow = (await api.get('/leads')).find((item: Lead) => item.id === leadRes.id);
      if (leadRow) setSelectedLead(leadRow);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to create lead');
    }
  };

  const handleStatusChange = async (lead: Lead, status: string) => {
    try {
      await api.put(`/leads/${lead.id}`, { status });
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const addFollowup = async () => {
    if (!selectedLead) return;
    if (!followupDate) {
      alert('Select follow-up date.');
      return;
    }

    try {
      await api.post(`/leads/${selectedLead.id}/followups`, {
        followup_date: followupDate,
        notes: followupNotes.trim(),
      });
      setFollowupDate('');
      setFollowupNotes('');
      fetchFollowups(selectedLead.id);
    } catch (err) {
      console.error(err);
      alert('Failed to add follow-up');
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

  const leadColumns = [
    {
      header: 'Customer Name',
      accessor: (lead: Lead) => (
        <p className="font-semibold text-slate-900 leading-5 truncate max-w-[165px] xl:max-w-[220px]" title={lead.client_name}>
          {lead.client_name}
        </p>
      ),
      className: 'min-w-[145px]',
    },
    {
      header: 'Phone',
      accessor: (lead: Lead) => <span className="whitespace-nowrap tabular-nums">{lead.client_phone}</span>,
      className: 'min-w-[118px] whitespace-nowrap',
    },
    {
      header: 'Budget',
      accessor: (lead: Lead) => (
        <span className="whitespace-nowrap text-slate-700">
          {formatCurrency(lead.min_budget || 0)} - {formatCurrency(lead.max_budget || 0)}
        </span>
      ),
      className: 'min-w-[170px] whitespace-nowrap',
    },
    {
      header: 'Location',
      accessor: (lead: Lead) => (
        <span className="block truncate max-w-[145px] xl:max-w-[210px]" title={lead.preferred_location || '-'}>
          {lead.preferred_location || '-'}
        </span>
      ),
      className: 'min-w-[130px]',
    },
    {
      header: 'Property Type',
      accessor: (lead: Lead) => lead.property_type_interested || '-',
      className: 'min-w-[118px] whitespace-nowrap',
    },
    {
      header: 'Status',
      accessor: (lead: Lead) => (
        <Select
          value={lead.status}
          onChange={(e) => handleStatusChange(lead, e.target.value)}
          className={cn('h-9 py-0 rounded-xl border-none text-xs font-bold min-w-[118px]', STATUS_COLORS[lead.status] || 'bg-slate-900 text-white')}
          options={LEAD_STATUSES.map((item) => ({ value: item, label: item }))}
        />
      ),
      className: 'min-w-[128px]',
    },
    {
      header: 'Assigned Agent',
      accessor: (lead: Lead) => lead.broker_name || '-',
      className: 'hidden 2xl:table-cell min-w-[130px]',
    },
    {
      header: 'Source',
      accessor: (lead: Lead) => lead.source,
      className: 'min-w-[105px] whitespace-nowrap',
    },
    {
      header: 'Created Date',
      accessor: (lead: Lead) => <span className="whitespace-nowrap">{formatDate(lead.created_at)}</span>,
      className: 'min-w-[110px] whitespace-nowrap',
    },
    {
      header: 'Quick Contact',
      accessor: (lead: Lead) => (
        <div className="flex items-center gap-2 justify-start xl:justify-end flex-nowrap">
          <Button size="sm" variant="outline" className="shrink-0 px-2.5" onClick={() => window.open(`tel:${lead.client_phone}`, '_self')}>
            <PhoneCall size={13} />
          </Button>
          <Button size="sm" variant="outline" className="shrink-0 px-2.5" onClick={() => window.open(`https://wa.me/${lead.client_phone}`, '_blank')}>
            <MessageCircle size={13} />
          </Button>
        </div>
      ),
      className: 'min-w-[112px]',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-6 xl:p-8 bg-slate-50 min-h-full space-y-6 max-w-[1700px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader title="Lead Management" subtitle="Capture requirements, track pipeline, and share matching properties faster." />
        <Button className="rounded-xl shadow-lg shadow-blue-200" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} className="mr-2" />
          Add Lead
        </Button>
      </div>

      <Card className="p-4 sm:p-5 border-none shadow-sm ring-1 ring-slate-200">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
          <div className="lg:col-span-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name or phone"
              className="w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl"
            />
          </div>
          <div className="lg:col-span-3">
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[{ value: 'All', label: 'All Statuses' }, ...LEAD_STATUSES.map((s) => ({ value: s, label: s }))]}
            />
          </div>
          <div className="lg:col-span-3">
            <Input
              label="Location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="Filter by location"
            />
          </div>
        </div>
      </Card>

      <Card className="p-0 border-none shadow-sm ring-1 ring-slate-200 overflow-hidden bg-white">
        <ResponsiveTable
          columns={leadColumns}
          data={filteredLeads}
          keyExtractor={(lead) => lead.id}
          onRowClick={(lead) => setSelectedLead(lead)}
          isLoading={loading}
          emptyMessage="No leads found"
          rowClassName="hover:bg-blue-50/60"
          desktopBreakpoint="lg"
          tableWrapperClassName="border-0 rounded-none"
          tableClassName="min-w-[940px] 2xl:min-w-0 table-fixed"
          headerCellClassName="px-3 py-3 text-[10px] xl:text-[11px]"
          bodyCellClassName="px-3 py-3 text-xs xl:text-sm align-middle"
          mobileContainerClassName="p-4"
        />
      </Card>

      {selectedLead ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="p-5 border-none shadow-sm ring-1 ring-slate-200 xl:col-span-2 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Lead Detail</h3>
                <p className="text-sm text-slate-500">{selectedLead.client_name} • {selectedLead.client_phone}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="neutral">{selectedLead.property_type_interested || '-'}</Badge>
                <Badge variant="info">{selectedLead.status}</Badge>
                <Button size="sm" variant="outline" onClick={() => window.open(`tel:${selectedLead.client_phone}`, '_self')}>
                  <PhoneCall size={14} className="mr-1" />
                  Call
                </Button>
                <Button size="sm" variant="outline" onClick={() => window.open(`https://wa.me/${selectedLead.client_phone}`, '_blank')}>
                  <MessageCircle size={14} className="mr-1" />
                  WhatsApp
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-2">Customer Information</p>
                <p className="text-sm font-semibold text-slate-900 flex items-center gap-2"><User size={14} />{selectedLead.client_name}</p>
                <p className="text-sm text-slate-600 flex items-center gap-2 mt-1"><Phone size={14} />{selectedLead.client_phone}</p>
                <p className="text-sm text-slate-600 mt-1">{selectedLead.client_email || '-'}</p>
                <p className="text-sm text-slate-600 mt-1">Assigned: {selectedLead.broker_name || '-'}</p>
                <p className="text-sm text-slate-600">Source: {selectedLead.source}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-2">Customer Requirements</p>
                <p className="text-sm text-slate-700">Budget: {formatCurrency(selectedLead.min_budget || 0)} - {formatCurrency(selectedLead.max_budget || 0)}</p>
                <p className="text-sm text-slate-700 flex items-center gap-2 mt-1"><MapPin size={14} />{selectedLead.preferred_location || '-'}</p>
                <p className="text-sm text-slate-700 mt-1">Type: {selectedLead.property_type_interested || '-'}</p>
                <p className="text-sm text-slate-700 mt-1">Authority: {selectedLead.authority_preference || '-'}</p>
                {isPlotType(selectedLead.property_type_interested) ? (
                  <>
                    <p className="text-sm text-slate-700 mt-1">Plot Size: {selectedLead.plot_size || '-'}</p>
                    <p className="text-sm text-slate-700 mt-1">Road Width: {selectedLead.req_road_width ? `${selectedLead.req_road_width}ft` : '-'}</p>
                    <p className="text-sm text-slate-700 mt-1">Facing: {selectedLead.req_facing || '-'}</p>
                    <p className="text-sm text-slate-700 mt-1">Corner Plot: {selectedLead.req_corner_plot ? 'Yes' : 'No'}</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-slate-700 mt-1">BHK: {selectedLead.req_bhk || '-'}</p>
                    <p className="text-sm text-slate-700 mt-1">Floor: {selectedLead.req_floor_preference || '-'}</p>
                    <p className="text-sm text-slate-700 mt-1">Lift Required: {selectedLead.req_lift_required ? 'Yes' : 'No'}</p>
                    <p className="text-sm text-slate-700 mt-1">Parking Required: {selectedLead.req_parking ? 'Yes' : 'No'}</p>
                  </>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs uppercase font-bold tracking-wider text-slate-500">Matching Properties ({matchingProperties.length})</p>
                <Button onClick={shareMatches} disabled={matchingProperties.length === 0} className="rounded-xl">
                  <MessageCircle size={14} className="mr-1" />
                  Share Matching Properties
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {matchingProperties.slice(0, 6).map((property) => {
                  const image = parseImages(property.images)[0] || `https://picsum.photos/seed/property-${property.id}/800/600`;
                  return (
                    <div key={property.id} className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                      <img src={image} alt={property.title} className="h-36 w-full object-cover" referrerPolicy="no-referrer" />
                      <div className="p-3 space-y-1">
                        <p className="font-semibold text-slate-900">{property.title}</p>
                        <p className="text-sm text-slate-600">{property.location}</p>
                        <p className="text-sm text-slate-700">Size: {property.area} sqft</p>
                        <p className="text-sm font-semibold text-slate-900">{formatCurrency(property.price)}</p>
                        <p className="text-xs text-slate-500">Facing: {property.facing || '-'} • Road: {property.road_width_ft ? `${property.road_width_ft}ft` : '-'} • Corner: {property.corner_plot ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  );
                })}
                {matchingProperties.length === 0 ? <p className="text-sm text-slate-500">No matching properties found for this requirement.</p> : null}
              </div>
            </div>
          </Card>

          <Card className="p-5 border-none shadow-sm ring-1 ring-slate-200 space-y-4">
            <div>
              <h3 className="font-bold text-slate-900">Follow-ups</h3>
              <p className="text-sm text-slate-500">Track calls, reminders, and visit progress.</p>
            </div>

            <div className="space-y-3 border border-slate-200 rounded-xl p-3 bg-slate-50">
              <Input label="Next Follow-up Date" type="datetime-local" value={followupDate} onChange={(e) => setFollowupDate(e.target.value)} />
              <Input label="Follow-up Notes" value={followupNotes} onChange={(e) => setFollowupNotes(e.target.value)} placeholder="What should be discussed?" />
              <Button onClick={addFollowup} className="w-full rounded-xl">
                <CalendarClock size={14} className="mr-1" />
                Schedule Follow-up
              </Button>
            </div>

            <div className="space-y-3 max-h-[440px] overflow-auto pr-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <Clock3 size={13} /> Timeline
              </div>
              <div className="rounded-xl border border-slate-200 p-3 bg-white">
                <div className="flex gap-2 items-start">
                  <CheckCircle2 size={14} className="text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Lead Created</p>
                    <p className="text-xs text-slate-500">{formatDate(selectedLead.created_at)}</p>
                  </div>
                </div>
              </div>
              {followups.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 p-3 bg-white">
                  <div className="flex gap-2 items-start">
                    <CheckCircle2 size={14} className="text-emerald-600 mt-1" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.notes || 'Follow-up update'}</p>
                      <p className="text-xs text-slate-500">{formatDate(item.followup_date)} {item.created_by_name ? `• ${item.created_by_name}` : ''}</p>
                    </div>
                  </div>
                </div>
              ))}
              {followups.length === 0 ? <p className="text-sm text-slate-500">No follow-up history yet.</p> : null}
            </div>
          </Card>
        </div>
      ) : null}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Lead"
        size="xl"
        footer={
          <div className="flex justify-between w-full">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateLead}>Save Lead</Button>
          </div>
        }
      >
        <form onSubmit={handleCreateLead} className="space-y-6 py-2">
          <div>
            <p className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-3">Basic Information</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Customer Name" required value={formData.customer_name} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} />
              <Input label="Phone Number" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              <Input label="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              <Select label="Lead Source" value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value as (typeof LEAD_SOURCES)[number] })} options={LEAD_SOURCES.map((item) => ({ value: item, label: item }))} />
              <Select
                label="Assigned Agent"
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                options={[{ value: '', label: 'Select agent' }, ...agents.map((agent) => ({ value: String(agent.id), label: agent.name }))]}
              />
              <Input label="Notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
            </div>
            {duplicateLeadText ? (
              <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">{duplicateLeadText}</p>
            ) : null}
          </div>

          <div>
            <p className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-3">Customer Requirement</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Budget Min" type="number" value={formData.min_budget} onChange={(e) => setFormData({ ...formData, min_budget: e.target.value })} />
              <Input label="Budget Max" type="number" value={formData.max_budget} onChange={(e) => setFormData({ ...formData, max_budget: e.target.value })} />
              <Input label="Location Preference" value={formData.preferred_location} onChange={(e) => setFormData({ ...formData, preferred_location: e.target.value })} />
              <Select label="Property Type" value={formData.property_type_interested} onChange={(e) => setFormData({ ...formData, property_type_interested: e.target.value as (typeof PROPERTY_TYPES)[number] })} options={PROPERTY_TYPES.map((item) => ({ value: item, label: item }))} />
              <Select
                label="Property Authority"
                value={formData.authority_preference}
                onChange={(e) => setFormData({ ...formData, authority_preference: e.target.value })}
                options={[{ value: '', label: 'Any Authority' }, ...APPROVAL_TYPES.map((item) => ({ value: item, label: item }))]}
              />
            </div>
          </div>

          {isPlotType(formData.property_type_interested) ? (
            <div>
              <p className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-3">Plot Requirements</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Plot Size" value={formData.plot_size} onChange={(e) => setFormData({ ...formData, plot_size: e.target.value })} placeholder="1200 sqft" />
                <Select label="Corner Plot" value={formData.corner_plot} onChange={(e) => setFormData({ ...formData, corner_plot: e.target.value })} options={[{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }]} />
                <Select label="Road Width" value={formData.road_width} onChange={(e) => setFormData({ ...formData, road_width: e.target.value })} options={[{ value: '', label: 'Select road width' }, ...ROAD_WIDTH_PRESETS_FT.map((v) => ({ value: String(v), label: `${v}ft` }))]} />
                <Select label="Facing" value={formData.facing} onChange={(e) => setFormData({ ...formData, facing: e.target.value })} options={FACING_OPTIONS.map((v) => ({ value: v, label: v }))} />
                <Select label="Park Facing" value={formData.park_facing} onChange={(e) => setFormData({ ...formData, park_facing: e.target.value })} options={[{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }]} />
                <Select label="Gated Colony" value={formData.gated_colony} onChange={(e) => setFormData({ ...formData, gated_colony: e.target.value })} options={[{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }]} />
              </div>
            </div>
          ) : isResidentialType(formData.property_type_interested) ? (
            <div>
              <p className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-3">Flat / Villa Requirements</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select label="BHK" value={formData.bhk} onChange={(e) => setFormData({ ...formData, bhk: e.target.value })} options={[1, 2, 3, 4].map((v) => ({ value: String(v), label: String(v) }))} />
                <Input label="Floor Preference" value={formData.floor_preference} onChange={(e) => setFormData({ ...formData, floor_preference: e.target.value })} placeholder="Mid floor" />
                <Select label="Lift Required" value={formData.lift_required} onChange={(e) => setFormData({ ...formData, lift_required: e.target.value })} options={[{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }]} />
                <Select label="Parking Required" value={formData.parking} onChange={(e) => setFormData({ ...formData, parking: e.target.value })} options={[{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }]} />
                <Select
                  label="Furnishing"
                  value={formData.furnishing}
                  onChange={(e) => setFormData({ ...formData, furnishing: e.target.value })}
                  options={[
                    { value: 'Furnished', label: 'Furnished' },
                    { value: 'Semi Furnished', label: 'Semi Furnished' },
                    { value: 'Unfurnished', label: 'Unfurnished' },
                  ]}
                />
              </div>
            </div>
          ) : null}

          <div>
            <p className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-3">Follow-up</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Next Follow-up Date" type="datetime-local" value={formData.next_followup_date} onChange={(e) => setFormData({ ...formData, next_followup_date: e.target.value })} />
              <Input label="Follow-up Notes" value={formData.followup_notes} onChange={(e) => setFormData({ ...formData, followup_notes: e.target.value })} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

