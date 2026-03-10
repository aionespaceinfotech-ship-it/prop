import { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { DataPageLayout } from '../components/ui/DataPageLayout';
import { ResponsiveTable } from '../components/ui/ResponsiveTable';
import { Badge } from '../components/ui/Badge';
import { useApi } from '../hooks/useApi';
import { usePermissions } from '../hooks/usePermissions';
import { UserPlus, UserCog, UserCheck, UserMinus } from 'lucide-react';
import { toast } from 'sonner';

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
  const { canManageUsers } = usePermissions();
  
  const [salesUsers, setSalesUsers] = useState<SalesUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Form States
  const [newSales, setNewSales] = useState({ name: '', email: '', phone: '', password: '', role: 'Sales' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', password: '' });
  
  // Confirmation States
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; user: SalesUser | null }>({
    isOpen: false,
    user: null
  });

  const loadSalesUsers = async () => {
    setLoading(true);
    try {
      const rows = await api.get('/users/sales');
      setSalesUsers(rows);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canManageUsers) loadSalesUsers();
  }, [canManageUsers]);

  const filteredUsers = useMemo(() => {
    return salesUsers.filter(u => 
      u.name.toLowerCase().includes(search.toLowerCase()) || 
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || '').includes(search)
    );
  }, [salesUsers, search]);

  const createSalesUser = async () => {
    if (!newSales.name || !newSales.email || !newSales.phone || !newSales.password) {
      toast.error('All fields are required');
      return;
    }
    try {
      await api.post('/users/sales', newSales);
      setNewSales({ name: '', email: '', phone: '', password: '', role: 'Sales' });
      toast.success('User account created');
      loadSalesUsers();
    } catch {
      toast.error('Failed to create sales user');
    }
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await api.put(`/users/sales/${editingId}`, editForm);
      setEditingId(null);
      setEditForm({ name: '', email: '', phone: '', password: '' });
      toast.success('User profile updated');
      loadSalesUsers();
    } catch {
      toast.error('Failed to update user');
    }
  };

  const handleToggleActive = async () => {
    const u = confirmModal.user;
    if (!u) return;
    
    try {
      await api.put(`/users/sales/${u.id}/active`, { active: u.active ? 0 : 1 });
      setConfirmModal({ isOpen: false, user: null });
      toast.success(`User ${u.active ? 'deactivated' : 'activated'}`);
      loadSalesUsers();
    } catch {
      toast.error('Failed to update status');
    }
  };

  if (!canManageUsers) {
    return (
      <div className="p-8">
        <Card className="p-12 text-center border-none shadow-sm ring-1 ring-slate-200">
          <UserMinus className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-bold text-slate-900">Access Denied</h3>
          <p className="text-slate-500 mt-1">You do not have permission to access user management.</p>
        </Card>
      </div>
    );
  }

  const columns = [
    {
      header: 'User Info',
      accessor: (u: SalesUser) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs uppercase tracking-tighter">
            {u.name.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-slate-900 leading-none">{u.name}</p>
            <p className="text-[10px] text-slate-500 mt-1">{u.email}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Phone',
      accessor: (u: SalesUser) => <span className="text-slate-600 tabular-nums">{u.phone || '-'}</span>
    },
    {
      header: 'Status',
      accessor: (u: SalesUser) => (
        <Badge variant={u.active ? 'success' : 'neutral'}>
          {u.active ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: (u: SalesUser) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setEditingId(u.id);
              setEditForm({ name: u.name, email: u.email, phone: u.phone || '', password: '' });
            }}
          >
            Edit
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={u.active ? 'text-rose-600 hover:text-rose-700' : 'text-emerald-600 hover:text-emerald-700'}
            onClick={() => setConfirmModal({ isOpen: true, user: u })}
          >
            {u.active ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      )
    }
  ];

  return (
    <DataPageLayout
      title="User Management"
      subtitle="Create and manage your sales team and administrative users."
      search={{
        value: search,
        onChange: setSearch,
        placeholder: "Search users by name, email or phone..."
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create User Form */}
        <div className="lg:col-span-1">
          <Card title="Add New User" subtitle="Enter credentials for the new team member." className="border-none shadow-sm ring-1 ring-slate-200 sticky top-8">
            <div className="space-y-4">
              <Input label="Full Name" value={newSales.name} onChange={(e) => setNewSales({ ...newSales, name: e.target.value })} placeholder="John Doe" />
              <Input label="Email Address" type="email" value={newSales.email} onChange={(e) => setNewSales({ ...newSales, email: e.target.value })} placeholder="john@propcrm.com" />
              <Input label="Phone Number" value={newSales.phone} onChange={(e) => setNewSales({ ...newSales, phone: e.target.value })} placeholder="+91 00000 00000" />
              <Input label="Password" type="password" value={newSales.password} onChange={(e) => setNewSales({ ...newSales, password: e.target.value })} placeholder="••••••••" />
              <Select 
                label="System Role" 
                value={newSales.role} 
                onChange={(e) => setNewSales({ ...newSales, role: e.target.value })} 
                options={[
                  { value: 'Sales', label: 'Sales Executive' },
                  { value: 'Admin', label: 'Branch Admin' }
                ]} 
              />
              <Button onClick={createSalesUser} className="w-full mt-4">
                <UserPlus size={18} className="mr-2" />
                Create User Account
              </Button>
            </div>
          </Card>
        </div>

        {/* User List */}
        <div className="lg:col-span-2">
          <Card className="p-0 border-none shadow-sm ring-1 ring-slate-200 overflow-hidden">
            <ResponsiveTable
              columns={columns}
              data={filteredUsers}
              keyExtractor={(u) => u.id}
              isLoading={loading}
              emptyMessage="No users found matching your search."
              headerCellClassName="bg-slate-50/50"
            />
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      {editingId && (
        <ConfirmModal
          isOpen={!!editingId}
          onClose={() => setEditingId(null)}
          onConfirm={saveEdit}
          title="Edit User Profile"
          message={`Are you sure you want to update the profile for ${editForm.name}?`}
          confirmText="Save Changes"
          variant="info"
        >
          <div className="grid grid-cols-1 gap-4 mt-4 text-left">
            <Input label="Full Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            <Input label="Email Address" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            <Input label="Phone Number" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            <Input label="New Password (Optional)" type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} placeholder="Leave blank to keep current" />
          </div>
        </ConfirmModal>
      )}

      {/* Toggle Active Confirmation */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, user: null })}
        onConfirm={handleToggleActive}
        title={confirmModal.user?.active ? 'Deactivate User' : 'Activate User'}
        message={confirmModal.user?.active 
          ? `Are you sure you want to deactivate ${confirmModal.user?.name}? They will no longer be able to sign in to the system.`
          : `Are you sure you want to reactivate ${confirmModal.user?.name}? They will regain access to the system.`
        }
        confirmText={confirmModal.user?.active ? 'Deactivate' : 'Activate'}
        variant={confirmModal.user?.active ? 'danger' : 'info'}
      />
    </DataPageLayout>
  );
}
