import { useState, useEffect } from 'react';
import { Plus, Pencil, Package } from 'lucide-react';
import { api } from '../api/client';

type Developer = { id: number; email: string; name: string; revenue_percent: number; created_at: string };

export function Developers() {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [productsByDev, setProductsByDev] = useState<Record<number, { id: number; name: string }[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formName, setFormName] = useState('');
  const [formPercent, setFormPercent] = useState(30);
  const [editPercent, setEditPercent] = useState(30);
  const [editPassword, setEditPassword] = useState('');

  function load() {
    setLoading(true);
    api.developers
      .list()
      .then((list) => {
        setDevelopers(list);
        return Promise.all(list.map((d) => api.developers.getProducts(d.id).then((prods: { id: number; name: string }[]) => ({ id: d.id, prods }))));
      })
      .then((pairs: { id: number; prods: { id: number; name: string }[] }[]) => {
        const map: Record<number, { id: number; name: string }[]> = {};
        pairs.forEach(({ id, prods }) => (map[id] = prods));
        setProductsByDev(map);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => load(), []);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    api.developers
      .create({ email: formEmail, password: formPassword, name: formName || undefined, revenue_percent: formPercent })
      .then(() => {
        setShowForm(false);
        setFormEmail('');
        setFormPassword('');
        setFormName('');
        setFormPercent(30);
        load();
      })
      .catch((e) => setError(e.message));
  }

  function handleUpdate(id: number, e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const data: { name?: string; revenue_percent?: number; password?: string } = { revenue_percent: editPercent };
    if (editPassword) data.password = editPassword;
    api.developers
      .update(id, data)
      .then(() => {
        setEditingId(null);
        setEditPassword('');
        load();
      })
      .catch((e) => setError(e.message));
  }

  const developerPortalUrl = typeof window !== 'undefined' ? `${window.location.origin.replace(/:\d+$/, ':4176')}/` : 'http://localhost:4176/';

  return (
    <div>
      <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-200 text-sm">
        <strong>Developer login:</strong> Developers sign in at the <strong>Developer Portal</strong>, not this admin panel. Open{' '}
        <a href={developerPortalUrl} target="_blank" rel="noopener noreferrer" className="underline font-medium">{developerPortalUrl}</a> and use the email and password you set below.
      </div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold font-display">Developers</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-accent text-bg-primary px-4 py-2 rounded-full font-medium hover:bg-accent-hover"
        >
          <Plus size={18} />
          Add Developer
        </button>
      </div>

      {error && <p className="mb-4 text-red-400 text-sm">{error}</p>}

      {showForm && (
        <form onSubmit={handleAdd} className="mb-6 p-4 bg-bg-card rounded-xl border border-border-primary max-w-md">
          <h3 className="font-semibold mb-4">New developer</h3>
          <div className="space-y-3">
            <label className="block">
              <span className="text-text-secondary text-sm">Email</span>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
                className="w-full mt-1 bg-bg-tertiary border border-border-primary rounded-lg py-2 px-4 text-text-primary"
              />
            </label>
            <label className="block">
              <span className="text-text-secondary text-sm">Password (for developer login)</span>
              <input
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                required
                minLength={1}
                className="w-full mt-1 bg-bg-tertiary border border-border-primary rounded-lg py-2 px-4 text-text-primary"
              />
            </label>
            <label className="block">
              <span className="text-text-secondary text-sm">Name</span>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Optional"
                className="w-full mt-1 bg-bg-tertiary border border-border-primary rounded-lg py-2 px-4 text-text-primary"
              />
            </label>
            <label className="block">
              <span className="text-text-secondary text-sm">Revenue share %</span>
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={formPercent}
                onChange={(e) => setFormPercent(Number(e.target.value) || 0)}
                className="w-full mt-1 bg-bg-tertiary border border-border-primary rounded-lg py-2 px-4 text-text-primary"
              />
            </label>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="bg-accent text-bg-primary px-4 py-2 rounded-full font-medium">
              Create
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="border border-border-primary px-4 py-2 rounded-full">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-bg-card rounded-xl border border-border-primary overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-text-muted">Loading...</div>
        ) : developers.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No developers yet. Add one to assign to products and set revenue share.</div>
        ) : (
          <div className="divide-y divide-border-primary">
            {developers.map((d) => (
              <div key={d.id} className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-text-primary">{d.name || d.email}</p>
                    <p className="text-sm text-text-muted">{d.email}</p>
                    <p className="text-sm mt-1 text-accent">Revenue share: {d.revenue_percent}%</p>
                    {(productsByDev[d.id]?.length ?? 0) > 0 && (
                      <div className="flex items-center gap-2 mt-2 text-text-secondary text-sm">
                        <Package size={16} />
                        <span>{(productsByDev[d.id]?.length ?? 0)} product(s)</span>
                        <span className="text-text-muted">
                          ({productsByDev[d.id]?.map((p) => p.name).join(', ')})
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {editingId === d.id ? (
                      <form onSubmit={(e) => handleUpdate(d.id, e)} className="flex flex-wrap items-end gap-2">
                        <label className="block">
                          <span className="text-xs text-text-muted">Revenue %</span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={editPercent}
                            onChange={(e) => setEditPercent(Number(e.target.value) || 0)}
                            className="w-20 mt-1 bg-bg-tertiary border border-border-primary rounded py-1 px-2 text-text-primary text-sm"
                          />
                        </label>
                        <label className="block">
                          <span className="text-xs text-text-muted">New password</span>
                          <input
                            type="password"
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            placeholder="Leave blank to keep"
                            className="w-32 mt-1 bg-bg-tertiary border border-border-primary rounded py-1 px-2 text-text-primary text-sm"
                          />
                        </label>
                        <button type="submit" className="bg-accent text-bg-primary px-3 py-1.5 rounded text-sm">
                          Save
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} className="border border-border-primary px-3 py-1.5 rounded text-sm">
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(d.id);
                          setEditPercent(d.revenue_percent);
                          setEditPassword('');
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border-primary hover:bg-bg-hover"
                      >
                        <Pencil size={16} />
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
