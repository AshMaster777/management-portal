import { useState, useEffect } from 'react';
import { Plus, Trash2, Coins } from 'lucide-react';
import { api } from '../api/client';

type CreditPackage = {
  id: number;
  name: string;
  credits: number;
  price_usd: number;
  roblox_product_id: string | null;
};

export function Credits() {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [credits, setCredits] = useState('');
  const [priceUsd, setPriceUsd] = useState('');
  const [robloxProductId, setRobloxProductId] = useState('');

  function load() {
    setLoading(true);
    api.creditPackages
      .list()
      .then(setPackages)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => load(), []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim() || !credits) {
      setError('Name and credits are required.');
      return;
    }
    api.creditPackages
      .create({
        name: name.trim(),
        credits: parseInt(credits, 10) || 0,
        price_usd: parseFloat(priceUsd) || 0,
        roblox_product_id: robloxProductId.trim() || undefined,
      })
      .then(() => {
        setName('');
        setCredits('');
        setPriceUsd('');
        setRobloxProductId('');
        setShowForm(false);
        load();
      })
      .catch((e) => setError(e.message));
  }

  function handleDelete(id: number) {
    if (!confirm('Delete this credit package?')) return;
    api.creditPackages
      .delete(id)
      .then(load)
      .catch((e) => setError(e.message));
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold font-display">Credit Packages</h1>
          <p className="text-text-muted text-sm mt-1">
            Manage Robux credit packs shown in the Roblox game. Add the Roblox Developer Product ID and credits amount.
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setError('');
          }}
          className="flex items-center gap-2 bg-accent text-bg-primary px-4 py-2 rounded-full font-medium hover:bg-accent-hover border border-accent transition-colors"
        >
          <Plus size={20} />
          Add Package
        </button>
      </div>

      {error && <p className="mb-4 text-red-400 text-sm">{error}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-6 bg-bg-card rounded-xl border border-border-primary">
          <h2 className="text-lg font-semibold mb-4">New Credit Package</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-text-secondary text-sm">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-bg-tertiary border border-border-primary rounded-lg py-2 px-4 text-text-primary"
                placeholder="e.g. 100 Robux Credits"
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-text-secondary text-sm">Credits (Robux)</label>
              <input
                type="number"
                min="1"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                className="w-full bg-bg-tertiary border border-border-primary rounded-lg py-2 px-4 text-text-primary"
                placeholder="100"
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-text-secondary text-sm">Price (USD) – optional</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={priceUsd}
                onChange={(e) => setPriceUsd(e.target.value)}
                className="w-full bg-bg-tertiary border border-border-primary rounded-lg py-2 px-4 text-text-primary"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block mb-2 text-text-secondary text-sm">Roblox Product ID – required for in-game purchase</label>
              <input
                value={robloxProductId}
                onChange={(e) => setRobloxProductId(e.target.value)}
                className="w-full bg-bg-tertiary border border-border-primary rounded-lg py-2 px-4 text-text-primary"
                placeholder="e.g. 3539056586"
              />
              <p className="text-xs text-text-muted mt-1">
                Add this product ID to ROBLOX_PRODUCT_CREDITS in backend .env (e.g. 3539056586:100)
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="bg-accent text-bg-primary px-4 py-2 rounded-full font-medium hover:bg-accent-hover">
              Add Package
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="border border-border-primary px-4 py-2 rounded-full text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-bg-card rounded-xl border border-border-primary overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-text-muted">Loading...</div>
        ) : packages.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            No credit packages yet.{' '}
            <button onClick={() => setShowForm(true)} className="text-accent hover:underline">
              Add your first package
            </button>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-bg-tertiary border-b border-border-primary">
              <tr>
                <th className="p-4 font-medium text-text-secondary">Name</th>
                <th className="p-4 font-medium text-text-secondary">Credits</th>
                <th className="p-4 font-medium text-text-secondary">Price (USD)</th>
                <th className="p-4 font-medium text-text-secondary">Roblox Product ID</th>
                <th className="p-4 font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-bg-hover transition-colors">
                  <td className="p-4 font-medium flex items-center gap-2">
                    <Coins size={18} className="text-accent" />
                    {pkg.name}
                  </td>
                  <td className="p-4">R$ {pkg.credits.toLocaleString()}</td>
                  <td className="p-4">${pkg.price_usd?.toFixed(2) ?? '0.00'}</td>
                  <td className="p-4 text-text-muted font-mono text-sm">{pkg.roblox_product_id || '–'}</td>
                  <td className="p-4">
                    <button
                      onClick={() => handleDelete(pkg.id)}
                      className="p-2 text-text-muted hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
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
