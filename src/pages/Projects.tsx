import { useState, useEffect, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  MapPin, 
  Building2, 
  Edit2, 
  Trash2, 
  Layers,
  Layout,
  Users,
  ArrowUpRight,
  Sparkles,
  Navigation,
  Target,
  Box,
  ChevronRight,
  UserCircle,
  Share2
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
import { formatArea } from '../utils/formatters';
import { cn } from '../utils/cn';
import { toast } from 'sonner';

interface Project {
  id: number;
  name: string;
  location: string;
  total_land_area: number;
  total_plots: number;
  plot_size_options: string;
  description: string;
  amenities: string;
  status: string;
  layout_map: string;
  developer_name: string;
  created_at: string;
  total_plots_count?: number;
  available_plots_count?: number;
  sold_plots_count?: number;
}

interface ProjectPlot {
  id: number;
  plot_number: string;
  size: string;
  facing: string;
  road_width_ft: number;
  status: 'Available' | 'Sold';
}

export default function Projects() {
  const api = useApi();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
  
  const [plotProject, setPlotProject] = useState<Project | null>(null);
  const [isPlotModalOpen, setIsPlotModalOpen] = useState(false);
  const [plots, setPlots] = useState<ProjectPlot[]>([]);
  
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: number | null }>({
    isOpen: false,
    id: null
  });

  // Plot Form States
  const [bulkRanges, setBulkRanges] = useState('1-10');
  const [bulkSize, setBulkSize] = useState('1200');
  const [bulkFacing, setBulkFacing] = useState('North');
  const [bulkRoadWidth, setBulkRoadWidth] = useState('30');
  const [bulkPrice, setBulkPrice] = useState('0');
  const [singlePlot, setSinglePlot] = useState({ plot_number: '', size: '', facing: 'North', road_width_ft: '30', price: '0', status: 'Available' });

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    total_land_area: '',
    total_plots: '',
    plot_size_options: '',
    description: '',
    amenities: '',
    status: 'Upcoming',
    layout_map: '',
    developer_name: ''
  });

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await api.get('/projects');
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleOpenModal = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name,
        location: project.location,
        total_land_area: project.total_land_area?.toString() || '',
        total_plots: project.total_plots?.toString() || '',
        plot_size_options: project.plot_size_options || '',
        description: project.description || '',
        amenities: project.amenities || '',
        status: project.status || 'Upcoming',
        layout_map: project.layout_map || '',
        developer_name: project.developer_name || ''
      });
    } else {
      setEditingProject(null);
      setFormData({
        name: '',
        location: '',
        total_land_area: '',
        total_plots: '',
        plot_size_options: '',
        description: '',
        amenities: '',
        status: 'Upcoming',
        layout_map: '',
        developer_name: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      total_land_area: parseFloat(formData.total_land_area) || 0,
      total_plots: parseInt(formData.total_plots) || 0
    };

    try {
      if (editingProject) {
        await api.put(`/projects/${editingProject.id}`, payload);
        toast.success('Project updated successfully');
      } else {
        await api.post('/projects', payload);
        toast.success('Project launched successfully');
      }
      setIsModalOpen(false);
      fetchProjects();
    } catch (err) {
      toast.error('Failed to save project');
    }
  };

  const fetchProjectPlots = async (projectId: number) => {
    try {
      const data = await api.get(`/projects/${projectId}/plots`);
      setPlots(data);
    } catch (err) {
      console.error(err);
      setPlots([]);
    }
  };

  const openPlotModal = (project: Project) => {
    setPlotProject(project);
    setIsPlotModalOpen(true);
    fetchProjectPlots(project.id);
  };

  const createBulkPlots = async () => {
    if (!plotProject) return;
    try {
      await api.post(`/projects/${plotProject.id}/plots/bulk`, {
        plot_ranges: bulkRanges,
        default_size: bulkSize,
        facing: bulkFacing,
        road_width_ft: Number(bulkRoadWidth),
        price: Number(bulkPrice),
      });
      toast.success('Bulk unit generation successful');
      fetchProjectPlots(plotProject.id);
      fetchProjects();
    } catch (err) {
      toast.error('Failed to create plots in bulk');
    }
  };

  const createSinglePlot = async () => {
    if (!plotProject) return;
    try {
      await api.post(`/projects/${plotProject.id}/plots`, {
        plot_number: singlePlot.plot_number,
        size: singlePlot.size,
        facing: singlePlot.facing,
        road_width_ft: Number(singlePlot.road_width_ft),
        price: Number(singlePlot.price),
        status: singlePlot.status,
      });
      toast.success('Single unit added to inventory');
      setSinglePlot({ plot_number: '', size: '', facing: 'North', road_width_ft: '30', price: '0', status: 'Available' });
      fetchProjectPlots(plotProject.id);
      fetchProjects();
    } catch (err) {
      toast.error('Failed to create unit');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      await api.delete(`/projects/${deleteConfirm.id}`);
      setDeleteConfirm({ isOpen: false, id: null });
      toast.success('Project dismantled from portfolio');
      fetchProjects();
    } catch (err) {
      toast.error('Failed to delete project');
    }
  };

  const bulkShareProjects = () => {
    if (selectedProjectIds.length === 0) return;
    const selected = projects.filter(p => selectedProjectIds.includes(p.id));
    const text = `🏗️ *New Development Launch*\n\n` + 
      selected.map((p, i) => `${i+1}. ${p.name} - ${p.location}`).join('\n') +
      `\n\nExplore Details: ${window.location.origin}/catalog`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareProjectLayout = (project: Project) => {
    const text = `📁 *Project Layout: ${project.name}*\n📍 Location: ${project.location}\n🏗️ Developer: ${project.developer_name}\n\nView Digital Layout & Map: ${project.layout_map || (window.location.origin + '/catalog?id=' + project.id)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.location.toLowerCase().includes(search.toLowerCase())
    );
  }, [projects, search]);

  const stats = (
    <>
      <Card className="p-4 bg-white ring-1 ring-slate-200 border-none shadow-sm flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
          <Layers size={20} />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Projects</p>
          <p className="text-xl font-black text-slate-900 mt-1">{projects.length}</p>
        </div>
      </Card>
      <Card className="p-4 bg-white ring-1 ring-slate-200 border-none shadow-sm flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
          <Navigation size={20} />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Ongoing</p>
          <p className="text-xl font-black text-slate-900 mt-1">{projects.filter(p => p.status === 'Ongoing').length}</p>
        </div>
      </Card>
    </>
  );

  return (
    <DataPageLayout
      title="Development Portfolio"
      subtitle="Strategize and manage large-scale real estate developments."
      primaryAction={{
        label: "Launch Development",
        onClick: () => handleOpenModal(),
        icon: <Plus size={18} className="mr-2" />
      }}
      search={{
        value: search,
        onChange: setSearch,
        placeholder: "Search projects by name or location..."
      }}
      stats={stats}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
        <div className="flex bg-white ring-1 ring-slate-200 rounded-2xl p-1 shadow-sm w-full sm:w-auto">
          <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">Portfolio Browser</p>
        </div>
        
        {selectedProjectIds.length > 0 && (
          <Button variant="success" size="sm" onClick={bulkShareProjects} className="w-full sm:w-auto rounded-2xl shadow-xl shadow-emerald-100 px-6 h-11">
            <Share2 size={16} className="mr-2" />
            Share Selection ({selectedProjectIds.length})
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-12 h-12 border-4 border-emerald-50 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Scanning Architectures...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((p, idx) => {
              const isSelected = selectedProjectIds.includes(p.id);
              return (
                <motion.div
                  layout
                  key={p.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className={cn(
                    "p-0 border-none shadow-sm transition-all rounded-[2.5rem] overflow-hidden group h-full relative",
                    isSelected ? 'ring-4 ring-emerald-500 shadow-2xl shadow-emerald-100' : 'ring-1 ring-slate-200/50 bg-white hover:ring-emerald-500/30'
                  )}>
                    <div 
                      className="absolute top-6 right-6 z-20 cursor-pointer"
                      onClick={() => setSelectedProjectIds(prev => isSelected ? prev.filter(id => id !== p.id) : [...prev, p.id])}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all shadow-lg backdrop-blur-md",
                        isSelected ? "bg-emerald-500 border-emerald-500 text-white scale-110" : "bg-white/80 border-white text-slate-400 hover:bg-white"
                      )}>
                        {isSelected && <Plus size={18} className="rotate-45" />}
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row h-full">
                      {/* Visual Branding Side */}
                      <div className="md:w-[40%] bg-slate-900 relative p-8 flex flex-col justify-between overflow-hidden shrink-0">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                          <Building2 size={240} className="text-white" />
                        </div>
                        
                        <div className="relative z-10">
                          <Badge className={cn(
                            "border-none text-[8px] font-black uppercase tracking-widest px-2.5 py-1 mb-6 shadow-xl",
                            p.status === 'Ongoing' ? "bg-amber-500 text-white" :
                            p.status === 'Completed' ? "bg-emerald-500 text-white" :
                            "bg-slate-500 text-white"
                          )}>
                            {p.status}
                          </Badge>
                          <h3 className="text-2xl font-black text-white leading-tight mb-3 group-hover:text-emerald-400 transition-colors truncate" title={p.name}>
                            {p.name}
                          </h3>
                          <div className="flex items-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] truncate">
                            <MapPin size={12} className="mr-2 text-rose-500 shrink-0" />
                            {p.location}
                          </div>
                        </div>
                        
                        <div className="relative z-10 pt-8 border-t border-white/10 mt-8 lg:mt-0">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Developer</p>
                          <p className="text-sm font-black text-white tracking-tight truncate">{p.developer_name || 'OneSpace Infotech'}</p>
                        </div>
                      </div>

                      {/* Operational Data Side */}
                      <div className="md:w-[60%] p-8 flex flex-col bg-white min-w-0">
                        <div className="flex justify-end gap-3 mb-8 shrink-0">
                          <button onClick={() => shareProjectLayout(p)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm">
                            <Share2 size={16} />
                          </button>
                          <button onClick={() => handleOpenModal(p)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all shadow-sm">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => setDeleteConfirm({ isOpen: true, id: p.id })} className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm">
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-x-8 gap-y-6 mb-10">
                          <div className="space-y-1.5 min-w-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5 truncate">
                              <Target size={10} className="text-blue-500 shrink-0" />
                              Area
                            </p>
                            <p className="text-lg font-black text-slate-900 tabular-nums truncate">{formatArea(p.total_land_area)}</p>
                          </div>
                          <div className="space-y-1.5 min-w-0 text-right md:text-left">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center justify-end md:justify-start gap-1.5 truncate">
                              <Box size={10} className="text-indigo-500 shrink-0" />
                              Units
                            </p>
                            <p className="text-lg font-black text-slate-900 tabular-nums truncate">{p.total_plots_count ?? p.total_plots}</p>
                          </div>
                          <div className="space-y-1.5 min-w-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5 truncate text-emerald-600">
                              <Sparkles size={10} className="shrink-0" />
                              Free
                            </p>
                            <p className="text-lg font-black text-emerald-600 tabular-nums truncate">{p.available_plots_count ?? 0}</p>
                          </div>
                          <div className="space-y-1.5 min-w-0 text-right md:text-left">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center justify-end md:justify-start gap-1.5 truncate text-rose-600">
                              <UserCircle size={10} className="shrink-0" />
                              Sold
                            </p>
                            <p className="text-lg font-black text-rose-600 tabular-nums truncate">{p.sold_plots_count ?? 0}</p>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2 mb-6 italic">
                            "{p.description || "Synthesizing excellence through strategic land acquisition and development."}"
                          </p>
                          <div className="flex flex-wrap gap-2 mb-8">
                            {p.amenities?.split(',').slice(0, 3).map((a, i) => (
                              <span key={i} className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-100 truncate">
                                {a.trim()}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-100 mt-auto shrink-0">
                          <Button
                            variant="outline" 
                            className="flex-1 rounded-2xl text-[10px] font-black uppercase tracking-widest border-slate-200 hover:border-emerald-500 hover:text-emerald-600 shadow-sm h-11"
                            onClick={() => window.location.href = `/properties?project=${p.id}`}
                          >
                            <Layers size={14} className="mr-2" />
                            Inventory
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="flex-1 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 transition-all h-11"
                            onClick={() => openPlotModal(p)}
                          >
                            <Layout size={14} className="mr-2" />
                            Manage
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredProjects.length === 0 && (
            <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
                <Building2 size={40} className="text-slate-200" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">No developments recognized</h3>
              <p className="text-slate-500 mt-2 font-medium max-w-xs mx-auto">Start your first high-scale project to manage colonies and plots efficiently.</p>
              <Button onClick={() => handleOpenModal()} className="mt-8 px-10 rounded-2xl shadow-xl shadow-emerald-200">
                Launch First Development
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AdaptiveDrawer
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProject ? 'Modify Development' : 'Initialize New Development'}
        size="xl"
        footer={
          <div className="flex flex-col sm:flex-row justify-between w-full gap-3">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="order-2 sm:order-1 text-slate-400 font-black uppercase tracking-widest text-[10px]">Discard</Button>
            <Button onClick={handleSubmit} className="rounded-2xl shadow-xl shadow-emerald-200 px-8 order-1 sm:order-2 h-11">
              {editingProject ? 'Update Blueprint' : 'Confirm Launch'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-10 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-8">
              <Input label="Project Identity" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Green Valley Colony" />
              <Input label="Geographic Location" required value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="e.g. Near NH-8, City West" />
              <div className="grid grid-cols-2 gap-6">
                <Input label="Land Area (sqft)" type="number" value={formData.total_land_area} onChange={(e) => setFormData({...formData, total_land_area: e.target.value})} />
                <Input label="Total Units" type="number" value={formData.total_plots} onChange={(e) => setFormData({...formData, total_plots: e.target.value})} />
              </div>
            </div>

            <div className="space-y-8">
              <Select 
                label="Development Cycle"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                options={[
                  { value: 'Upcoming', label: 'Upcoming / Pre-launch' },
                  { value: 'Ongoing', label: 'Active Development' },
                  { value: 'Completed', label: 'Completed / Ready' },
                ]}
              />
              <Input label="Developer Entity" value={formData.developer_name} onChange={(e) => setFormData({...formData, developer_name: e.target.value})} placeholder="Entity responsible" />
              <Input label="Standard Amenities" value={formData.amenities} onChange={(e) => setFormData({...formData, amenities: e.target.value})} placeholder="Park, Security, Water..." />
              <Input label="Digital Layout URL" value={formData.layout_map} onChange={(e) => setFormData({...formData, layout_map: e.target.value})} placeholder="Map or Layout URL" />
            </div>

            <div className="lg:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Architectural Vision & Scope</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-4 px-5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all duration-200 h-32 resize-none"
                placeholder="Describe project highlights, USP, and long-term vision..."
              />
            </div>
          </div>
        </form>
      </AdaptiveDrawer>

      {/* Plot Management Modal */}
      <AdaptiveDrawer
        isOpen={isPlotModalOpen}
        onClose={() => setIsPlotModalOpen(false)}
        title={plotProject ? `Inventory Management: ${plotProject.name}` : 'Inventory Control'}
        size="xl"
        footer={<div className="w-full flex justify-end"><Button onClick={() => setIsPlotModalOpen(false)} className="rounded-xl h-11 px-8">Close Control Panel</Button></div>}
      >
        <div className="space-y-8 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-6 bg-slate-900 text-white ring-0 border-none rounded-3xl relative overflow-hidden shadow-2xl shadow-slate-200">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Target size={80} /></div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-4 relative z-10">Bulk Unit Generation</p>
              <div className="grid grid-cols-2 gap-4 relative z-10">
                <Input label="Ranges" value={bulkRanges} onChange={(e) => setBulkRanges(e.target.value)} className="bg-white/10 border-white/10 text-white" />
                <Input label="Std Size" value={bulkSize} onChange={(e) => setBulkSize(e.target.value)} className="bg-white/10 border-white/10 text-white" />
                <Input label="Facing" value={bulkFacing} onChange={(e) => setBulkFacing(e.target.value)} className="bg-white/10 border-white/10 text-white" />
                <Input label="Road Width" type="number" value={bulkRoadWidth} onChange={(e) => setBulkRoadWidth(e.target.value)} className="bg-white/10 border-white/10 text-white" />
              </div>
              <div className="mt-6 flex justify-end relative z-10">
                <Button onClick={createBulkPlots} className="bg-emerald-500 hover:bg-emerald-600 text-white border-none px-6 rounded-xl h-11">Execute Bulk Creation</Button>
              </div>
            </Card>

            <Card className="p-6 bg-slate-50 ring-1 ring-slate-200 border-none rounded-3xl">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Precision Entry</p>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Unit #" value={singlePlot.plot_number} onChange={(e) => setSinglePlot({ ...singlePlot, plot_number: e.target.value })} />
                <Input label="Size" value={singlePlot.size} onChange={(e) => setSinglePlot({ ...singlePlot, size: e.target.value })} />
                <Select label="Status" value={singlePlot.status} onChange={(e) => setSinglePlot({ ...singlePlot, status: e.target.value as any })} options={[{ value: 'Available', label: 'Available' }, { value: 'Sold', label: 'Sold' }]} />
                <div className="flex items-end">
                  <Button onClick={createSinglePlot} className="w-full h-11 rounded-xl">Add Unit</Button>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-0 ring-1 ring-slate-200 border-none rounded-[2rem] overflow-hidden bg-white">
            <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Unit Registry ({plots.length} entries)</p>
            </div>
            <div className="max-h-[350px] overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-1 divide-y divide-slate-50">
                {plots.map((plot) => (
                  <div key={plot.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white ring-1 ring-slate-100 flex items-center justify-center font-black text-xs text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all">
                        {plot.plot_number}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 tracking-tight">{plot.size || 'N/A'} sqft</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{plot.facing} Facing • {plot.road_width_ft}ft Road</p>
                      </div>
                    </div>
                    <Badge className={cn(
                      "text-[9px] font-black uppercase tracking-widest px-3 py-1 border-none",
                      plot.status === 'Sold' ? 'bg-slate-100 text-slate-400' : 'bg-emerald-500 text-white shadow-sm'
                    )}>
                      {plot.status}
                    </Badge>
                  </div>
                ))}
                {plots.length === 0 ? <p className="p-10 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">No units synchronized yet.</p> : null}
              </div>
            </div>
          </Card>
        </div>
      </AdaptiveDrawer>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={handleConfirmDelete}
        title="Dismantle Development Project"
        message="Are you sure you want to delete this project? All unit tracking will be lost, though property listings will persist as standalone."
        confirmText="Confirm Dismantle"
        variant="danger"
      />
    </DataPageLayout>
  );
}
