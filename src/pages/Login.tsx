import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { LogIn, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e?: React.FormEvent, credentials?: { email: string, password: string }) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    const loginEmail = credentials ? credentials.email : email;
    const loginPassword = credentials ? credentials.password : password;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      login(data.token, data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    handleSubmit(undefined, { email: demoEmail, password: demoPassword });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mb-4">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">PropBroker CRM</h1>
          <p className="text-slate-500">Sign in to manage your brokerage</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              placeholder="admin@propcrm.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : (
              <>
                <LogIn size={18} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 text-center">One-Click Demo Login</p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => handleDemoLogin('superadmin@propcrm.com', 'admin123')}
              className="px-3 py-2 text-[10px] font-medium text-slate-600 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg border border-slate-200 hover:border-emerald-200 transition-all text-center"
            >
              Super Admin
            </button>
            <button
              onClick={() => handleDemoLogin('rahul@propcrm.com', 'admin123')}
              className="px-3 py-2 text-[10px] font-medium text-slate-600 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg border border-slate-200 hover:border-emerald-200 transition-all text-center"
            >
              Admin (Rahul)
            </button>
            <button
              onClick={() => handleDemoLogin('amit@propcrm.com', 'broker123')}
              className="px-3 py-2 text-[10px] font-medium text-slate-600 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg border border-slate-200 hover:border-emerald-200 transition-all text-center"
            >
              Sales (Amit)
            </button>
            <button
              onClick={() => handleDemoLogin('neha@propcrm.com', 'broker123')}
              className="px-3 py-2 text-[10px] font-medium text-slate-600 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg border border-slate-200 hover:border-emerald-200 transition-all text-center"
            >
              Sales (Neha)
            </button>
          </div>

          <p className="text-[10px] text-slate-400 text-center">
            Credentials: superadmin@propcrm.com / admin123
          </p>
        </div>
      </motion.div>
    </div>
  );
}
