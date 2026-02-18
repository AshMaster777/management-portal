import { useState, useEffect } from 'react';
import { api } from '../api/client';

type User = { id: number; email: string; username: string; discord_username?: string; wallet_credits: number; blocked: boolean; created_at: string };

export function AccountDetails() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<User | null>(null);
  const [editWallet, setEditWallet] = useState('');
  const [addAmount, setAddAmount] = useState('');
  const [editBlocked, setEditBlocked] = useState(false);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    return api.users.list()
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (selected) {
      setEditWallet(String(selected.wallet_credits ?? 0));
      setAddAmount('');
      setEditBlocked(selected.blocked ?? false);
    }
  }, [selected]);

  function handleSave() {
    if (!selected) return;
    setSaving(true);
    api.users.update(selected.id, {
      wallet_credits: parseFloat(editWallet) || 0,
      blocked: editBlocked,
    })
      .then(() => api.users.list())
      .then((freshUsers) => {
        setUsers(freshUsers);
        const updated = freshUsers.find((u) => u.id === selected.id);
        if (updated) setSelected(updated);
        setEditWallet(String((updated?.wallet_credits ?? parseFloat(editWallet)) || 0));
      })
      .catch(alert)
      .finally(() => setSaving(false));
  }

  function handleAddCredits() {
    if (!selected) return;
    const amount = parseFloat(addAmount) || 0;
    if (amount <= 0) {
      alert('Enter a positive amount to add.');
      return;
    }
    setSaving(true);
    const newTotal = (selected.wallet_credits ?? 0) + amount;
    api.users.update(selected.id, { wallet_credits: newTotal })
      .then(() => api.users.list())
      .then((freshUsers) => {
        setUsers(freshUsers);
        const updated = freshUsers.find((u) => u.id === selected.id);
        if (updated) setSelected(updated);
        setAddAmount('');
      })
      .catch(alert)
      .finally(() => setSaving(false));
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Account Details</h1>
      <p className="text-text-secondary text-sm mb-4">
        All registered accounts. Select a user to manage wallet, block status, and more.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="bg-bg-card rounded-xl border border-border-primary overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-text-muted">Loading...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-text-muted">No users yet.</div>
          ) : (
            <div className="divide-y divide-border-primary max-h-[500px] overflow-y-auto">
              {users.map((u) => (
                <div
                  key={u.id}
                  onClick={() => setSelected(u)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-bg-hover ${
                    selected?.id === u.id ? 'bg-accent/10' : ''
                  }`}
                >
                  <div className="font-medium text-text-primary">{u.email}</div>
                  <div className="text-sm text-text-muted">{u.username} | Wallet: R$ {(u.wallet_credits ?? 0).toLocaleString()}</div>
                  {u.blocked && <span className="text-xs text-red-400">Blocked</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {selected && (
          <div className="bg-bg-card rounded-xl border border-border-primary p-6">
            <h2 className="text-lg font-semibold mb-4">Manage User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">Email</label>
                <div className="text-text-primary">{selected.email}</div>
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Wallet Credits (Robux - set total)</label>
                <input
                  type="number"
                  value={editWallet}
                  onChange={(e) => setEditWallet(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border-primary rounded-lg py-2 px-4 text-text-primary"
                  min="0"
                  step="1"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Add Robux (quick add)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    placeholder="Amount to add"
                    className="flex-1 bg-bg-tertiary border border-border-primary rounded-lg py-2 px-4 text-text-primary"
                    min="0"
                    step="1"
                  />
                  <button
                    onClick={handleAddCredits}
                    disabled={saving}
                    className="bg-accent text-bg-primary px-4 py-2 rounded-full font-medium hover:bg-accent-hover disabled:opacity-50 border border-accent whitespace-nowrap"
                  >
                    {saving ? '...' : 'Add'}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="blocked"
                  checked={editBlocked}
                  onChange={(e) => setEditBlocked(e.target.checked)}
                />
                <label htmlFor="blocked" className="text-sm text-text-secondary">Block user</label>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-accent text-bg-primary px-4 py-2 rounded-full font-medium hover:bg-accent-hover disabled:opacity-50 border border-accent"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setSelected(null)}
                  className="border border-border-primary px-4 py-2 rounded-full text-text-secondary hover:text-text-primary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
