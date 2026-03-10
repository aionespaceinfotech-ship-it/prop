import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  CheckCircle2,
  XCircle,
  MapPin,
  ChevronRight,
  MoreVertical,
  ArrowRight,
  CalendarDays,
  Target,
  History
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { AdaptiveDrawer } from '../components/ui/AdaptiveDrawer';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { DataPageLayout } from '../components/ui/DataPageLayout';
import { formatDate } from '../utils/formatters';
import { cn } from '../utils/cn';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

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
  
  const [cancelConfirm, setCancelConfirm] = useState<{ isOpen: boolean; id: number | null }>({
    isOpen: false,
    id: null
  });

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
      setFormData({ lead_id: '', property_id: '', visit_date: '', visit_time: '10:00', feedback: '' });
      toast.success('Tour scheduled successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to schedule visit');
    }
  };

  const updateVisitStatus = async (id: number, status: string) => {
    try {
      await api.put(`/visits/${id}`, { status });
      setCancelConfirm({ isOpen: false, id: null });
      toast.success(`Tour marked as ${status}`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update tour status');
    }
  };

  const filteredVisits = visits.filter(v => {
    const date = new Date(v.visit_date);
    if (activeFilter === 'Upcoming') return !isPast(date) || isToday(date);
    if (activeFilter === 'Past') return isPast(date) && !isToday(date);
    return true;
  }).sort((a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime());

  const filterContent = (
    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 w-fit">
      {['Upcoming', 'Past', 'All'].map((f) => (
        <button
          key={f}
          onClick={() => setActiveFilter(f as any)}
          className={cn(
            "px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
            activeFilter === f 
              ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200" 
              : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
          )}
        >
          {f}
        </button>
      ))}
    </div>
  );

  return (
    <DataPageLayout
      title="Tour Logistics"
      subtitle="Coordinate property site visits, manage schedules and capture instant buyer feedback."
      primaryAction={{
        label: "Schedule Visit",
        onClick: () => setIsModalOpen(true),
        icon: <Plus size={18} className="mr-2" />
      }}
      filters={{
        content: filterContent
      }}
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-12 h-12 border-4 border-emerald-50 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Syncing Site Schedules...</p>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-4 sm:px-0">
          {filteredVisits.length > 0 ? (
            <div className="relative pl-0 md:pl-32">
              <div className="absolute left-0 md:left-[120px] top-0 bottom-0 w-px bg-slate-200 hidden md:block" />
              
              <div className="space-y-12 lg:space-y-16">
                {filteredVisits.map((v, idx) => {
                  const date = new Date(v.visit_date);
                  const isFirstOfDay = idx === 0 || format(new Date(filteredVisits[idx-1].visit_date), 'yyyy-MM-dd') !== format(date, 'yyyy-MM-dd');
                  
                  return (
                    <motion.div 
                      key={v.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="relative"
                    >
                      {isFirstOfDay && (
                        <div className="absolute -left-32 top-0 hidden md:flex flex-col items-end w-24">
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] leading-none mb-2">
                            {isToday(date) ? 'Today' : isTomorrow(date) ? 'Tomorrow' : format(date, 'EEEE')}
                          </p>
                          <p className="text-sm font-black text-slate-900">{format(date, 'MMM dd')}</p>
                        </div>
                      )}
                      
                      {isFirstOfDay && <div className="absolute left-[116px] top-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-white z-10 hidden md:block" />}
                      
                      <div className="flex flex-col md:flex-row gap-4 lg:gap-6">
                        <div className="md:hidden flex items-center gap-2 mb-2">
                          <Badge variant="neutral" className="text-[9px] uppercase font-black tracking-widest bg-slate-900 text-white border-none">
                            {format(date, 'MMM dd')} • {format(date, 'EEEE')}
                          </Badge>
                        </div>

                        <Card className="flex-1 p-0 border-none shadow-sm ring-1 ring-slate-200/50 bg-white hover:ring-emerald-500/30 transition-all group overflow-hidden rounded-[2rem] lg:rounded-[2.5rem] hover:shadow-xl hover:shadow-slate-200/50">
                          <div className="flex flex-col lg:flex-row min-h-[200px] lg:min-h-[220px]">
                            <div className="p-6 lg:p-8 flex-1 space-y-6">
                              <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg lg:text-xl font-black text-slate-900 tabular-nums">{format(date, 'hh:mm')}</span>
                                    <span className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">{format(date, 'a')}</span>
                                  </div>
                                  <h4 className="text-base lg:text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors leading-tight mt-1 truncate" title={v.property_title}>{v.property_title}</h4>
                                </div>
                                <Badge className={cn(
                                  "border-none px-2 lg:px-3 py-0.5 lg:py-1 text-[8px] lg:text-[9px] font-black uppercase tracking-widest shadow-sm shrink-0",
                                  v.status === 'Scheduled' ? "bg-amber-500 text-white animate-pulse" :
                                  v.status === 'Completed' ? "bg-emerald-500 text-white" :
                                  "bg-slate-400 text-white"
                                )}>
                                  {v.status}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                                <div className="flex items-center gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 border border-slate-100 shrink-0">
                                    <User size={18} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[8px] lg:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Tour For</p>
                                    <p className="text-xs lg:text-sm font-black text-slate-700 mt-1 truncate">{v.client_name}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 border border-slate-100 shrink-0">
                                    <Target size={18} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[8px] lg:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Inquiry Context</p>
                                    <p className="text-xs lg:text-sm font-black text-slate-700 mt-1 truncate">{v.lead_title}</p>
                                  </div>
                                </div>
                              </div>
                              
                              {v.feedback && (
                                <div className="p-4 bg-emerald-50/30 rounded-2xl border border-dashed border-emerald-200 relative overflow-hidden">
                                  <p className="text-[11px] lg:text-xs text-slate-500 font-medium leading-relaxed italic relative z-10 line-clamp-2">"{v.feedback}"</p>
                                  <History size={48} className="absolute -right-4 -bottom-4 text-emerald-500/5 -rotate-12" />
                                </div>
                              )}
                            </div>
                            
                            <div className="lg:w-52 bg-slate-50/50 border-t lg:border-t-0 lg:border-l border-slate-100 p-4 lg:p-6 flex flex-row lg:flex-col gap-3 justify-center items-center shrink-0">
                              {v.status === 'Scheduled' ? (
                                <>
                                  <button 
                                    onClick={() => updateVisitStatus(v.id, 'Completed')}
                                    className="flex-1 lg:w-full py-3 lg:py-4 bg-emerald-600 text-white rounded-2xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95"
                                  >
                                    Mark Done
                                  </button>
                                  <button 
                                    onClick={() => setCancelConfirm({ isOpen: true, id: v.id })}
                                    className="flex-1 lg:w-full py-3 lg:py-4 bg-white border border-slate-200 rounded-2xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 transition-all active:scale-95"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <div className="flex flex-col items-center justify-center text-center opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                                  {v.status === 'Completed' ? <CheckCircle2 size={28} className="text-emerald-600 mb-2" /> : <XCircle size={28} className="text-slate-400 mb-2" />}
                                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">{v.status}</span>
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
            <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
                <CalendarDays size={40} className="text-slate-200" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">No tours registered</h3>
              <p className="text-slate-500 mt-2 font-medium max-w-xs mx-auto">Your logistics calendar is currently clean. Start by scheduling a tour for your active prospects.</p>
              <Button onClick={() => setIsModalOpen(true)} className="mt-8 px-10 rounded-2xl shadow-xl shadow-emerald-200">
                Schedule First Tour
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Schedule Visit Modal */}
      <AdaptiveDrawer
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Initialize Site Logistic"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Discard</Button>
            <Button onClick={handleSubmit} className="rounded-2xl shadow-xl shadow-emerald-200 px-8">Confirm Schedule</Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-10 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Select 
              label="Prospect Lead"
              required
              value={formData.lead_id}
              onChange={(e) => setFormData({...formData, lead_id: e.target.value})}
              options={[
                { value: '', label: 'Select active prospect...' },
                ...leads.map(l => ({ value: l.id, label: l.title }))
              ]}
            />
            <Select 
              label="Target Property"
              required
              value={formData.property_id}
              onChange={(e) => setFormData({...formData, property_id: e.target.value})}
              options={[
                { value: '', label: 'Select property listing...' },
                ...properties.map(p => ({ value: p.id, label: p.title }))
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <Input 
              label="Logistic Date"
              required
              type="date"
              value={formData.visit_date}
              onChange={(e) => setFormData({...formData, visit_date: e.target.value})}
            />
            <Input 
              label="Execution Time"
              required
              type="time"
              value={formData.visit_time}
              onChange={(e) => setFormData({...formData, visit_time: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Special Instructions / Briefing</label>
            <textarea 
              value={formData.feedback}
              onChange={(e) => setFormData({...formData, feedback: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-4 px-5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all duration-200 h-32 resize-none"
              placeholder="Record any specific buyer requirements or notes for this property tour..."
            />
          </div>
        </form>
      </AdaptiveDrawer>

      {/* Cancel Confirmation */}
      <ConfirmModal
        isOpen={cancelConfirm.isOpen}
        onClose={() => setCancelConfirm({ isOpen: false, id: null })}
        onConfirm={() => cancelConfirm.id && updateVisitStatus(cancelConfirm.id, 'Cancelled')}
        title="Abort Site Visit"
        message="Are you sure you want to cancel this property tour? This will release the time slot and notify involved parties."
        confirmText="Confirm Abortion"
        variant="warning"
      />
    </DataPageLayout>
  );
}
