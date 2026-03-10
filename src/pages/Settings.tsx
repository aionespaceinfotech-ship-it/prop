import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ShieldAlert, Settings as SettingsIcon, Save, Users, Building2, Globe } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const navigate = useNavigate();
  const { isManager } = usePermissions();
  
  const [companyName, setCompanyName] = useState('PropBroker CRM');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [city, setCity] = useState('Udaipur');
  const [currency, setCurrency] = useState('INR (₹)');

  if (!isManager) {
    return (
      <div className="p-6 lg:p-10 flex items-center justify-center min-h-[60vh]">
        <Card className="p-12 text-center border-none shadow-sm ring-1 ring-slate-200 max-w-md rounded-[2.5rem]">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="text-rose-500" size={40} />
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Access Restricted</h3>
          <p className="text-slate-500 mt-2 font-medium">You do not have administrative clearance to access system configuration.</p>
          <Button variant="ghost" onClick={() => navigate('/')} className="mt-8 text-emerald-600 font-bold uppercase tracking-widest text-[10px]">
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const handleSave = () => {
    toast.success('System configuration updated successfully');
  };

  return (
    <div className="p-6 lg:p-10 space-y-10 max-w-5xl mx-auto">
      <PageHeader 
        title="System Defaults" 
        subtitle="Manage your agency profile, regional defaults and CRM configuration." 
      />
      
      <div className="grid grid-cols-1 gap-10">
        <Card className="p-10 space-y-10 border-none shadow-sm ring-1 ring-slate-200 rounded-[2.5rem] bg-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <SettingsIcon size={180} />
          </div>

          <div className="space-y-8 relative z-10">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                <Building2 size={24} />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900 tracking-tight">Agency Identity</h4>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Public profile details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Input label="Registered Entity Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              <Input label="Primary Support Contact" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>

          <div className="space-y-8 relative z-10">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <Globe size={24} />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900 tracking-tight">Regional Settings</h4>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Localization & Defaults</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Input label="Operational City" value={city} onChange={(e) => setCity(e.target.value)} />
              <Input label="Preferred Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">All fields successfully validated</p>
            </div>
            <div className="flex flex-wrap justify-end gap-4 w-full sm:w-auto">
              <Button variant="ghost" onClick={() => navigate('/users')} className="text-slate-400 font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
                <Users size={14} />
                User Management
              </Button>
              <Button onClick={handleSave} className="rounded-2xl shadow-xl shadow-emerald-200 px-8">
                <Save size={18} className="mr-2" />
                Commit Changes
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
