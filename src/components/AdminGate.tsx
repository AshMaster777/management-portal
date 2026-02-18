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
      <div className="min-h-screen flex items-center justify-center bg-bg-primary text-text-primary p-6">
        <div className="w-full max-w-sm rounded-lg border border-border bg-bg-card p-8">
          <h1 className="text-xl font-semibold text-center mb-6">Admin Access</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-text-secondary mb-1">
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
                  className="w-full px-3 py-2 pr-10 rounded-md border border-border bg-bg-primary text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-text-muted hover:text-text-primary rounded transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
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
