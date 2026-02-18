import { useState, useEffect } from 'react';
import { api } from '../api/client';

type Log = { id: number; order_id: number; product_id: number; product_name: string; user_email: string; source: string; created_at: string };

export function Downloads() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.downloads.list()
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Downloads</h1>
      <p className="text-text-secondary text-sm mb-4">
        File downloads from checkout (after payment) and account management (purchases page).
      </p>
      <div className="bg-bg-card rounded-xl border border-border-primary overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-text-muted">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No downloads recorded yet.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-bg-tertiary border-b border-border-primary">
              <tr>
                <th className="p-4 font-medium text-text-secondary">Date</th>
                <th className="p-4 font-medium text-text-secondary">User</th>
                <th className="p-4 font-medium text-text-secondary">Product</th>
                <th className="p-4 font-medium text-text-secondary">Order</th>
                <th className="p-4 font-medium text-text-secondary">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-bg-hover transition-colors">
                  <td className="p-4 text-text-secondary text-sm">
                    {new Date(l.created_at).toLocaleString()}
                  </td>
                  <td className="p-4 text-text-primary">{l.user_email}</td>
                  <td className="p-4 text-text-primary">{l.product_name}</td>
                  <td className="p-4 text-text-secondary">#{l.order_id}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded ${l.source === 'checkout' ? 'bg-accent/20 text-accent' : 'bg-bg-tertiary text-text-muted'}`}>
                      {l.source || 'checkout'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
