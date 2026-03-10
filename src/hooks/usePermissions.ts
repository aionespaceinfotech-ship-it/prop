import { useAuth } from '../contexts/AuthContext';

export function usePermissions() {
  const { user } = useAuth();

  const role = user?.role;

  return {
    // Role checks
    isSuperAdmin: role === 'Super Admin',
    isAdmin: role === 'Admin',
    isSales: role === 'Sales',
    
    // Abstract permissions
    isManager: role === 'Admin' || role === 'Super Admin',
    canManageUsers: role === 'Admin' || role === 'Super Admin',
    canEditProperties: role === 'Admin' || role === 'Super Admin',
    canDeleteEntities: role === 'Super Admin',
    
    // Scoping logic
    shouldSeeAllLeads: role === 'Admin' || role === 'Super Admin',
    shouldSeeOnlyAssignedLeads: role === 'Sales',
    
    // Metadata
    currentRole: role,
    userName: user?.name,
  };
}
