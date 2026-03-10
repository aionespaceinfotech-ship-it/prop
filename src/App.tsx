import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
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

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 lg:ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
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
    </AuthProvider>
  );
}
