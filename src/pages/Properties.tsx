import { useEffect, useMemo, useState } from 'react';
import { Building2, ChevronDown, Filter, Home, IndianRupee, LayoutGrid, List, MapPin, Maximize, Plus, Share2 } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { formatArea, formatCurrency } from '../utils/formatters';
import { cn } from '../utils/cn';
import { APPROVAL_TYPES, CONSTRUCTION_STATUSES, FACING_OPTIONS, PROPERTY_TYPES, ROAD_WIDTH_PRESETS_FT } from '../constants/realEstate';

interface Property {
  id: number;
  project_id: number | null;
  project_name: string | null;
  title: string;
  type: (typeof PROPERTY_TYPES)[number];
  location: string;
  price: number;
  area: number;
  plot_size: string | null;
  facing: string;
  approval_type: string | null;
  road_width_ft: number | null;
  map_link: string | null;
  corner_plot: number;
  gated_colony: number;
  water_supply: number;
  electricity_available: number;
  sewerage_connection: number;
  property_age_years: number | null;
  construction_status: string | null;
  status: 'Available' | 'Booked' | 'Sold' | 'Rented';
  description: string;
  images: string;
  owner_name: string;
  owner_contact: string;
  plot_number: string;
  is_standalone: number;
}

interface Project {
  id: number;
  name: string;
}

const DEFAULT_FORM = {
  title: '',
  type: 'Flat' as (typeof PROPERTY_TYPES)[number],
  location: '',
  price: '',
  area: '',
  plot_size: '',
  facing: 'North',
  approval_type: '',
  road_width_ft: '',
  corner_plot: '0',
  gated_colony: '0',
  water_supply: '0',
  electricity_available: '0',
  sewerage_connection: '0',
  property_age_years: '',
  construction_status: 'Ready to Move' as (typeof CONSTRUCTION_STATUSES)[number],
  status: 'Available' as 'Available' | 'Booked' | 'Sold' | 'Rented',
  description: '',
  owner_name: '',
  owner_contact: '',
  project_id: '',
  plot_number: '',
  is_standalone: '1',
  map_link: '',
};

export default function Properties() {
  const api = useApi();
  const [properties, setProperties] = useState<Property[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const [filterType, setFilterType] = useState('All');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterApproval, setFilterApproval] = useState('All');
  const [filterRoad, setFilterRoad] = useState('All');
  const [filterFacing, setFilterFacing] = useState('All');
  const [filterCorner, setFilterCorner] = useState('All');
  const [filterGated, setFilterGated] = useState('All');
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterMinArea, setFilterMinArea] = useState('');
  const [filterMaxArea, setFilterMaxArea] = useState('');
  const [filterProject, setFilterProject] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<number[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [propsData, projectsData] = await Promise.all([api.get('/properties'), api.get('/projects')]);
      setProperties(propsData);
      setProjects(projectsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const params = new URLSearchParams(window.location.search);
    const applyQuery = (name: string, setter: (v: string) => void) => {
      const value = params.get(name);
      if (value) setter(value);
    };

    applyQuery('project', setFilterProject);
    applyQuery('type', setFilterType);
    applyQuery('approval_type', setFilterApproval);
    applyQuery('road_width_ft', setFilterRoad);
    applyQuery('facing', setFilterFacing);
    applyQuery('min_price', setFilterMinPrice);
    applyQuery('max_price', setFilterMaxPrice);
    applyQuery('location', setFilterLocation);

    if (params.toString()) setShowFilters(true);
  }, []);

  const handleOpenModal = (property?: Property) => {
    if (property) {
      setEditingProperty(property);
      setFormData({
        title: property.title,
        type: property.type,
        location: property.location,
        price: String(property.price),
        area: String(property.area),
        plot_size: property.plot_size || '',
        facing: property.facing || 'North',
        approval_type: property.approval_type || '',
        road_width_ft: property.road_width_ft ? String(property.road_width_ft) : '',
        corner_plot: String(property.corner_plot || 0),
        gated_colony: String(property.gated_colony || 0),
        water_supply: String(property.water_supply || 0),
        electricity_available: String(property.electricity_available || 0),
        sewerage_connection: String(property.sewerage_connection || 0),
        property_age_years: property.property_age_years ? String(property.property_age_years) : '',
        construction_status: (property.construction_status as (typeof CONSTRUCTION_STATUSES)[number]) || 'Ready to Move',
        status: property.status,
        description: property.description || '',
        owner_name: property.owner_name || '',
        owner_contact: property.owner_contact || '',
        project_id: property.project_id?.toString() || '',
        plot_number: property.plot_number || '',
        is_standalone: property.is_standalone?.toString() || '1',
        map_link: property.map_link || '',
      });
      setImagePreviews(property.images ? JSON.parse(property.images || '[]') : []);
    } else {
      setEditingProperty(null);
      setFormData(DEFAULT_FORM);
      setImagePreviews([]);
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    Promise.all(
      files.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(new Error('Failed to read image'));
            reader.readAsDataURL(file);
          })
      )
    ).then((encoded) => setImagePreviews((prev) => [...prev, ...encoded]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      price: Number(formData.price),
      area: Number(formData.area),
      plot_size: formData.plot_size || undefined,
      project_id: formData.project_id ? Number(formData.project_id) : null,
      is_standalone: Number(formData.is_standalone),
      road_width_ft: formData.road_width_ft ? Number(formData.road_width_ft) : undefined,
      corner_plot: Number(formData.corner_plot),
      gated_colony: Number(formData.gated_colony),
      water_supply: Number(formData.water_supply),
      electricity_available: Number(formData.electricity_available),
      sewerage_connection: Number(formData.sewerage_connection),
      property_age_years: formData.property_age_years ? Number(formData.property_age_years) : undefined,
      approval_type: formData.approval_type || undefined,
      map_link: formData.map_link || undefined,
      images: imagePreviews,
    };

    try {
      if (editingProperty) {
        await api.put(`/properties/${editingProperty.id}`, payload);
      } else {
        await api.post('/properties', payload);
      }
      setIsModalOpen(false);
      setFormData(DEFAULT_FORM);
      fetchData();
    } catch (err) {
      alert('Error saving property');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;
    try {
      await api.delete(`/properties/${id}`);
      fetchData();
    } catch {
      alert('Error deleting property');
    }
  };

  const shareOnWhatsApp = (property: Property) => {
    const roadText = property.road_width_ft ? `${property.road_width_ft} ft` : 'N/A';
    const text = `Property: ${property.title}\nType: ${property.type}\nLocation: ${property.location}\nPrice: ${formatCurrency(property.price)}\nApproval: ${property.approval_type || 'N/A'}\nRoad: ${roadText}\nFacing: ${property.facing || 'N/A'}\n${window.location.origin}/catalog?id=${property.id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const togglePropertySelection = (propertyId: number) => {
    setSelectedPropertyIds((prev) => (
      prev.includes(propertyId) ? prev.filter((id) => id !== propertyId) : [...prev, propertyId]
    ));
  };

  const sharePropertiesBatch = (list: Property[], label: string) => {
    if (list.length === 0) {
      alert(`No properties available to share for ${label.toLowerCase()}.`);
      return;
    }
    const lines: string[] = [`${label}:`, ''];
    list.slice(0, 10).forEach((property, idx) => {
      const roadText = property.road_width_ft ? `${property.road_width_ft} ft` : 'N/A';
      lines.push(`${idx + 1}. ${property.title}`);
      lines.push(`   Type: ${property.type}`);
      lines.push(`   Location: ${property.location}`);
      lines.push(`   Price: ${formatCurrency(property.price)}`);
      lines.push(`   Road: ${roadText}`);
      lines.push(`   Facing: ${property.facing || 'N/A'}`);
      lines.push(`   ${window.location.origin}/catalog?id=${property.id}`);
      lines.push('');
    });
    lines.push('Let me know which options you want to visit.');
    window.open(`https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
  };

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const roadText = property.road_width_ft ? String(property.road_width_ft) : '';
      const matchesSearch =
        property.title.toLowerCase().includes(search.toLowerCase()) ||
        property.location.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === 'All' || property.type === filterType;
      const matchesLocation = !filterLocation || property.location.toLowerCase().includes(filterLocation.toLowerCase());
      const matchesApproval = filterApproval === 'All' || property.approval_type === filterApproval;
      const matchesRoad = filterRoad === 'All' || roadText.includes(filterRoad);
      const matchesFacing = filterFacing === 'All' || property.facing === filterFacing;
      const matchesCorner = filterCorner === 'All' || String(property.corner_plot || 0) === filterCorner;
      const matchesGated = filterGated === 'All' || String(property.gated_colony || 0) === filterGated;
      const matchesMinPrice = !filterMinPrice || property.price >= Number(filterMinPrice);
      const matchesMaxPrice = !filterMaxPrice || property.price <= Number(filterMaxPrice);
      const matchesMinArea = !filterMinArea || property.area >= Number(filterMinArea);
      const matchesMaxArea = !filterMaxArea || property.area <= Number(filterMaxArea);
      const matchesProject = filterProject === 'All' || property.project_id?.toString() === filterProject;

      return (
        matchesSearch &&
        matchesType &&
        matchesLocation &&
        matchesApproval &&
        matchesRoad &&
        matchesFacing &&
        matchesCorner &&
        matchesGated &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesMinArea &&
        matchesMaxArea &&
        matchesProject
      );
    });
  }, [
    filterApproval,
    filterCorner,
    filterFacing,
    filterGated,
    filterLocation,
    filterMaxArea,
    filterMaxPrice,
    filterMinArea,
    filterMinPrice,
    filterProject,
    filterRoad,
    filterType,
    properties,
    search,
  ]);

  const resetFilters = () => {
    setFilterType('All');
    setFilterLocation('');
    setFilterApproval('All');
    setFilterRoad('All');
    setFilterFacing('All');
    setFilterCorner('All');
    setFilterGated('All');
    setFilterMinPrice('');
    setFilterMaxPrice('');
    setFilterMinArea('');
    setFilterMaxArea('');
    setFilterProject('All');
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader title="Property Portfolio" subtitle={`${filteredProperties.length} matching properties`} />
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={cn('p-2 rounded-lg transition-all', viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400')}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn('p-2 rounded-lg transition-all', viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400')}
            >
              <List size={18} />
            </button>
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="rounded-xl">
            <Filter size={16} className="mr-2" />
            Filters
            <ChevronDown size={16} className={cn('ml-2 transition-transform', showFilters && 'rotate-180')} />
          </Button>
          <Button
            variant="outline"
            onClick={() => sharePropertiesBatch(filteredProperties, 'Filtered Properties')}
            className="rounded-xl"
          >
            <Share2 size={16} className="mr-2" />
            Share Filtered
          </Button>
          <Button
            variant="outline"
            onClick={() => sharePropertiesBatch(filteredProperties.filter((p) => selectedPropertyIds.includes(p.id)), 'Selected Properties')}
            className="rounded-xl"
          >
            <Share2 size={16} className="mr-2" />
            Share Selected ({selectedPropertyIds.length})
          </Button>
          <Button onClick={() => handleOpenModal()} className="rounded-xl shadow-lg shadow-emerald-200">
            <Plus size={18} className="mr-2" />
            Add Property
          </Button>
        </div>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Search by title or location"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm"
        />
      </div>

      {showFilters ? (
        <Card className="p-6 border-none shadow-sm ring-1 ring-slate-200/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Select label="Type" value={filterType} onChange={(e) => setFilterType(e.target.value)} options={[{ value: 'All', label: 'All Types' }, ...PROPERTY_TYPES.map((item) => ({ value: item, label: item }))]} />
            <Select label="Approval" value={filterApproval} onChange={(e) => setFilterApproval(e.target.value)} options={[{ value: 'All', label: 'All Approvals' }, ...APPROVAL_TYPES.map((item) => ({ value: item, label: item }))]} />
            <Select label="Road" value={filterRoad} onChange={(e) => setFilterRoad(e.target.value)} options={[{ value: 'All', label: 'Any Road' }, ...ROAD_WIDTH_PRESETS_FT.map((item) => ({ value: String(item), label: `${item} ft` }))]} />
            <Select label="Facing" value={filterFacing} onChange={(e) => setFilterFacing(e.target.value)} options={[{ value: 'All', label: 'Any Facing' }, ...FACING_OPTIONS.map((item) => ({ value: item, label: item }))]} />
            <Select label="Corner Plot" value={filterCorner} onChange={(e) => setFilterCorner(e.target.value)} options={[{ value: 'All', label: 'All' }, { value: '1', label: 'Yes' }, { value: '0', label: 'No' }]} />
            <Select label="Gated Colony" value={filterGated} onChange={(e) => setFilterGated(e.target.value)} options={[{ value: 'All', label: 'All' }, { value: '1', label: 'Yes' }, { value: '0', label: 'No' }]} />
            <Input label="Min Budget (INR)" type="number" value={filterMinPrice} onChange={(e) => setFilterMinPrice(e.target.value)} />
            <Input label="Max Budget (INR)" type="number" value={filterMaxPrice} onChange={(e) => setFilterMaxPrice(e.target.value)} />
            <Input label="Min Area" type="number" value={filterMinArea} onChange={(e) => setFilterMinArea(e.target.value)} />
            <Input label="Max Area" type="number" value={filterMaxArea} onChange={(e) => setFilterMaxArea(e.target.value)} />
            <Input label="Location" value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} />
            <Select
              label="Project"
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              options={[{ value: 'All', label: 'All Projects' }, ...projects.map((project) => ({ value: String(project.id), label: project.name }))]}
            />
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="ghost" onClick={resetFilters}>Reset Filters</Button>
          </div>
        </Card>
      ) : null}

      {loading ? (
        <div className="py-20 text-center text-slate-500">Loading properties...</div>
      ) : (
        <div className={cn('grid gap-6', viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1')}>
          {filteredProperties.map((property) => {
            const images = property.images ? JSON.parse(property.images || '[]') : [];
            const imageSrc = images[0] || `https://picsum.photos/seed/${property.id}/800/600`;
            const roadText = property.road_width_ft ? `${property.road_width_ft} ft` : 'N/A';

            return (
              <Card key={property.id} className={cn('p-0 overflow-hidden border-none shadow-sm ring-1 ring-slate-200/50', viewMode === 'list' && 'flex flex-col md:flex-row')}>
                <div className={cn('bg-slate-100', viewMode === 'grid' ? 'h-56' : 'h-56 md:w-80 md:h-auto')}>
                  <img src={imageSrc} alt={property.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="p-6 flex-1 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <label className="inline-flex items-center gap-2 text-xs text-slate-500 mb-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedPropertyIds.includes(property.id)}
                          onChange={() => togglePropertySelection(property.id)}
                        />
                        Select
                      </label>
                      <h3 className="text-lg font-bold text-slate-900">{property.title}</h3>
                      <p className="text-sm text-slate-500 flex items-center mt-1"><MapPin size={14} className="mr-1" />{property.location}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="outline" onClick={() => shareOnWhatsApp(property)}><Share2 size={16} /></Button>
                      <Button size="icon" variant="outline" onClick={() => handleOpenModal(property)}><Building2 size={16} /></Button>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="neutral">{property.type}</Badge>
                    {property.approval_type ? <Badge variant="info">{property.approval_type}</Badge> : null}
                    <Badge variant="warning">Road: {roadText}</Badge>
                    <Badge variant="neutral">{property.facing || 'N/A'} facing</Badge>
                    {property.corner_plot ? <Badge variant="success">Corner</Badge> : null}
                    {property.gated_colony ? <Badge variant="success">Gated</Badge> : null}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-bold">Investment</p>
                      <p className="font-black text-slate-900 flex items-center"><IndianRupee size={14} className="mr-1 text-emerald-600" />{formatCurrency(property.price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 uppercase font-bold">Area</p>
                      <p className="font-bold text-slate-700 flex items-center justify-end"><Maximize size={14} className="mr-1" />{formatArea(property.area)}</p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button variant="ghost" className="text-rose-600" onClick={() => handleDelete(property.id)}>Delete</Button>
                  </div>
                </div>
              </Card>
            );
          })}

          {filteredProperties.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <Home size={36} className="mx-auto text-slate-300" />
              <p className="mt-4 text-slate-500">No matching properties</p>
            </div>
          ) : null}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProperty ? 'Edit Property' : 'Add Property'}
        size="xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingProperty ? 'Save Changes' : 'Create Property'}</Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-8 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Property Title" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            <Select label="Property Type" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as (typeof PROPERTY_TYPES)[number] })} options={PROPERTY_TYPES.map((item) => ({ value: item, label: item }))} />
            <Input label="Location" required value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
            <Input label="Plot / Unit Number" value={formData.plot_number} onChange={(e) => setFormData({ ...formData, plot_number: e.target.value })} />
            <Input label="Price (INR)" required type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
            <Input label="Area (sq ft)" required type="number" value={formData.area} onChange={(e) => setFormData({ ...formData, area: e.target.value })} />
            <Input label="Plot Size (Manual)" value={formData.plot_size} onChange={(e) => setFormData({ ...formData, plot_size: e.target.value })} placeholder="20x50" />
            <Select label="Facing" value={formData.facing} onChange={(e) => setFormData({ ...formData, facing: e.target.value })} options={FACING_OPTIONS.map((item) => ({ value: item, label: item }))} />
            <Select label="Status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Available' | 'Booked' | 'Sold' | 'Rented' })} options={['Available', 'Booked', 'Sold', 'Rented'].map((item) => ({ value: item, label: item }))} />
          </div>

          <div className="pt-6 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Legal & Access</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Approval Type" value={formData.approval_type} onChange={(e) => setFormData({ ...formData, approval_type: e.target.value })} options={[{ value: '', label: 'Select approval type' }, ...APPROVAL_TYPES.map((item) => ({ value: item, label: item }))]} />
              <Select label="Road Width (Preset)" value={formData.road_width_ft} onChange={(e) => setFormData({ ...formData, road_width_ft: e.target.value })} options={[{ value: '', label: 'Select road width' }, ...ROAD_WIDTH_PRESETS_FT.map((item) => ({ value: String(item), label: `${item} ft` }))]} />
              <Input label="Map Link (Google Maps URL)" value={formData.map_link} onChange={(e) => setFormData({ ...formData, map_link: e.target.value })} placeholder="https://maps.google.com/..." />
              <Select label="Construction Status" value={formData.construction_status} onChange={(e) => setFormData({ ...formData, construction_status: e.target.value as (typeof CONSTRUCTION_STATUSES)[number] })} options={CONSTRUCTION_STATUSES.map((item) => ({ value: item, label: item }))} />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Amenities & Specs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select label="Corner Plot" value={formData.corner_plot} onChange={(e) => setFormData({ ...formData, corner_plot: e.target.value })} options={[{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }]} />
              <Select label="Gated Colony" value={formData.gated_colony} onChange={(e) => setFormData({ ...formData, gated_colony: e.target.value })} options={[{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }]} />
              <Select label="Water Supply" value={formData.water_supply} onChange={(e) => setFormData({ ...formData, water_supply: e.target.value })} options={[{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }]} />
              <Select label="Electricity" value={formData.electricity_available} onChange={(e) => setFormData({ ...formData, electricity_available: e.target.value })} options={[{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }]} />
              <Select label="Sewerage Connection" value={formData.sewerage_connection} onChange={(e) => setFormData({ ...formData, sewerage_connection: e.target.value })} options={[{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }]} />
              <Input label="Property Age (Years)" type="number" value={formData.property_age_years} onChange={(e) => setFormData({ ...formData, property_age_years: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-slate-200">
            <Select label="Property Category" value={formData.is_standalone} onChange={(e) => setFormData({ ...formData, is_standalone: e.target.value })} options={[{ value: '1', label: 'Standalone Property' }, { value: '0', label: 'Part of Project' }]} />
            {formData.is_standalone === '0' ? (
              <Select
                label="Project / Colony"
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                options={[{ value: '', label: 'Select project' }, ...projects.map((project) => ({ value: String(project.id), label: project.name }))]}
              />
            ) : (
              <div />
            )}
            <Input label="Owner Name" value={formData.owner_name} onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })} />
            <Input label="Owner Contact" value={formData.owner_contact} onChange={(e) => setFormData({ ...formData, owner_contact: e.target.value })} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm h-32 resize-none"
              placeholder="Property highlights"
            />
          </div>

          <div className="space-y-3 pt-6 border-t border-slate-200">
            <label className="text-sm font-semibold text-slate-700 block">Property Photos</label>
            <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="block w-full text-sm text-slate-600" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {imagePreviews.map((img, idx) => (
                <div key={`${idx}-${img.slice(0, 10)}`} className="relative border border-slate-200 rounded-xl overflow-hidden">
                  <img src={img} alt={`property-${idx}`} className="h-24 w-full object-cover" />
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-white/90 text-rose-600 text-xs px-2 py-0.5 rounded"
                    onClick={() => setImagePreviews((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
