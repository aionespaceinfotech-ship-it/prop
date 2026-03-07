import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Maximize, 
  Building2,
  Edit2, 
  Trash2, 
  Home,
  Share2,
  X,
  IndianRupee,
  ChevronDown,
  LayoutGrid,
  List,
  ArrowUpRight
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { formatCurrency, formatArea } from '../utils/formatters';
import { cn } from '../utils/cn';

interface Property {
  id: number;
  project_id: number | null;
  project_name: string | null;
  title: string;
  type: 'Plot' | 'House' | 'Apartment' | 'Villa' | 'Shop' | 'Office' | 'Commercial' | 'Warehouse' | 'Land' | 'Industrial';
  location: string;
  price: number;
  area: number;
  facing: string;
  status: 'Available' | 'Booked' | 'Sold' | 'Rented';
  description: string;
  images: string; // JSON string
  owner_name: string;
  owner_contact: string;
  plot_number: string;
  is_standalone: number;
}

interface Project {
  id: number;
  name: string;
}

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
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterMinArea, setFilterMinArea] = useState('');
  const [filterMaxArea, setFilterMaxArea] = useState('');
  const [filterProject, setFilterProject] = useState('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    type: 'Apartment',
    location: '',
    price: '',
    area: '',
    facing: 'North',
    status: 'Available',
    description: '',
    owner_name: '',
    owner_contact: '',
    project_id: '',
    plot_number: '',
    is_standalone: '1'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [propsData, projectsData] = await Promise.all([
        api.get('/properties'),
        api.get('/projects')
      ]);
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
    const projectId = params.get('project');
    if (projectId) {
      setFilterProject(projectId);
      setShowFilters(true);
    }
  }, []);

  const handleOpenModal = (property?: Property) => {
    if (property) {
      setEditingProperty(property);
      setFormData({
        title: property.title,
        type: property.type,
        location: property.location,
        price: property.price.toString(),
        area: property.area.toString(),
        facing: property.facing || 'North',
        status: property.status,
        description: property.description || '',
        owner_name: property.owner_name || '',
        owner_contact: property.owner_contact || '',
        project_id: property.project_id?.toString() || '',
        plot_number: property.plot_number || '',
        is_standalone: property.is_standalone?.toString() || '1'
      });
    } else {
      setEditingProperty(null);
      setFormData({
        title: '',
        type: 'Apartment',
        location: '',
        price: '',
        area: '',
        facing: 'North',
        status: 'Available',
        description: '',
        owner_name: '',
        owner_contact: '',
        project_id: '',
        plot_number: '',
        is_standalone: '1'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      price: parseFloat(formData.price),
      area: parseFloat(formData.area),
      project_id: formData.project_id ? parseInt(formData.project_id) : null,
      is_standalone: parseInt(formData.is_standalone),
      images: []
    };

    try {
      if (editingProperty) {
        await api.put(`/properties/${editingProperty.id}`, payload);
      } else {
        await api.post('/properties', payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Error saving property');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await api.delete(`/properties/${id}`);
        fetchData();
      } catch (err) {
        alert('Error deleting property');
      }
    }
  };

  const shareOnWhatsApp = (p: Property) => {
    const catalogUrl = `${window.location.origin}/catalog?id=${p.id}`;
    const text = `*Property Details*\n\n*Title:* ${p.title}\n*Type:* ${p.type}\n*Location:* ${p.location}\n*Price:* ${formatCurrency(p.price)}\n*Area:* ${formatArea(p.area)}\n*Facing:* ${p.facing || 'N/A'}\n*Status:* ${p.status}\n\n*View all details here:* ${catalogUrl}\n\nInterested? Contact us!`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareCatalog = () => {
    const catalogUrl = `${window.location.origin}/catalog`;
    const text = `Check out our latest property listings here: ${catalogUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const filteredProperties = properties.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                         p.location.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'All' || p.type === filterType;
    const matchesLocation = !filterLocation || p.location.toLowerCase().includes(filterLocation.toLowerCase());
    const matchesMinPrice = !filterMinPrice || p.price >= parseFloat(filterMinPrice);
    const matchesMaxPrice = !filterMaxPrice || p.price <= parseFloat(filterMaxPrice);
    const matchesMinArea = !filterMinArea || p.area >= parseFloat(filterMinArea);
    const matchesMaxArea = !filterMaxArea || p.area <= parseFloat(filterMaxArea);
    const matchesProject = filterProject === 'All' || p.project_id?.toString() === filterProject;
    
    return matchesSearch && matchesType && matchesLocation && matchesMinPrice && matchesMaxPrice && matchesMinArea && matchesMaxArea && matchesProject;
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Available': return 'success';
      case 'Booked': return 'warning';
      case 'Sold': return 'error';
      case 'Rented': return 'info';
      default: return 'neutral';
    }
  };

  return (
    <div className="p-6 lg:p-10 space-y-10 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <PageHeader 
          title="Property Portfolio" 
          subtitle={`${filteredProperties.length} listings available in your inventory.`}
        />
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'grid' ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'list' ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <List size={18} />
            </button>
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="rounded-xl">
            <Filter size={18} className="mr-2" />
            Filters
            <ChevronDown size={16} className={cn("ml-2 transition-transform", showFilters && "rotate-180")} />
          </Button>
          <Button onClick={() => handleOpenModal()} className="rounded-xl shadow-lg shadow-emerald-200">
            <Plus size={18} className="mr-2" />
            Add Property
          </Button>
        </div>
      </div>

      {/* Search & Quick Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by title, location, or owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {['All', 'Plot', 'House', 'Apartment', 'Villa'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                "px-5 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all border shadow-sm",
                filterType === type 
                  ? "bg-slate-900 border-slate-900 text-white" 
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters Drawer */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-none shadow-sm ring-1 ring-slate-200/50 p-8 bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <Input 
                  label="Specific Location"
                  placeholder="e.g. South Delhi"
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className="bg-white"
                />
                <Select 
                  label="Project / Colony"
                  value={filterProject}
                  onChange={(e) => setFilterProject(e.target.value)}
                  options={[
                    { value: 'All', label: 'All Projects' },
                    ...projects.map(p => ({ value: p.id.toString(), label: p.name }))
                  ]}
                  className="bg-white"
                />
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Budget Range</label>
                  <div className="flex gap-3">
                    <Input 
                      type="number"
                      placeholder="Min"
                      value={filterMinPrice}
                      onChange={(e) => setFilterMinPrice(e.target.value)}
                      className="bg-white"
                    />
                    <Input 
                      type="number"
                      placeholder="Max"
                      value={filterMaxPrice}
                      onChange={(e) => setFilterMaxPrice(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Area (sqft)</label>
                  <div className="flex gap-3">
                    <Input 
                      type="number"
                      placeholder="Min"
                      value={filterMinArea}
                      onChange={(e) => setFilterMinArea(e.target.value)}
                      className="bg-white"
                    />
                    <Input 
                      type="number"
                      placeholder="Max"
                      value={filterMaxArea}
                      onChange={(e) => setFilterMaxArea(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-8 pt-6 border-t border-slate-200">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-slate-400 font-bold text-xs uppercase tracking-widest"
                  onClick={() => {
                    setFilterLocation('');
                    setFilterMinPrice('');
                    setFilterMaxPrice('');
                    setFilterMinArea('');
                    setFilterMaxArea('');
                    setFilterProject('All');
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Property Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-slate-400 font-medium animate-pulse">Curating your portfolio...</p>
        </div>
      ) : (
        <div className={cn(
          "grid gap-8",
          viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          {filteredProperties.map((p, idx) => (
            <motion.div
              layout
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={cn(
                "p-0 group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border-none bg-white shadow-sm ring-1 ring-slate-200/50 overflow-hidden",
                viewMode === 'list' && "flex flex-col md:flex-row h-auto md:h-64"
              )}>
                <div className={cn(
                  "relative bg-slate-100 overflow-hidden",
                  viewMode === 'grid' ? "h-64" : "h-64 md:h-full md:w-80 shrink-0"
                )}>
                  <img 
                    src={p.images ? (JSON.parse(p.images)[0] || `https://picsum.photos/seed/${p.id}/800/600`) : `https://picsum.photos/seed/${p.id}/800/600`} 
                    alt={p.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <Badge className={cn(
                      "shadow-lg backdrop-blur-md border-none px-3 py-1 text-[10px] font-bold uppercase tracking-widest",
                      p.status === 'Available' ? "bg-emerald-500/90 text-white" : "bg-slate-900/80 text-white"
                    )}>
                      {p.status}
                    </Badge>
                  </div>
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    <Button 
                      size="icon" 
                      className="rounded-full bg-white text-slate-900 hover:bg-emerald-600 hover:text-white shadow-xl"
                      onClick={() => shareOnWhatsApp(p)}
                    >
                      <Share2 size={18} />
                    </Button>
                  </div>
                </div>
                
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em]">
                        {p.type} • {p.facing} Facing
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                        {p.title}
                      </h3>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <button onClick={() => handleOpenModal(p)} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-slate-500 text-sm mb-8">
                    <MapPin size={16} className="mr-2 text-slate-400 shrink-0" />
                    <span className="line-clamp-1 font-medium">{p.location}</span>
                  </div>
                  
                  <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Investment</p>
                      <div className="flex items-center text-2xl font-black text-slate-900">
                        <IndianRupee size={20} className="text-emerald-600 mr-1 shrink-0" />
                        {formatCurrency(p.price)}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dimensions</p>
                      <div className="flex items-center text-sm font-bold text-slate-700 justify-end">
                        <Maximize size={16} className="mr-2 text-slate-400 shrink-0" />
                        {formatArea(p.area)}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
          
          {filteredProperties.length === 0 && (
            <div className="col-span-full py-32 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Home size={32} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No matches found</h3>
              <p className="text-slate-500 max-w-xs mx-auto mb-8">Try adjusting your filters or search terms to find what you're looking for.</p>
              <Button variant="outline" className="rounded-xl" onClick={() => {
                setSearch('');
                setFilterType('All');
                setFilterLocation('');
              }}>
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modal - Enhanced for premium feel */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProperty ? 'Refine Listing' : 'New Property Listing'}
        size="xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-slate-400 font-bold uppercase tracking-widest text-xs">Discard</Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={handleSubmit} className="rounded-xl shadow-lg shadow-emerald-200">
                {editingProperty ? 'Save Changes' : 'Publish Listing'}
              </Button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-10 py-4">
          {!editingProperty && (
            <div className="flex justify-end">
              <button 
                type="button"
                onClick={() => setFormData({
                  title: 'Skyline Penthouse',
                  type: 'Apartment',
                  location: 'South Delhi, Hauz Khas',
                  price: '15000000',
                  area: '1850',
                  facing: 'East',
                  status: 'Available',
                  description: 'A beautiful east-facing apartment with modern amenities and great connectivity.',
                  owner_name: 'Amit Sharma',
                  owner_contact: '9810012345',
                  project_id: '',
                  plot_number: '',
                  is_standalone: '1'
                })}
                className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest hover:underline"
              >
                Auto-fill sample data
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            <div className="md:col-span-2">
              <Input 
                label="Property Title"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g. Luxury 3BHK Apartment"
                className="text-lg font-bold"
              />
            </div>
            
            <Select 
              label="Property Category"
              value={formData.is_standalone}
              onChange={(e) => setFormData({...formData, is_standalone: e.target.value})}
              options={[
                { value: '1', label: 'Standalone Property' },
                { value: '0', label: 'Part of Project / Colony' },
              ]}
            />

            {formData.is_standalone === '0' && (
              <Select 
                label="Select Project / Colony"
                required={formData.is_standalone === '0'}
                value={formData.project_id}
                onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                options={[
                  { value: '', label: 'Choose a project...' },
                  ...projects.map(p => ({ value: p.id.toString(), label: p.name }))
                ]}
              />
            )}

            <Select 
              label="Property Type"
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value as any})}
              options={[
                { value: 'Plot', label: 'Plot' },
                { value: 'House', label: 'House' },
                { value: 'Apartment', label: 'Apartment' },
                { value: 'Villa', label: 'Villa' },
                { value: 'Shop', label: 'Shop' },
                { value: 'Office', label: 'Office' },
                { value: 'Commercial', label: 'Commercial' },
                { value: 'Warehouse', label: 'Warehouse' },
                { value: 'Land', label: 'Land' },
                { value: 'Industrial', label: 'Industrial' },
              ]}
            />
            
            <Input 
              label="Plot / Unit Number"
              value={formData.plot_number}
              onChange={(e) => setFormData({...formData, plot_number: e.target.value})}
              placeholder="e.g. 101 or A-12"
            />

            <Select 
              label="Facing"
              value={formData.facing}
              onChange={(e) => setFormData({...formData, facing: e.target.value})}
              options={[
                { value: 'North', label: 'North' },
                { value: 'South', label: 'South' },
                { value: 'East', label: 'East' },
                { value: 'West', label: 'West' },
                { value: 'North-East', label: 'North-East' },
                { value: 'North-West', label: 'North-West' },
                { value: 'South-East', label: 'South-East' },
                { value: 'South-West', label: 'South-West' },
              ]}
            />
            
            <Select 
              label="Current Status"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value as any})}
              options={[
                { value: 'Available', label: 'Available' },
                { value: 'Booked', label: 'Booked' },
                { value: 'Sold', label: 'Sold' },
                { value: 'Rented', label: 'Rented' },
              ]}
            />
            
            <Input 
              label="Location"
              required
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              placeholder="e.g. Downtown, City Center"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Price (₹)"
                required
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                placeholder="e.g. 5000000"
              />
              <Input 
                label="Area (sq ft)"
                required
                type="number"
                value={formData.area}
                onChange={(e) => setFormData({...formData, area: e.target.value})}
                placeholder="e.g. 1200"
              />
            </div>
            
            <div className="md:col-span-2 space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Description</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all duration-200 h-40 resize-none"
                placeholder="Describe the unique features of this property..."
              />
            </div>
            
            <div className="md:col-span-2 pt-8 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 mb-6">Owner Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Input 
                  label="Full Name"
                  value={formData.owner_name}
                  onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
                />
                <Input 
                  label="Contact Number"
                  value={formData.owner_contact}
                  onChange={(e) => setFormData({...formData, owner_contact: e.target.value})}
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
