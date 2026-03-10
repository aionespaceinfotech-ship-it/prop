import { useEffect, useMemo, useState } from 'react';
import { Building2, ChevronDown, Filter, Home, IndianRupee, LayoutGrid, List, MapPin, Maximize, Plus, Share2, Trash2, Edit3, Map } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { usePermissions } from '../hooks/usePermissions';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { AdaptiveDrawer } from '../components/ui/AdaptiveDrawer';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { toast } from 'sonner';
import { DataPageLayout } from '../components/ui/DataPageLayout';
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
  const { canEditProperties, canDeleteEntities } = usePermissions();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filters
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

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: number | null }>({
    isOpen: false,
    id: null
  });

  // Selection
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<number[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [formData, setFormData] = useState(DEFAULT_FORM);

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
        toast.success('Property updated successfully');
      } else {
        await api.post('/properties', payload);
        toast.success('Property published successfully');
      }
      setIsModalOpen(false);
      setFormData(DEFAULT_FORM);
      fetchData();
    } catch (err) {
      toast.error('Failed to save property. Please try again.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      await api.delete(`/properties/${deleteConfirm.id}`);
      setDeleteConfirm({ isOpen: false, id: null });
      toast.success('Property removed from inventory');
      fetchData();
    } catch {
      toast.error('Failed to delete property');
    }
  };

  const shareOnWhatsApp = (property: Property) => {
    const roadText = property.road_width_ft ? `${property.road_width_ft} ft` : 'N/A';
    const text = `🏠 *${property.title}*\n📍 Location: ${property.location}\n💰 Price: ${formatCurrency(property.price)}\n📐 Area: ${property.area} sqft\n🧭 Facing: ${property.facing || 'N/A'}\n\nView details: ${window.location.origin}/catalog?id=${property.id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const matchesSearch = !search || 
        property.title.toLowerCase().includes(search.toLowerCase()) ||
        property.location.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === 'All' || property.type === filterType;
      const matchesApproval = filterApproval === 'All' || property.approval_type === filterApproval;
      const matchesRoad = filterRoad === 'All' || String(property.road_width_ft) === filterRoad;
      const matchesFacing = filterFacing === 'All' || property.facing === filterFacing;
      const matchesCorner = filterCorner === 'All' || String(property.corner_plot) === filterCorner;
      const matchesGated = filterGated === 'All' || String(property.gated_colony) === filterGated;
      const matchesMinPrice = !filterMinPrice || property.price >= Number(filterMinPrice);
      const matchesMaxPrice = !filterMaxPrice || property.price <= Number(filterMaxPrice);
      const matchesMinArea = !filterMinArea || property.area >= Number(filterMinArea);
      const matchesMaxArea = !filterMaxArea || property.area <= Number(filterMaxArea);
      const matchesProject = filterProject === 'All' || property.project_id?.toString() === filterProject;

      return matchesSearch && matchesType && matchesApproval && matchesRoad && 
             matchesFacing && matchesCorner && matchesGated && matchesMinPrice && 
             matchesMaxPrice && matchesMinArea && matchesMaxArea && matchesProject;
    });
  }, [properties, search, filterType, filterApproval, filterRoad, filterFacing, filterCorner, filterGated, filterMinPrice, filterMaxPrice, filterMinArea, filterMaxArea, filterProject]);

  const bulkShareOnWhatsApp = () => {
    if (selectedPropertyIds.length === 0) return;
    const selectedProps = properties.filter(p => selectedPropertyIds.includes(p.id));
    const text = `🏠 *Property Catalog Selection*\n\n` + 
      selectedProps.map((p, i) => `${i+1}. ${p.title} - ${formatCurrency(p.price)}`).join('\n') +
      `\n\nView Full Catalog: ${window.location.origin}/catalog`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

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

  const shareFilteredView = () => {
    const params = new URLSearchParams();
    if (filterType !== 'All') params.set('type', filterType);
    if (filterApproval !== 'All') params.set('approval', filterApproval);
    if (filterFacing !== 'All') params.set('facing', filterFacing);
    if (filterMinPrice) params.set('minPrice', filterMinPrice);
    if (filterMaxPrice) params.set('maxPrice', filterMaxPrice);
    if (filterMinArea) params.set('minArea', filterMinArea);
    if (filterMaxArea) params.set('maxArea', filterMaxArea);
    if (filterCorner !== 'All') params.set('corner', filterCorner);
    if (filterGated !== 'All') params.set('gated', filterGated);
    if (search) params.set('search', search);

    const url = `${window.location.origin}/catalog?${params.toString()}`;
    const text = `🏠 *Curated Property Selection*\n\nI have filtered our inventory based on your requirements. View the matches here:\n🔗 ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filterContent = (
    <div className="space-y-8 py-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Select label="Listing Type" value={filterType} onChange={(e) => setFilterType(e.target.value)} options={[{ value: 'All', label: 'All Categories' }, ...PROPERTY_TYPES.map((item) => ({ value: item, label: item }))]} />
        <Select label="Authority Approval" value={filterApproval} onChange={(e) => setFilterApproval(e.target.value)} options={[{ value: 'All', label: 'All Statuses' }, ...APPROVAL_TYPES.map((item) => ({ value: item, label: item }))]} />
        <Select label="Frontage Road" value={filterRoad} onChange={(e) => setFilterRoad(e.target.value)} options={[{ value: 'All', label: 'Any Width' }, ...ROAD_WIDTH_PRESETS_FT.map((item) => ({ value: String(item), label: `${item} ft` }))]} />
        <Select label="Facing" value={filterFacing} onChange={(e) => setFilterFacing(e.target.value)} options={[{ value: 'All', label: 'Any Facing' }, ...FACING_OPTIONS.map((item) => ({ value: item, label: item }))]} />
        <Input label="Min Investment" type="number" value={filterMinPrice} onChange={(e) => setFilterMinPrice(e.target.value)} placeholder="0" />
        <Input label="Max Investment" type="number" value={filterMaxPrice} onChange={(e) => setFilterMaxPrice(e.target.value)} placeholder="No Limit" />
        <Input label="Min Size (sqft)" type="number" value={filterMinArea} onChange={(e) => setFilterMinArea(e.target.value)} placeholder="0" />
        <Input label="Max Size (sqft)" type="number" value={filterMaxArea} onChange={(e) => setFilterMaxArea(e.target.value)} placeholder="Any Size" />
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-slate-100 gap-4">
        <div className="flex gap-6">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" checked={filterCorner === '1'} onChange={(e) => setFilterCorner(e.target.checked ? '1' : 'All')} className="w-5 h-5 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-all" />
            <span className="text-[10px] font-black text-slate-500 group-hover:text-slate-900 uppercase tracking-widest">Corner Premium</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" checked={filterGated === '1'} onChange={(e) => setFilterGated(e.target.checked ? '1' : 'All')} className="w-5 h-5 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-all" />
            <span className="text-[10px] font-black text-slate-500 group-hover:text-slate-900 uppercase tracking-widest">Gated Colony</span>
          </label>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={shareFilteredView} className="flex-1 sm:flex-none text-[10px] font-black uppercase tracking-[0.2em] border-slate-200 hover:bg-slate-50 px-4 rounded-xl h-10">
            <Share2 size={14} className="mr-2" />
            Share Current View
          </Button>
          <Button variant="ghost" size="sm" onClick={resetFilters} className="flex-1 sm:flex-none text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 hover:text-rose-600 hover:bg-rose-50 px-4 rounded-xl h-10">
            Reset All
          </Button>
        </div>
      </div>
    </div>
  );

  const columns = [
    {
      header: 'Listing Identity',
      accessor: (p: Property) => (
        <div className="flex flex-col">
          <p className="font-bold text-slate-900 leading-none truncate max-w-[200px]">{p.title}</p>
          <p className="text-[10px] text-slate-500 mt-1.5 flex items-center"><MapPin size={10} className="mr-1 text-rose-500" />{p.location}</p>
        </div>
      )
    },
    {
      header: 'Type',
      accessor: (p: Property) => <Badge variant="neutral" className="text-[9px] font-black uppercase tracking-widest">{p.type}</Badge>,
      hideOnMobile: true
    },
    {
      header: 'Pricing',
      accessor: (p: Property) => (
        <div className="flex flex-col">
          <span className="font-bold text-emerald-600 tabular-nums">{formatCurrency(p.price)}</span>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter mt-0.5">{formatArea(p.area)} Area</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (p: Property) => (
        <div className="flex items-center gap-2">
          <div className={cn("w-1.5 h-1.5 rounded-full", p.status === 'Available' ? 'bg-emerald-500' : 'bg-rose-500')} />
          <span className={cn("text-[10px] font-bold uppercase tracking-widest", p.status === 'Available' ? 'text-emerald-600' : 'text-rose-600')}>{p.status}</span>
        </div>
      )
    }
  ];

  return (
    <DataPageLayout
      title="Property Portfolio"
      subtitle={`${filteredProperties.length} active listings identified.`}
      primaryAction={{
        label: "Launch Listing",
        onClick: () => handleOpenModal(),
        icon: <Plus size={18} className="mr-2" />
      }}
      search={{
        value: search,
        onChange: setSearch,
        placeholder: "Scan properties by title or sector..."
      }}
      filters={{
        content: filterContent
      }}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex bg-white ring-1 ring-slate-200 rounded-2xl p-1 shadow-sm w-full sm:w-auto">
          <button onClick={() => setViewMode('grid')} className={cn('flex-1 sm:flex-none px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest', viewMode === 'grid' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600')}>
            <LayoutGrid size={14} /> Grid
          </button>
          <button onClick={() => setViewMode('list')} className={cn('flex-1 sm:flex-none px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest', viewMode === 'list' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600')}>
            <List size={14} /> List
          </button>
        </div>
        
        {selectedPropertyIds.length > 0 && (
          <Button variant="success" size="sm" onClick={bulkShareOnWhatsApp} className="w-full sm:w-auto rounded-2xl shadow-xl shadow-emerald-100 px-6 h-11">
            <Share2 size={16} className="mr-2" />
            Share Selection ({selectedPropertyIds.length})
          </Button>
        )}
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-50 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Portfolio...</p>
        </div>
      ) : viewMode === 'list' ? (
        <Card className="p-0 border-none shadow-sm ring-1 ring-slate-200/50 overflow-hidden bg-white rounded-[2.5rem]">
          <ResponsiveTable
            columns={columns}
            data={filteredProperties}
            keyExtractor={(p) => p.id}
            onRowClick={(p) => handleOpenModal(p)}
            selectedIds={selectedPropertyIds}
            onSelectionChange={(ids) => setSelectedPropertyIds(ids as number[])}
            isLoading={loading}
            emptyMessage="No properties found matching your search parameters."
            rowClassName="hover:bg-slate-50/50 transition-all duration-300"
            headerCellClassName="bg-slate-50/50"
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProperties.map((property) => {
            const isSelected = selectedPropertyIds.includes(property.id);
            const images = property.images ? JSON.parse(property.images || '[]') : [];
            const imageSrc = images[0] || `https://picsum.photos/seed/prop-${property.id}/800/600`;
            
            return (
              <Card 
                key={property.id} 
                className={cn(
                  'p-0 overflow-hidden group transition-all duration-500 rounded-[2.5rem] relative',
                  isSelected ? 'ring-4 ring-emerald-500 shadow-2xl shadow-emerald-100' : 'border-none shadow-sm ring-1 ring-slate-200/50 hover:shadow-2xl hover:shadow-slate-200 hover:-translate-y-1'
                )}
              >
                <div 
                  className="absolute top-5 right-5 z-20 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPropertyIds(prev => isSelected ? prev.filter(id => id !== property.id) : [...prev, property.id]);
                  }}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all shadow-lg backdrop-blur-md",
                    isSelected ? "bg-emerald-500 border-emerald-500 text-white scale-110" : "bg-white/80 border-white text-slate-400 hover:bg-white"
                  )}>
                    {isSelected && <Plus size={18} className="rotate-45" />}
                  </div>
                </div>

                <div className="relative h-64 bg-slate-100 overflow-hidden">
                  <img src={imageSrc} alt={property.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500" />
                  
                  <div className="absolute top-5 left-5">
                    <Badge className="bg-white/90 backdrop-blur-md border-none shadow-xl text-slate-900 text-[9px] font-black uppercase tracking-widest px-3 py-1.5">{property.type}</Badge>
                  </div>
                  
                  <div className="absolute bottom-5 left-5 right-5 flex justify-between items-end">
                    <button onClick={(e) => { e.stopPropagation(); shareOnWhatsApp(property); }} className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-2xl shadow-xl transition-all border border-white/10 active:scale-95">
                      <Share2 size={18} />
                    </button>
                    {canEditProperties && (
                      <button onClick={(e) => { e.stopPropagation(); handleOpenModal(property); }} className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-900/20 transition-all active:scale-95">
                        <Edit3 size={18} />
                      </button>
                    )}
                  </div>
                </div>


                <div className="p-5 flex-1 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors leading-tight truncate" title={property.title}>{property.title}</h3>
                      <p className="text-[11px] text-slate-500 flex items-center mt-1 font-medium"><MapPin size={12} className="mr-1 text-rose-500 shrink-0" />{property.location}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Price</p>
                      <p className="text-base font-black text-emerald-600 flex items-center justify-end tabular-nums mt-1"><IndianRupee size={14} className="mr-0.5" />{formatCurrency(property.price)}</p>
                    </div>
                  </div>

                  <div className="flex gap-1.5 flex-wrap">
                    {property.approval_type && <Badge variant="info" className="text-[8px] uppercase font-black tracking-tighter px-1.5 py-0.5">{property.approval_type}</Badge>}
                    <Badge variant="neutral" className="text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5">Road: {property.road_width_ft || 'N/A'}ft</Badge>
                    <Badge variant="neutral" className="text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5">{property.facing || 'N/A'} Facing</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50 mt-auto">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                        <Maximize size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter leading-none">Total Area</p>
                        <p className="text-[10px] font-bold text-slate-700 mt-0.5 truncate">{formatArea(property.area)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <div className="text-right min-w-0">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter leading-none">Availability</p>
                        <p className={cn("text-[10px] font-bold mt-0.5 truncate", property.status === 'Available' ? 'text-emerald-600' : 'text-rose-600')}>{property.status}</p>
                      </div>
                      <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", property.status === 'Available' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500')} />
                    </div>
                  </div>

                  {canDeleteEntities && (
                    <div className="flex justify-end pt-1">
                      <Button variant="ghost" size="sm" className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl px-2 py-1 text-[9px] font-black uppercase tracking-widest" onClick={() => setDeleteConfirm({ isOpen: true, id: property.id })}>
                        <Trash2 size={10} className="mr-1.5" />
                        Remove Listing
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}

          {filteredProperties.length === 0 && (
            <div className="col-span-full py-32 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Home size={40} className="text-slate-200" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No properties found</h3>
              <p className="text-slate-500 mt-2">Adjust your filters or try a different search term.</p>
              <Button variant="ghost" onClick={resetFilters} className="mt-6 text-emerald-600 font-bold">Clear Filters</Button>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AdaptiveDrawer
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProperty ? 'Modify Property Details' : 'Initialize New Listing'}
        size="xl"
        footer={
          <div className="flex flex-col sm:flex-row justify-between w-full gap-3">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="order-2 sm:order-1">Discard Changes</Button>
            <Button onClick={handleSubmit} className="shadow-xl shadow-emerald-200 order-1 sm:order-2">{editingProperty ? 'Save Updates' : 'Publish Listing'}</Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-10 py-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pb-2 border-b border-slate-100">Core Information</h4>
              <Input label="Listing Title" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Luxury 3BHK Apartment" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label="Property Type" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as (typeof PROPERTY_TYPES)[number] })} options={PROPERTY_TYPES.map((item) => ({ value: item, label: item }))} />
                <Select label="Listing Status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} options={['Available', 'Booked', 'Sold', 'Rented'].map((item) => ({ value: item, label: item }))} />
              </div>
              <Input label="Location / Area" required value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="e.g. Hiran Magri, Sector 4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Price (₹)" required type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                <Input label="Area (sqft)" required type="number" value={formData.area} onChange={(e) => setFormData({ ...formData, area: e.target.value })} />
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pb-2 border-b border-slate-100">Specifications</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label="Facing" value={formData.facing} onChange={(e) => setFormData({ ...formData, facing: e.target.value })} options={FACING_OPTIONS.map((item) => ({ value: item, label: item }))} />
                <Select label="Construction" value={formData.construction_status} onChange={(e) => setFormData({ ...formData, construction_status: e.target.value as any })} options={CONSTRUCTION_STATUSES.map((item) => ({ value: item, label: item }))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label="Authority" value={formData.approval_type} onChange={(e) => setFormData({ ...formData, approval_type: e.target.value })} options={[{ value: '', label: 'Select' }, ...APPROVAL_TYPES.map((item) => ({ value: item, label: item }))]} />
                <Select label="Road Width" value={formData.road_width_ft} onChange={(e) => setFormData({ ...formData, road_width_ft: e.target.value })} options={[{ value: '', label: 'Select' }, ...ROAD_WIDTH_PRESETS_FT.map((item) => ({ value: String(item), label: `${item}ft` }))]} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Plot / Unit #" value={formData.plot_number} onChange={(e) => setFormData({ ...formData, plot_number: e.target.value })} placeholder="e.g. A-102" />
                <Input label="Map Link" value={formData.map_link} onChange={(e) => setFormData({ ...formData, map_link: e.target.value })} placeholder="Google Maps URL" />
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 block">Amenities & Ownership</h4>
            <div className="bg-slate-50 rounded-3xl p-6 lg:p-8 space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Select label="Corner" value={formData.corner_plot} onChange={(e) => setFormData({ ...formData, corner_plot: e.target.value })} options={[{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }]} />
                <Select label="Gated" value={formData.gated_colony} onChange={(e) => setFormData({ ...formData, gated_colony: e.target.value })} options={[{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }]} />
                <Select label="Water" value={formData.water_supply} onChange={(e) => setFormData({ ...formData, water_supply: e.target.value })} options={[{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }]} />
                <Select label="Electricity" value={formData.electricity_available} onChange={(e) => setFormData({ ...formData, electricity_available: e.target.value })} options={[{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }]} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input label="Owner Name" value={formData.owner_name} onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })} placeholder="Primary stakeholder" />
                <Input label="Owner Contact" value={formData.owner_contact} onChange={(e) => setFormData({ ...formData, owner_contact: e.target.value })} placeholder="Contact info" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Property Description</label>
            <textarea 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-sm h-28 resize-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all outline-none" 
              placeholder="Highlight key features, connectivity and ROI potential..." 
            />
          </div>

          <div className="space-y-6 pt-8 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Media Gallery</h4>
              <label className="cursor-pointer bg-slate-900 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-emerald-600 shadow-lg shadow-slate-200">
                Upload Photos
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {imagePreviews.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group shadow-sm">
                  <img src={img} alt="preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setImagePreviews(prev => prev.filter((_, i) => i !== idx))} className="absolute inset-0 bg-rose-600/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 backdrop-blur-sm">
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
              {imagePreviews.length === 0 && (
                <div className="col-span-full py-10 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center bg-slate-50/50">
                  <Plus size={24} className="text-slate-300 mb-2" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No assets uploaded</p>
                </div>
              )}
            </div>
          </div>
        </form>
      </AdaptiveDrawer>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={handleConfirmDelete}
        title="Remove Property Listing"
        message="Are you sure you want to remove this property? This action is permanent and will delete all associated data."
        confirmText="Remove Listing"
        variant="danger"
      />
    </DataPageLayout>
  );
}
