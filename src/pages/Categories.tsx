import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Upload } from 'lucide-react';
import { api } from '../api/client';

export function Categories() {
  const [categories, setCategories] = useState<{ id: number; slug: string; name: string; product_count: number; icon_url?: string; description?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<{ id: number; name: string; icon_url?: string; description?: string } | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  function load() {
    setLoading(true);
    api.categories
      .list()
      .then(setCategories)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => load(), []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setUploading(true);
      api.categories.uploadIcon(e.target.files[0])
        .then((res) => setIconUrl(res.url))
        .catch((e) => setError(e.message))
        .finally(() => setUploading(false));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (editing) {
      api.categories
        .update(editing.id, { name: name.trim(), icon_url: iconUrl, description: description.trim() })
        .then(() => {
          setEditing(null);
          resetForm();
          load();
        })
        .catch((e) => setError(e.message));
    } else {
      // @ts-ignore
      api.categories.create({ name: name.trim(), icon_url: iconUrl, description: description.trim() })
        .then(() => {
          setShowForm(false);
          resetForm();
          load();
        })
        .catch((e) => setError(e.message));
    }
  }

  function resetForm() {
    setName('');
    setDescription('');
    setIconUrl('');
  }

  function handleDelete(id: number) {
    if (!confirm('Delete this category?')) return;
    api.categories
      .delete(id)
      .then(load)
      .catch((e) => setError(e.message));
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold font-display">Categories</h1>
        <button
          onClick={() => {
            setEditing(null);
            resetForm();
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 bg-accent text-bg-primary px-4 py-2 rounded-full font-medium hover:bg-accent-hover border border-accent transition-colors"
        >
          <Plus size={20} />
          Add Category
        </button>
      </div>

      {error && <p className="mb-4 text-red-400 text-sm">{error}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-bg-card rounded-xl border border-border-primary">
          <label className="block mb-2 text-text-secondary text-sm">Category Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full max-w-md bg-bg-tertiary border border-border-primary rounded-lg py-2 px-4 text-text-primary mb-3"
            placeholder="e.g. Aircraft"
            required
          />
          
          <label className="block mb-2 text-text-secondary text-sm">Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full max-w-md bg-bg-tertiary border border-border-primary rounded-lg py-2 px-4 text-text-primary mb-3 h-20"
            placeholder="Short description for the landing page..."
          />

          <label className="block mb-2 text-text-secondary text-sm">Icon Image (Optional)</label>
          <div className="flex items-center gap-4 mb-4">
            {iconUrl && <img src={iconUrl} alt="Icon preview" className="w-12 h-12 object-contain bg-bg-tertiary rounded p-1" />}
            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-bg-tertiary border border-border-primary rounded-lg hover:bg-bg-hover transition-colors">
              <Upload size={16} />
              <span>{uploading ? 'Uploading...' : 'Upload Icon'}</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
          </div>

          <div className="mt-3 flex gap-2">
            <button type="submit" className="bg-accent text-bg-primary px-4 py-2 rounded-full font-medium border border-accent" disabled={uploading}>
              {editing ? 'Update' : 'Create'}
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
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No categories found.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-bg-tertiary border-b border-border-primary">
              <tr>
                <th className="p-4 font-medium text-text-secondary w-16">Icon</th>
                <th className="p-4 font-medium text-text-secondary">Name</th>
                <th className="p-4 font-medium text-text-secondary">Description</th>
                <th className="p-4 font-medium text-text-secondary">Slug</th>
                <th className="p-4 font-medium text-text-secondary">Products</th>
                <th className="p-4 font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-bg-hover transition-colors">
                  <td className="p-4">
                    {c.icon_url ? (
                      <img src={c.icon_url} alt={c.name} className="w-8 h-8 object-contain" />
                    ) : (
                      <div className="w-8 h-8 bg-bg-tertiary rounded"></div>
                    )}
                  </td>
                  <td className="p-4 font-medium">{c.name}</td>
                  <td className="p-4 text-text-muted text-sm truncate max-w-xs">{c.description}</td>
                  <td className="p-4 text-text-muted text-sm">{c.slug}</td>
                  <td className="p-4 text-text-muted text-sm">{c.product_count}</td>
                  <td className="p-4 flex gap-2">
                    <button
                      onClick={() => {
                        setEditing(c);
                        setName(c.name);
                        setDescription(c.description || '');
                        setIconUrl(c.icon_url || '');
                        setShowForm(true);
                      }}
                      className="p-2 text-text-muted hover:text-accent"
                    >
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-2 text-text-muted hover:text-red-400">
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
