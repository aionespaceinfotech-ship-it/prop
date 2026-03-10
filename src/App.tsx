import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import Leads from './pages/Leads';
import Clients from './pages/Clients';
import Visits from './pages/Visits';
import Deals from './pages/Deals';
import Reports from './pages/Reports';
import Projects from './pages/Projects';
import PublicCatalog from './pages/PublicCatalog';
import Settings from './pages/Settings';
import Support from './pages/Support';
import UserManagement from './pages/UserManagement';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <main className="flex-1 lg:ml-64 min-h-screen pb-20 lg:pb-0 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
      <BottomNav onMenuClick={() => setIsSidebarOpen(true)} />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <PrivateRoute>
                <Layout><Dashboard /></Layout>
              </PrivateRoute>
            } />
            <Route path="/properties" element={
              <PrivateRoute>
                <Layout><Properties /></Layout>
              </PrivateRoute>
            } />
            <Route path="/leads" element={
              <PrivateRoute>
                <Layout><Leads /></Layout>
              </PrivateRoute>
            } />
            <Route path="/projects" element={
              <PrivateRoute>
                <Layout><Projects /></Layout>
              </PrivateRoute>
            } />
            <Route path="/clients" element={
              <PrivateRoute>
                <Layout><Clients /></Layout>
              </PrivateRoute>
            } />
            <Route path="/visits" element={
              <PrivateRoute>
                <Layout><Visits /></Layout>
              </PrivateRoute>
            } />
            <Route path="/deals" element={
              <PrivateRoute>
                <Layout><Deals /></Layout>
              </PrivateRoute>
            } />
            <Route path="/reports" element={
              <PrivateRoute>
                <Layout><Reports /></Layout>
              </PrivateRoute>
            } />
            <Route path="/settings" element={
              <PrivateRoute>
                <Layout><Settings /></Layout>
              </PrivateRoute>
            } />
            <Route path="/support" element={
              <PrivateRoute>
                <Layout><Support /></Layout>
              </PrivateRoute>
            } />
            <Route path="/users" element={
              <PrivateRoute>
                <Layout><UserManagement /></Layout>
              </PrivateRoute>
            } />
            <Route path="/catalog" element={<PublicCatalog />} />
          </Routes>
        </Router>
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </QueryClientProvider>
  );
}
