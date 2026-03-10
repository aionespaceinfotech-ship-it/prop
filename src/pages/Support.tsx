import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { MessageSquare, HelpCircle, BookOpen, ExternalLink, LifeBuoy, ArrowRight } from 'lucide-react';

const faqs = [
  { q: 'How do I assign leads to salespersons?', a: 'Open the Lead Pipeline, select a lead, and use the "Assign to Agent" dropdown during creation or modification.' },
  { q: 'Why is my inventory data restricted?', a: 'Sales users can only see specific regions or leads assigned to them. Administrative accounts have full access to the global portfolio.' },
  { q: 'How do I share matching properties?', a: 'Use the "Share Match" button in lead details or the WhatsApp icon on individual property listings to generate instant catalog links.' },
  { q: 'Can I track unit-level plots in colonies?', a: 'Yes, navigate to Developments, select a project, and use "Manage Plots" for bulk or precision unit tracking.' },
];

export default function Support() {
  return (
    <div className="p-6 lg:p-10 space-y-10 max-w-5xl mx-auto">
      <PageHeader 
        title="Command Center Support" 
        subtitle="Operational guidance and direct assistance for your brokerage platform." 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="p-8 border-none shadow-sm ring-1 ring-slate-200 rounded-[2rem] bg-white flex flex-col items-center text-center group hover:ring-emerald-500/30 transition-all">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
            <BookOpen size={24} />
          </div>
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Documentation</h4>
          <p className="text-xs text-slate-400 mt-2 font-medium">Explore detailed guides and workflows.</p>
          <Button variant="ghost" className="mt-6 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
            Open Wiki <ExternalLink size={12} className="ml-1.5" />
          </Button>
        </Card>

        <Card className="p-8 border-none shadow-sm ring-1 ring-slate-200 rounded-[2rem] bg-white flex flex-col items-center text-center group hover:ring-blue-500/30 transition-all">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
            <MessageSquare size={24} />
          </div>
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Live Chat</h4>
          <p className="text-xs text-slate-400 mt-2 font-medium">Real-time support via WhatsApp.</p>
          <Button variant="ghost" className="mt-6 text-[10px] font-black text-blue-600 uppercase tracking-widest">
            Start Session <ExternalLink size={12} className="ml-1.5" />
          </Button>
        </Card>

        <Card className="p-8 border-none shadow-sm ring-1 ring-slate-200 rounded-[2rem] bg-white flex flex-col items-center text-center group hover:ring-rose-500/30 transition-all">
          <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-6 group-hover:scale-110 transition-transform">
            <LifeBuoy size={24} />
          </div>
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Critical Help</h4>
          <p className="text-xs text-slate-400 mt-2 font-medium">Report bugs or system outages.</p>
          <Button variant="ghost" className="mt-6 text-[10px] font-black text-rose-600 uppercase tracking-widest">
            Submit Ticket <ExternalLink size={12} className="ml-1.5" />
          </Button>
        </Card>
      </div>

      <Card className="p-10 space-y-8 border-none shadow-sm ring-1 ring-slate-200 rounded-[2.5rem] bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <HelpCircle size={120} />
        </div>
        
        <div className="relative z-10">
          <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8">Frequently Asked Questions</h3>
          <div className="space-y-6">
            {faqs.map((item) => (
              <div key={item.q} className="p-6 bg-slate-50/50 rounded-[1.5rem] border border-slate-100 group hover:bg-white hover:shadow-md transition-all">
                <p className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors flex items-center gap-2">
                  <ArrowRight size={14} className="text-slate-300" />
                  {item.q}
                </p>
                <p className="text-sm text-slate-500 mt-2 ml-6 leading-relaxed font-medium">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white">
              <MessageSquare size={18} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">Direct Support Pipeline</p>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Average response: 15 mins</p>
            </div>
          </div>
          <Button onClick={() => window.open('https://wa.me/?text=Hi,%20I%20need%20help%20with%20PropBroker%20CRM', '_blank')} className="rounded-2xl shadow-xl shadow-emerald-200 px-8">
            Connect with an Expert
          </Button>
        </div>
      </Card>
    </div>
  );
}
