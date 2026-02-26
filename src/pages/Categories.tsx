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
          className="flex items-center gap-2 bg-gradient-to-r from-accent to-accent-hover text-bg-primary px-6 py-2.5 rounded-full font-bold hover:shadow-lg hover:shadow-accent/20 hover:-translate-y-0.5 transition-all"
        >
          <Plus size={20} strokeWidth={2.5} />
          Add Category
        </button>
      </div>

      {error && <p className="mb-4 text-red-400 text-sm">{error}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-bg-card rounded-3xl border border-border-light shadow-sm">
          <label className="block mb-2 text-text-secondary text-sm font-bold uppercase tracking-wider">Category Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full max-w-md bg-bg-primary border border-border-light rounded-2xl py-3 px-5 text-text-primary mb-5 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all shadow-inner"
            placeholder="e.g. Aircraft"
            required
          />
          
          <label className="block mb-2 text-text-secondary text-sm font-bold uppercase tracking-wider">Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full max-w-md bg-bg-primary border border-border-light rounded-2xl py-3 px-5 text-text-primary mb-5 h-24 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all shadow-inner resize-none"
            placeholder="Short description for the landing page..."
          />

          <label className="block mb-2 text-text-secondary text-sm font-bold uppercase tracking-wider">Icon Image (Optional)</label>
          <div className="flex items-center gap-4 mb-6">
            {iconUrl && <img src={iconUrl} alt="Icon preview" className="w-14 h-14 object-contain bg-bg-primary rounded-2xl p-2 shadow-inner" />}
            <label className="cursor-pointer flex items-center gap-2 px-5 py-3 bg-bg-tertiary border border-border-light rounded-2xl hover:bg-bg-hover transition-all shadow-sm hover:shadow-md font-medium">
              <Upload size={18} />
              <span>{uploading ? 'Uploading...' : 'Upload Icon'}</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="bg-gradient-to-r from-accent to-accent-hover text-white px-6 py-2.5 rounded-full font-bold shadow-md hover:shadow-lg hover:shadow-accent/20 hover:-translate-y-0.5 transition-all" disabled={uploading}>
              {editing ? 'Update Category' : 'Create Category'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditing(null);
                resetForm();
              }}
              className="bg-bg-tertiary text-text-primary px-6 py-2.5 rounded-full font-bold hover:bg-bg-hover transition-all shadow-sm hover:shadow-md"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-bg-card rounded-3xl border border-border-light overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-text-muted">Loading...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No categories found.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-bg-tertiary/50 border-b border-border-light">
              <tr>
                <th className="p-5 font-semibold text-text-secondary text-sm tracking-wider uppercase w-20">Icon</th>
                <th className="p-5 font-semibold text-text-secondary text-sm tracking-wider uppercase">Name</th>
                <th className="p-5 font-semibold text-text-secondary text-sm tracking-wider uppercase">Description</th>
                <th className="p-5 font-semibold text-text-secondary text-sm tracking-wider uppercase">Slug</th>
                <th className="p-5 font-semibold text-text-secondary text-sm tracking-wider uppercase">Products</th>
                <th className="p-5 font-semibold text-text-secondary text-sm tracking-wider uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-bg-hover transition-colors group">
                  <td className="p-5">
                    {c.icon_url ? (
                      <img src={c.icon_url} alt={c.name} className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" />
                    ) : (
                      <div className="w-10 h-10 bg-bg-tertiary rounded-xl shadow-inner"></div>
                    )}
                  </td>
                  <td className="p-5 font-bold text-text-primary">{c.name}</td>
                  <td className="p-5 text-text-muted text-sm truncate max-w-xs font-medium">{c.description}</td>
                  <td className="p-5"><span className="text-text-muted text-sm font-medium bg-bg-tertiary px-3 py-1.5 rounded-[14px]">{c.slug}</span></td>
                  <td className="p-5 font-bold text-accent">{c.product_count}</td>
                  <td className="p-5 flex gap-2">
                    <button
                      onClick={() => {
                        setEditing(c);
                        setName(c.name);
                        setDescription(c.description || '');
                        setIconUrl(c.icon_url || '');
                        setShowForm(true);
                      }}
                      className="p-2.5 bg-bg-tertiary rounded-xl text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                    >
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-2.5 bg-bg-tertiary rounded-xl text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors">
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
