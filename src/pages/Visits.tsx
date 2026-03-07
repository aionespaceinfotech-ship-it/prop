import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  CheckCircle2,
  XCircle,
  Calendar,
  MapPin,
  ChevronRight,
  MoreVertical,
  ArrowRight
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ResponsiveTable } from '../components/ui/ResponsiveTable';
import { formatDate } from '../utils/formatters';
import { cn } from '../utils/cn';
import { motion, AnimatePresence } from 'motion/react';

interface Visit {
  id: number;
  lead_id: number;
  lead_title: string;
  property_id: number;
  property_title: string;
  client_name: string;
  visit_date: string;
  feedback: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
}

interface Lead {
  id: number;
  title: string;
}

interface Property {
  id: number;
  title: string;
}

export default function Visits() {
  const api = useApi();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'Upcoming' | 'Past' | 'All'>('Upcoming');
  
  const [formData, setFormData] = useState({
    lead_id: '',
    property_id: '',
    visit_date: '',
    visit_time: '10:00',
    feedback: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [visitsData, leadsData, propsData] = await Promise.all([
        api.get('/visits'),
        api.get('/leads'),
        api.get('/properties')
      ]);
      setVisits(visitsData);
      setLeads(leadsData);
      setProperties(propsData);
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
      const visit_date = `${formData.visit_date}T${formData.visit_time}:00`;
      await api.post('/visits', {
        ...formData,
        lead_id: parseInt(formData.lead_id),
        property_id: parseInt(formData.property_id),
        visit_date
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Error scheduling visit');
    }
  };

  const updateVisitStatus = async (id: number, status: string) => {
    try {
      await api.put(`/visits/${id}`, { status });
      fetchData();
    } catch (err) {
      alert('Error updating visit');
    }
  };

  const filteredVisits = visits.filter(v => {
    const date = new Date(v.visit_date);
    if (activeFilter === 'Upcoming') return !isPast(date) || isToday(date);
    if (activeFilter === 'Past') return isPast(date) && !isToday(date);
    return true;
  }).sort((a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime());

  return (
    <div className="p-6 lg:p-10 space-y-12 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <PageHeader 
          title="Site Visits" 
          subtitle="Coordinate property tours and capture client feedback."
        />
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
            {['Upcoming', 'Past', 'All'].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f as any)}
                className={cn(
                  "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  activeFilter === f 
                    ? "bg-slate-900 text-white shadow-lg" 
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="rounded-xl shadow-lg shadow-emerald-200">
            <Plus size={18} className="mr-2" />
            Schedule Visit
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-slate-400 font-medium animate-pulse">Syncing your calendar...</p>
        </div>
      ) : (
        <div className="space-y-10">
          {filteredVisits.length > 0 ? (
            <div className="relative">
              {/* Vertical Timeline Line */}
              <div className="absolute left-12 top-0 bottom-0 w-px bg-slate-200 hidden md:block" />
              
              <div className="space-y-12">
                {filteredVisits.map((v, idx) => {
                  const date = new Date(v.visit_date);
                  const isFirstOfDay = idx === 0 || format(new Date(filteredVisits[idx-1].visit_date), 'yyyy-MM-dd') !== format(date, 'yyyy-MM-dd');
                  
                  return (
                    <motion.div 
                      key={v.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="relative"
                    >
                      {isFirstOfDay && (
                        <div className="mb-8 flex items-center gap-6">
                          <div className="w-24 text-right">
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">
                              {isToday(date) ? 'Today' : isTomorrow(date) ? 'Tomorrow' : format(date, 'EEEE')}
                            </p>
                          </div>
                          <div className="w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm z-10 hidden md:block" />
                          <h3 className="text-2xl font-black text-slate-900">
                            {format(date, 'MMMM dd, yyyy')}
                          </h3>
                        </div>
                      )}
                      
                      <div className="flex flex-col md:flex-row gap-6 md:gap-12 pl-0 md:pl-24">
                        <div className="md:w-24 shrink-0 flex flex-row md:flex-col items-center md:items-end gap-2 md:gap-0">
                          <span className="text-lg font-black text-slate-900">{format(date, 'hh:mm')}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(date, 'a')}</span>
                        </div>
                        
                        <Card className="flex-1 p-0 border-none shadow-sm ring-1 ring-slate-200/50 bg-white hover:ring-emerald-500/30 transition-all group overflow-hidden">
                          <div className="flex flex-col lg:flex-row">
                            <div className="p-8 flex-1 space-y-6">
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Property Tour</p>
                                  <h4 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{v.property_title}</h4>
                                </div>
                                <Badge className={cn(
                                  "border-none px-3 py-1 text-[9px] font-bold uppercase tracking-widest",
                                  v.status === 'Scheduled' ? "bg-amber-500 text-white" :
                                  v.status === 'Completed' ? "bg-emerald-500 text-white" :
                                  "bg-rose-500 text-white"
                                )}>
                                  {v.status}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                    <User size={18} />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client</p>
                                    <p className="text-sm font-bold text-slate-700">{v.client_name}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                    <CalendarIcon size={18} />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lead Context</p>
                                    <p className="text-sm font-bold text-slate-700 truncate max-w-[150px]">{v.lead_title}</p>
                                  </div>
                                </div>
                              </div>
                              
                              {v.feedback && (
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                  <p className="text-xs text-slate-500 italic leading-relaxed">"{v.feedback}"</p>
                                </div>
                              )}
                            </div>
                            
                            <div className="lg:w-48 bg-slate-50/50 border-t lg:border-t-0 lg:border-l border-slate-100 p-6 flex flex-row lg:flex-col gap-3 justify-center">
                              {v.status === 'Scheduled' ? (
                                <>
                                  <button 
                                    onClick={() => updateVisitStatus(v.id, 'Completed')}
                                    className="flex-1 lg:w-full py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm"
                                  >
                                    Complete
                                  </button>
                                  <button 
                                    onClick={() => updateVisitStatus(v.id, 'Cancelled')}
                                    className="flex-1 lg:w-full py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <div className="flex flex-col items-center justify-center text-center py-4 opacity-40">
                                  {v.status === 'Completed' ? <CheckCircle2 size={24} className="text-emerald-600 mb-2" /> : <XCircle size={24} className="text-rose-600 mb-2" />}
                                  <span className="text-[10px] font-black uppercase tracking-widest">{v.status}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-32 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CalendarIcon size={32} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No visits scheduled</h3>
              <p className="text-slate-500 max-w-xs mx-auto mb-8">Your calendar is currently clear. Start by scheduling a property tour for your leads.</p>
              <Button onClick={() => setIsModalOpen(true)} className="rounded-xl">
                Schedule first visit
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Schedule Visit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Site Visit"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-slate-400 font-bold uppercase tracking-widest text-xs">Discard</Button>
            <Button onClick={handleSubmit} className="rounded-xl shadow-lg shadow-emerald-200 px-8">Confirm Visit</Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-10 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Select 
              label="Select Lead"
              required
              value={formData.lead_id}
              onChange={(e) => setFormData({...formData, lead_id: e.target.value})}
              options={[
                { value: '', label: 'Choose a lead...' },
                ...leads.map(l => ({ value: l.id, label: l.title }))
              ]}
            />
            <Select 
              label="Select Property"
              required
              value={formData.property_id}
              onChange={(e) => setFormData({...formData, property_id: e.target.value})}
              options={[
                { value: '', label: 'Choose a property...' },
                ...properties.map(p => ({ value: p.id, label: p.title }))
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <Input 
              label="Visit Date"
              required
              type="date"
              value={formData.visit_date}
              onChange={(e) => setFormData({...formData, visit_date: e.target.value})}
            />
            <Input 
              label="Preferred Time"
              required
              type="time"
              value={formData.visit_time}
              onChange={(e) => setFormData({...formData, visit_time: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Special Instructions / Initial Feedback</label>
            <textarea 
              value={formData.feedback}
              onChange={(e) => setFormData({...formData, feedback: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all duration-200 h-32 resize-none"
              placeholder="Any specific requirements or notes for this site visit..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
