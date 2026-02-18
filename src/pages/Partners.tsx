import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Upload } from 'lucide-react';
import { api } from '../api/client';

const MEDIA_BASE = import.meta.env.VITE_PRODUCT_RESOURCES_URL || '/productresources';

type Partner = { id: number; name: string; logo_url: string | null; link: string | null };

export function Partners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [link, setLink] = useState('');
  const [uploading, setUploading] = useState(false);

  function load() {
    setLoading(true);
    api.partners
      .list()
      .then(setPartners)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => load(), []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setUploading(true);
      api.partners
        .uploadLogo(e.target.files[0])
        .then((res: { url: string }) => setLogoUrl(res.url))
        .catch((e) => setError(e.message))
        .finally(() => setUploading(false));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (editing) {
      api.partners
        .update(editing.id, { name: name.trim(), logo_url: logoUrl || undefined, link: link.trim() || undefined })
        .then(() => {
          setEditing(null);
          resetForm();
          load();
        })
        .catch((e) => setError(e.message));
    } else {
      api.partners
        .create({ name: name.trim(), logo_url: logoUrl || undefined, link: link.trim() || undefined })
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
    setLogoUrl('');
    setLink('');
  }

  function handleDelete(id: number) {
    if (!confirm('Delete this partner?')) return;
    api.partners.delete(id).then(load).catch((e) => setError(e.message));
  }

  function getLogoUrl(url: string | null) {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${MEDIA_BASE}/${url.replace(/^\//, '')}`;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold font-display">Partners</h1>
        <button
          onClick={() => {
            setEditing(null);
            resetForm();
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 bg-accent text-bg-primary px-4 py-2 rounded-full font-medium hover:bg-accent-hover border border-accent transition-colors"
        >
          <Plus size={20} />
          Add Partner
        </button>
      </div>

      {error && <p className="mb-4 text-red-400 text-sm">{error}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-bg-card rounded-xl border border-border-primary">
          <label className="block mb-2 text-text-secondary text-sm">Partner Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full max-w-md bg-bg-tertiary border border-border-primary rounded-lg py-2 px-4 text-text-primary mb-3"
            placeholder="e.g. Acme Corp"
            required
          />

          <label className="block mb-2 text-text-secondary text-sm">Logo</label>
          <div className="flex items-center gap-4 mb-3">
            {logoUrl && (
              <img
                src={getLogoUrl(logoUrl)!}
                alt="Logo preview"
                className="h-12 max-w-[120px] object-contain bg-bg-tertiary rounded p-2"
              />
            )}
            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-bg-tertiary border border-border-primary rounded-full hover:bg-bg-hover transition-colors">
              <Upload size={16} />
              <span>{uploading ? 'Uploading...' : 'Upload Logo'}</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
          </div>

          <label className="block mb-2 text-text-secondary text-sm">Link (URL)</label>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full max-w-md bg-bg-tertiary border border-border-primary rounded-lg py-2 px-4 text-text-primary mb-4"
            placeholder="https://example.com"
            type="url"
          />

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-accent text-bg-primary px-4 py-2 rounded-full font-medium border border-accent"
              disabled={uploading}
            >
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
        ) : partners.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No partners yet. Add your first partner above.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-bg-tertiary border-b border-border-primary">
              <tr>
                <th className="p-4 font-medium text-text-secondary w-24">Logo</th>
                <th className="p-4 font-medium text-text-secondary">Name</th>
                <th className="p-4 font-medium text-text-secondary">Link</th>
                <th className="p-4 font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {partners.map((p) => (
                <tr key={p.id} className="hover:bg-bg-hover transition-colors">
                  <td className="p-4">
                    {p.logo_url ? (
                      <img
                        src={getLogoUrl(p.logo_url)!}
                        alt={p.name}
                        className="h-10 max-w-[100px] object-contain"
                      />
                    ) : (
                      <div className="w-16 h-10 bg-bg-tertiary rounded flex items-center justify-center text-text-muted text-xs">
                        No logo
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-medium">{p.name}</td>
                  <td className="p-4 text-text-muted text-sm">
                    {p.link ? (
                      <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline truncate block max-w-xs">
                        {p.link}
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="p-4 flex gap-2">
                    <button
                      onClick={() => {
                        setEditing(p);
                        setName(p.name);
                        setLogoUrl(p.logo_url || '');
                        setLink(p.link || '');
                        setShowForm(true);
                      }}
                      className="p-2 text-text-muted hover:text-accent"
                    >
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 text-text-muted hover:text-red-400">
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
