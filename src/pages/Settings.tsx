import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [companyName, setCompanyName] = useState('PropBroker CRM');
  const [phone, setPhone] = useState('+91');
  const [city, setCity] = useState('Udaipur');
  const [currency, setCurrency] = useState('INR');

  if (user?.role !== 'Admin' && user?.role !== 'Super Admin') {
    return (
      <div className="p-6 lg:p-10">
        <Card className="p-6 border-none shadow-sm ring-1 ring-slate-200">
          <p className="text-slate-600">You do not have permission to access system configuration.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-6 max-w-5xl">
      <PageHeader title="Settings" subtitle="Manage your CRM defaults and company profile." />
      <Card className="p-6 space-y-4 border-none shadow-sm ring-1 ring-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          <Input label="Support Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input label="Default City" value={city} onChange={(e) => setCity(e.target.value)} />
          <Input label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} />
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => navigate('/users')}>Open User Management</Button>
          <Button onClick={() => alert('Settings saved successfully.')}>Save Settings</Button>
        </div>
      </Card>
    </div>
  );
}
