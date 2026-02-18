import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../api/client';

export function Tags() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<{ id: number; name: string } | null>(null);
  const [name, setName] = useState('');

  function load() {
    setLoading(true);
    api.tags
      .list()
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => load(), []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (editing) {
      api.tags
        .update(editing.id, { name: name.trim() })
        .then(() => {
          setEditing(null);
          setName('');
          load();
        })
        .catch((e) => setError(e.message));
    } else {
      api.tags
        .create({ name: name.trim() })
        .then(() => {
          setName('');
          setShowForm(false);
          load();
        })
        .catch((e) => setError(e.message));
    }
  }

  function handleDelete(id: number) {
    if (!confirm('Delete this tag?')) return;
    api.tags
      .delete(id)
      .then(load)
      .catch((e) => setError(e.message));
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold font-display">Tags</h1>
        <button
          onClick={() => {
            setEditing(null);
            setName('');
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 bg-accent text-bg-primary px-4 py-2 rounded-full font-medium hover:bg-accent-hover border border-accent transition-colors"
        >
          <Plus size={20} />
          Add Tag
        </button>
      </div>

      {error && <p className="mb-4 text-red-400 text-sm">{error}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-bg-card rounded-xl border border-border-primary">
          <label className="block mb-2 text-text-secondary text-sm">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full max-w-md bg-bg-tertiary border border-border-primary rounded-lg py-2 px-4 text-text-primary"
            placeholder="Tag name"
            required
          />
          <div className="mt-3 flex gap-2">
            <button type="submit" className="bg-accent text-bg-primary px-4 py-2 rounded-full font-medium border border-accent">
              {editing ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); setName(''); }} className="border border-border-primary px-4 py-2 rounded-full">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-bg-card rounded-xl border border-border-primary overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-text-muted">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No tags yet. Add one to get started.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-bg-tertiary border-b border-border-primary">
              <tr>
                <th className="p-4 font-medium text-text-secondary">Name</th>
                <th className="p-4 font-medium text-text-secondary">Slug</th>
                <th className="p-4 font-medium text-text-secondary">Products</th>
                <th className="p-4 font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {items.map((t) => (
                <tr key={t.id} className="hover:bg-bg-hover transition-colors">
                  <td className="p-4 font-medium">{t.name}</td>
                  <td className="p-4 text-text-muted">{t.slug}</td>
                  <td className="p-4">{t.product_count}</td>
                  <td className="p-4 flex gap-2">
                    <button
                      onClick={() => {
                        setEditing({ id: t.id, name: t.name });
                        setName(t.name);
                        setShowForm(true);
                      }}
                      className="p-2 text-text-muted hover:text-accent"
                    >
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="p-2 text-text-muted hover:text-red-400">
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
