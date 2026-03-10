import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';

interface SalesUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  active: number;
  created_at: string;
}

export default function UserManagement() {
  const api = useApi();
  const { user } = useAuth();
  const [salesUsers, setSalesUsers] = useState<SalesUser[]>([]);
  const [newSales, setNewSales] = useState({ name: '', email: '', phone: '', password: '', role: 'Sales' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', password: '' });

  const canManageUsers = user?.role === 'Admin' || user?.role === 'Super Admin';

  const loadSalesUsers = async () => {
    try {
      const rows = await api.get('/users/sales');
      setSalesUsers(rows);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (canManageUsers) loadSalesUsers();
  }, [canManageUsers]);

  const createSalesUser = async () => {
    if (!newSales.name || !newSales.email || !newSales.phone || !newSales.password) {
      alert('Name, email, phone and password are required');
      return;
    }
    try {
      await api.post('/users/sales', newSales);
      setNewSales({ name: '', email: '', phone: '', password: '', role: 'Sales' });
      loadSalesUsers();
    } catch {
      alert('Failed to create sales user');
    }
  };

  const startEdit = (u: SalesUser) => {
    setEditingId(u.id);
    setEditForm({ name: u.name, email: u.email, phone: u.phone || '', password: '' });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await api.put(`/users/sales/${editingId}`, editForm);
      setEditingId(null);
      setEditForm({ name: '', email: '', phone: '', password: '' });
      loadSalesUsers();
    } catch {
      alert('Failed to update user');
    }
  };

  const toggleActive = async (u: SalesUser) => {
    try {
      await api.put(`/users/sales/${u.id}/active`, { active: u.active ? 0 : 1 });
      loadSalesUsers();
    } catch {
      alert('Failed to update status');
    }
  };

  if (!canManageUsers) {
    return (
      <div className="p-6 lg:p-10">
        <Card className="p-6 border-none shadow-sm ring-1 ring-slate-200">
          <p className="text-slate-600">You do not have permission to access user management.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6 max-w-6xl mx-auto">
      <PageHeader title="User Management" subtitle="Create and manage Sales users." />

      <Card className="p-4 sm:p-6 space-y-4 border-none shadow-sm ring-1 ring-slate-200/70 rounded-2xl">
        <h3 className="text-sm font-bold text-slate-900 tracking-wide">Create Sales User</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <Input label="Name" value={newSales.name} onChange={(e) => setNewSales({ ...newSales, name: e.target.value })} />
          <Input label="Email" value={newSales.email} onChange={(e) => setNewSales({ ...newSales, email: e.target.value })} />
          <Input label="Phone Number" value={newSales.phone} onChange={(e) => setNewSales({ ...newSales, phone: e.target.value })} />
          <Input label="Password" type="password" value={newSales.password} onChange={(e) => setNewSales({ ...newSales, password: e.target.value })} />
          <Select label="Role" value={newSales.role} onChange={(e) => setNewSales({ ...newSales, role: e.target.value })} options={[{ value: 'Sales', label: 'Sales' }]} />
        </div>
        <div className="flex justify-end pt-1">
          <Button onClick={createSalesUser}>Create User</Button>
        </div>
      </Card>

      <Card className="p-4 sm:p-6 space-y-3 border-none shadow-sm ring-1 ring-slate-200/70 rounded-2xl">
        <h3 className="text-sm font-bold text-slate-900 tracking-wide">Sales Users</h3>
        <div className="hidden md:grid grid-cols-4 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          <span>Name</span>
          <span>Email</span>
          <span>Phone</span>
          <span>Status</span>
        </div>
        {salesUsers.map((u) => (
          <div key={u.id} className="border border-slate-200 rounded-xl px-3 py-3 text-sm space-y-2 bg-white">
            {editingId === u.id ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input label="Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                <Input label="Email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                <Input label="Phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                <Input label="New Password" type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-start md:items-center">
                <div className="font-medium text-slate-900">{u.name}</div>
                <div className="text-slate-600 break-all">{u.email}</div>
                <div className="text-slate-600">{u.phone || '-'}</div>
                <div className={u.active ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>{u.active ? 'Active' : 'Inactive'}</div>
              </div>
            )}
            <div className="flex flex-wrap justify-end gap-2 pt-1">
              {editingId === u.id ? (
                <>
                  <Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                  <Button onClick={saveEdit}>Save</Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => startEdit(u)}>Edit</Button>
                  <Button variant="outline" onClick={() => toggleActive(u)}>{u.active ? 'Deactivate' : 'Activate'}</Button>
                </>
              )}
            </div>
          </div>
        ))}
        {salesUsers.length === 0 ? <p className="text-sm text-slate-500">No sales users found.</p> : null}
      </Card>
    </div>
  );
}
