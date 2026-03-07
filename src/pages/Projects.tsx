import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  MapPin, 
  Building2, 
  Edit2, 
  Trash2, 
  Layers,
  Layout,
  Maximize2,
  Users,
  ArrowRight,
  Sparkles,
  Navigation,
  Filter
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { formatArea } from '../utils/formatters';
import { cn } from '../utils/cn';

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
}

export default function Projects() {
  const api = useApi();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

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
      } else {
        await api.post('/projects', payload);
      }
      setIsModalOpen(false);
      fetchProjects();
    } catch (err) {
      alert('Error saving project');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this project? All linked properties will become standalone.')) {
      try {
        await api.delete(`/projects/${id}`);
        fetchProjects();
      } catch (err) {
        alert('Error deleting project');
      }
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-10 space-y-12 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <PageHeader 
          title="Developments" 
          subtitle="Architectural vision and large-scale colony management."
        />
        <Button onClick={() => handleOpenModal()} className="rounded-xl shadow-lg shadow-emerald-200">
          <Plus size={18} className="mr-2" />
          Create Project
        </Button>
      </div>

      {/* Search & Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search projects by name or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-slate-900">{projects.length}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Projects</span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-emerald-600">
              {projects.filter(p => p.status === 'Ongoing').length}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ongoing</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-slate-400 font-medium animate-pulse">Loading developments...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((p, idx) => (
              <motion.div
                layout
                key={p.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="p-0 border-none shadow-sm ring-1 ring-slate-200/50 bg-white hover:ring-emerald-500/30 transition-all rounded-[2.5rem] overflow-hidden group">
                  <div className="flex flex-col md:flex-row h-full">
                    {/* Visual Side */}
                    <div className="md:w-2/5 bg-slate-900 relative p-8 flex flex-col justify-between min-h-[300px]">
                      <div className="relative z-10">
                        <Badge className={cn(
                          "border-none text-[9px] font-black uppercase tracking-widest px-2 py-0.5 mb-4",
                          p.status === 'Ongoing' ? "bg-amber-500 text-white" :
                          p.status === 'Completed' ? "bg-emerald-500 text-white" :
                          "bg-slate-500 text-white"
                        )}>
                          {p.status}
                        </Badge>
                        <h3 className="text-2xl font-black text-white leading-tight mb-2 group-hover:text-emerald-400 transition-colors">
                          {p.name}
                        </h3>
                        <div className="flex items-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                          <MapPin size={12} className="mr-2 text-emerald-500" />
                          {p.location}
                        </div>
                      </div>
                      
                      <div className="relative z-10">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Developer</p>
                        <p className="text-sm font-bold text-white">{p.developer_name || 'PropBroker Group'}</p>
                      </div>

                      {/* Abstract Background Element */}
                      <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none overflow-hidden">
                        <Building2 size={300} className="absolute -right-20 -top-20 text-white" />
                      </div>
                    </div>

                    {/* Content Side */}
                    <div className="md:w-3/5 p-8 flex flex-col">
                      <div className="flex justify-end gap-2 mb-6">
                        <button 
                          onClick={() => handleOpenModal(p)}
                          className="p-2 text-slate-300 hover:text-slate-600 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Footprint</p>
                          <p className="text-lg font-black text-slate-900">{formatArea(p.total_land_area)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Planned Units</p>
                          <p className="text-lg font-black text-slate-900">{p.total_plots} Plots</p>
                        </div>
                      </div>

                      <div className="flex-1 mb-8">
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-4">
                          {p.description || "No detailed description provided for this development project."}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {p.amenities?.split(',').map((a, i) => (
                            <span key={i} className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-100">
                              {a.trim()}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <Button 
                          variant="outline" 
                          className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest border-slate-200"
                          onClick={() => window.location.href = `/properties?project=${p.id}`}
                        >
                          <Layers size={14} className="mr-2" />
                          Inventory
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900"
                        >
                          <Layout size={14} className="mr-2" />
                          Layout
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredProjects.length === 0 && (
            <div className="col-span-full py-32 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 size={32} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No developments found</h3>
              <p className="text-slate-500 max-w-xs mx-auto mb-8">Start your first large-scale project to manage plots and colonies effectively.</p>
              <Button onClick={() => handleOpenModal()} className="rounded-xl">
                Create Project
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProject ? 'Modify Development' : 'New Development Project'}
        size="xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cancel</Button>
            <Button onClick={handleSubmit} className="rounded-xl shadow-lg shadow-emerald-200 px-8">
              {editingProject ? 'Update Project' : 'Launch Project'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-10 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-8">
              <Input 
                label="Project Identity"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Green Valley Colony"
              />
              <Input 
                label="Geographic Location"
                required
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="e.g. Near Highway, City North"
              />
              <div className="grid grid-cols-2 gap-6">
                <Input 
                  label="Land Area (sq ft)"
                  type="number"
                  value={formData.total_land_area}
                  onChange={(e) => setFormData({...formData, total_land_area: e.target.value})}
                  placeholder="50000"
                />
                <Input 
                  label="Total Units"
                  type="number"
                  value={formData.total_plots}
                  onChange={(e) => setFormData({...formData, total_plots: e.target.value})}
                  placeholder="100"
                />
              </div>
            </div>

            <div className="space-y-8">
              <Select 
                label="Development Status"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                options={[
                  { value: 'Upcoming', label: 'Upcoming / Pre-launch' },
                  { value: 'Ongoing', label: 'Ongoing Development' },
                  { value: 'Completed', label: 'Completed / Ready' },
                ]}
              />
              <Input 
                label="Developer / Entity Name"
                value={formData.developer_name}
                onChange={(e) => setFormData({...formData, developer_name: e.target.value})}
                placeholder="e.g. Green Builders Ltd."
              />
              <Input 
                label="Key Amenities (comma separated)"
                value={formData.amenities}
                onChange={(e) => setFormData({...formData, amenities: e.target.value})}
                placeholder="Park, Security, Water..."
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Project Vision & Description</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all duration-200 h-32 resize-none"
                placeholder="Describe the project highlights, unique selling points, and vision..."
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
