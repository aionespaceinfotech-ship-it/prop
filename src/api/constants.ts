export const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';
export const isAdminRole = (role?: string) => role === 'Admin' || role === 'Super Admin';
