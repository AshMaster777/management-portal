import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { api } from '../api/client';

const ADMIN_STORAGE_KEY = 'admin_auth';

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(() =>
    sessionStorage.getItem(ADMIN_STORAGE_KEY) === '1'
  );
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.verifyAdminPassword(password);
      sessionStorage.setItem(ADMIN_STORAGE_KEY, '1');
      setAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid password');
      setLoading(false);
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary text-text-primary p-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/25 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="w-full max-w-sm rounded-3xl border border-border-light bg-bg-card p-8 shadow-2xl relative z-10">
          <div className="w-14 h-14 bg-accent/30 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-inner">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-center mb-8 tracking-tight">Admin Access</h1>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-rose-500/15 border border-rose-500/25 rounded-2xl text-center">
                <p className="text-sm font-semibold text-rose-300">{error}</p>
              </div>
            )}
            <div>
              <label htmlFor="admin-password" className="block text-sm font-bold text-text-secondary mb-2 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                  autoFocus
                  disabled={loading}
                  className="w-full px-4 py-3.5 pr-12 rounded-2xl border border-border-light bg-bg-primary text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-text-muted hover:text-accent rounded-lg transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-accent text-[#0f0f14] font-bold hover:bg-accent-hover transition-all disabled:opacity-50 shadow-md shadow-accent/20"
            >
              {loading ? 'Verifying…' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
