import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Package, ShoppingCart, BarChart3, User, Layers, Tag, Handshake, RotateCcw, DollarSign } from 'lucide-react';
import { api } from '../api/client';

const PERM_LABELS: Record<string, { label: string; icon: typeof Package }> = {
  can_upload_products: { label: 'Upload Products', icon: Package },
  can_view_orders: { label: 'View Orders', icon: ShoppingCart },
  can_view_sales: { label: 'View Sales', icon: BarChart3 },
  can_view_account_details: { label: 'Account Details', icon: User },
  can_manage_categories: { label: 'Categories', icon: Layers },
  can_manage_tags: { label: 'Tags', icon: Tag },
  is_partnership_agent: { label: 'Partnership Agent', icon: Handshake },
};

type StaffMember = {
  id: number;
  user_id: number;
  email?: string;
  username?: string;
  permissions: Record<string, boolean>;
  created_at: string;
};

type StaffEarning = { staff_id: number; user_id: number; email?: string; username?: string; total: number; partnerships_count: number };

export function Staff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [users, setUsers] = useState<{ id: number; email: string; username: string }[]>([]);
  const [earnings, setEarnings] = useState<StaffEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [resettingId, setResettingId] = useState<number | null>(null);

  function load() {
    setLoading(true);
    Promise.all([api.staff.list(), api.users.list(), api.staffEarnings.summary()])
      .then(([s, u, e]) => {
        setStaff(s);
        setUsers(u);
        setEarnings(e.staff || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  function getEarnings(staffId: number): StaffEarning | undefined {
    return earnings.find((x) => x.staff_id === staffId);
  }

  function handleResetEarnings(staffId: number) {
    if (!confirm('Reset this staff member\'s earnings to zero? Use this after paying them out.')) return;
    setResettingId(staffId);
    setError('');
    api.staffEarnings
      .reset(staffId)
      .then(() => load())
      .catch((e) => setError(e.message))
      .finally(() => setResettingId(null));
  }

  useEffect(() => load(), []);

  const staffUserIds = staff.map((s) => s.user_id);
  const availableUsers = users.filter((u) => !staffUserIds.includes(u.id) || (editing && u.id === editing.user_id));

  function togglePerm(key: string) {
    setPermissions((p) => ({ ...p, [key]: !p[key] }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const perms = Object.keys(PERM_LABELS).filter((k) => permissions[k]);
    if (editing) {
      api.staff
        .update(editing.id, { permissions: perms })
        .then(() => {
          setEditing(null);
          resetForm();
          load();
        })
        .catch((e) => setError(e.message));
    } else {
      if (!selectedUserId) return setError('Select a user');
      api.staff
        .create({ user_id: Number(selectedUserId), permissions: perms })
        .then(() => {
          setShowForm(false);
          resetForm();
          load();
        })
        .catch((e) => setError(e.message));
    }
  }

  function resetForm() {
    setSelectedUserId('');
    setPermissions({});
  }

  function handleEdit(s: StaffMember) {
    setEditing(s);
    setSelectedUserId(s.user_id);
    setPermissions({ ...s.permissions });
    setShowForm(true);
  }

  function handleDelete(id: number) {
    if (!confirm('Remove this staff member?')) return;
    api.staff.delete(id).then(load).catch((e) => setError(e.message));
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold font-display">Staff Accounts</h1>
        <button
          onClick={() => {
            setEditing(null);
            resetForm();
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 bg-accent text-bg-primary px-4 py-2 rounded-full font-medium hover:bg-accent-hover border border-accent transition-colors"
        >
          <Plus size={20} />
          Add Staff
        </button>
      </div>

      {error && <p className="mb-4 text-red-400 text-sm">{error}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-bg-card rounded-xl border border-border-primary">
          {!editing && (
            <>
              <label className="block mb-2 text-text-secondary text-sm">User</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : '')}
                className="w-full max-w-md bg-bg-tertiary border border-border-primary rounded-lg py-2 px-4 text-text-primary mb-4"
                required={!editing}
              >
                <option value="">Select user...</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email} ({u.username})
                  </option>
                ))}
              </select>
            </>
          )}

          <label className="block mb-2 text-text-secondary text-sm">Permissions</label>
          <div className="flex flex-wrap gap-3 mb-4">
            {Object.entries(PERM_LABELS).map(([key, { label, icon: Icon }]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!permissions[key]}
                  onChange={() => togglePerm(key)}
                  className="rounded border-border-primary"
                />
                <Icon size={16} className="text-text-muted" />
                <span>{label}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-2">
            <button type="submit" className="bg-accent text-bg-primary px-4 py-2 rounded-full font-medium border border-accent">
              {editing ? 'Update' : 'Add Staff'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditing(null);
                resetForm();
              }}
              className="border border-border-primary px-4 py-2 rounded-full"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-bg-card rounded-xl border border-border-primary overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-text-muted">Loading...</div>
        ) : staff.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No staff yet. Add staff above.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-bg-tertiary border-b border-border-primary">
              <tr>
                <th className="p-4 font-medium text-text-secondary">User</th>
                <th className="p-4 font-medium text-text-secondary">Permissions</th>
                <th className="p-4 font-medium text-text-secondary">Earnings</th>
                <th className="p-4 font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {staff.map((s) => {
                const e = getEarnings(s.id);
                const total = e?.total ?? 0;
                const partnershipsCount = e?.partnerships_count ?? 0;
                return (
                  <tr key={s.id} className="hover:bg-bg-hover transition-colors">
                    <td className="p-4">
                      <p className="font-medium">{s.email || '—'}</p>
                      <p className="text-sm text-text-muted">{s.username || '—'}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(s.permissions || {})
                          .filter(([, v]) => v)
                          .map(([k]) => (
                            <span key={k} className="px-2 py-1 rounded-full text-xs bg-accent/20 text-accent">
                              {PERM_LABELS[k]?.label || k}
                            </span>
                          ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <DollarSign size={16} className="text-accent" />
                        <span className="font-medium text-accent">R$ {total.toLocaleString()}</span>
                        <span className="text-text-muted text-sm">({partnershipsCount} partnerships)</span>
                      </div>
                    </td>
                    <td className="p-4 flex gap-2">
                      <button onClick={() => handleEdit(s)} className="p-2 text-text-muted hover:text-accent" title="Edit">
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleResetEarnings(s.id)}
                        disabled={resettingId === s.id || total === 0}
                        className="p-2 text-text-muted hover:text-amber-500 disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Reset earnings (after payout)"
                      >
                        <RotateCcw size={18} />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="p-2 text-text-muted hover:text-red-400" title="Remove staff">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
