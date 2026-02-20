import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const UPLOAD_STEP_TIMEOUT_MS = 11 * 60 * 1000; // 11 min per file so we never hang

export function ProductUploadNew() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('5.00');
  const [robuxPrice, setRobuxPrice] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'visible' | 'invisible' | 'unlisted'>('visible');
  const [tags, setTags] = useState('');
  const [developerId, setDeveloperId] = useState<number | ''>('');
  const [coverFiles, setCoverFiles] = useState<File[]>([]);
  const [productFiles, setProductFiles] = useState<File[]>([]);

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('');
  const [error, setError] = useState('');
  const [stepErrors, setStepErrors] = useState<{ step: string; message: string }[]>([]);
  const [done, setDone] = useState(false);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [developers, setDevelopers] = useState<{ id: number; name: string; email: string; revenue_percent: number }[]>([]);

  useEffect(() => {
    api.categories.list().then(setCategories);
    api.developers.list().then(setDevelopers);
  }, []);

  function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`${label} took too long; request may still have succeeded. Check the product list.`)), ms)
      ),
    ]);
  }

  function errMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    return 'Unknown error';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setStepErrors([]);
    const tagArr = tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

    if (productFiles.length === 0) {
      setError('Add at least one product file so customers can download after purchase.');
      return;
    }

    setLoading(true);
    setStep('Saving product details…');

    const errors: { step: string; message: string }[] = [];

    try {
      // 1) Create product – if this fails we stop
      let pid: number;
      try {
        const prod = (await api.products.create({
          name: title,
          price: parseFloat(price),
          robux_price: robuxPrice ? parseInt(robuxPrice, 10) : null,
          category_id: Number(categoryId),
          description: description || undefined,
          visibility,
          tags: tagArr,
          developer_id: developerId === '' ? null : developerId,
        })) as { id: number };
        pid = prod.id;
      } catch (err) {
        errors.push({ step: 'Create product (details)', message: errMessage(err) });
        setStepErrors(errors);
        setStep('');
        setLoading(false);
        return;
      }

      // 2) Cover images – one by one so we know which failed
      if (coverFiles.length > 0) {
        for (let i = 0; i < coverFiles.length; i++) {
          const file = coverFiles[i];
          setStep(`Uploading cover image ${i + 1} of ${coverFiles.length} (${file.name})…`);
          try {
            await withTimeout(
              api.products.uploadImage(pid, file),
              UPLOAD_STEP_TIMEOUT_MS,
              `Cover image ${i + 1} (${file.name})`
            );
          } catch (err) {
            errors.push({
              step: `Cover image ${i + 1} (${file.name})`,
              message: errMessage(err),
            });
          }
        }
      }

      // 3) Product files – one by one, record each failure
      const total = productFiles.length;
      for (let i = 0; i < total; i++) {
        const file = productFiles[i];
        setStep(`Uploading file ${i + 1} of ${total} (${file.name})…`);
        try {
          await withTimeout(
            api.products.uploadFile(pid, file),
            UPLOAD_STEP_TIMEOUT_MS,
            `Product file ${i + 1} (${file.name})`
          );
        } catch (err) {
          errors.push({
            step: `Product file ${i + 1} (${file.name})`,
            message: errMessage(err),
          });
        }
      }

      setStep('');
      setLoading(false);

      if (errors.length > 0) {
        setStepErrors(errors);
        setError(`${errors.length} step(s) failed. See list below to fix and retry.`);
        return;
      }

      setDone(true);
      setTimeout(() => navigate('/admin/products'), 1500);
    } catch (err) {
      const message = errMessage(err);
      setStepErrors((prev) => [...prev, { step: 'Unexpected', message }]);
      setError(message);
      setStep('');
      setLoading(false);
    } finally {
      setLoading(false);
      setStep('');
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-text-primary">New Product</h1>
        <p className="text-text-muted text-sm mt-1">Add a product with details, cover images, and downloadable file(s).</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {stepErrors.length > 0 && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="text-red-400 font-medium text-sm mb-3">Errors by step (hunt down each one):</p>
          <ul className="space-y-2 list-none">
            {stepErrors.map(({ step: stepName, message }, i) => (
              <li key={i} className="text-red-300 text-sm">
                <span className="font-medium text-red-400">{stepName}</span>
                <span className="text-red-400/90"> → </span>
                <span className="break-words">{message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {done && (
        <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
          Product created successfully. Redirecting to product list…
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Details */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary border-b border-border-primary pb-2">Details</h2>
          <div>
            <label className="block text-text-secondary text-sm mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-bg-card border border-border-primary rounded-lg py-2 px-4 text-text-primary"
              placeholder="Product name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-text-secondary text-sm mb-1">Price (USD) *</label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full bg-bg-card border border-border-primary rounded-lg py-2 px-4 text-text-primary"
              />
            </div>
            <div>
              <label className="block text-text-secondary text-sm mb-1">Robux (optional)</label>
              <input
                type="text"
                value={robuxPrice}
                onChange={(e) => setRobuxPrice(e.target.value)}
                className="w-full bg-bg-card border border-border-primary rounded-lg py-2 px-4 text-text-primary"
                placeholder="Leave empty if not used"
              />
            </div>
          </div>
          <div>
            <label className="block text-text-secondary text-sm mb-1">Category *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
              required
              className="w-full bg-bg-card border border-border-primary rounded-lg py-2 px-4 text-text-primary"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-text-secondary text-sm mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-bg-card border border-border-primary rounded-lg py-2 px-4 text-text-primary resize-y"
              placeholder="Describe your product"
            />
          </div>
          <div>
            <label className="block text-text-secondary text-sm mb-1">Visibility</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as 'visible' | 'invisible' | 'unlisted')}
              className="w-full bg-bg-card border border-border-primary rounded-lg py-2 px-4 text-text-primary"
            >
              <option value="visible">Visible</option>
              <option value="unlisted">Unlisted</option>
              <option value="invisible">Invisible</option>
            </select>
          </div>
          <div>
            <label className="block text-text-secondary text-sm mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-bg-card border border-border-primary rounded-lg py-2 px-4 text-text-primary"
              placeholder="e.g. military, aircraft, maps"
            />
          </div>
          <div>
            <label className="block text-text-secondary text-sm mb-1">Developer (revenue share)</label>
            <select
              value={developerId}
              onChange={(e) => setDeveloperId(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-bg-card border border-border-primary rounded-lg py-2 px-4 text-text-primary"
            >
              <option value="">None</option>
              {developers.map((d) => (
                <option key={d.id} value={d.id}>{d.name || d.email} ({d.revenue_percent}%)</option>
              ))}
            </select>
          </div>
        </section>

        {/* Cover images */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary border-b border-border-primary pb-2">Cover images (optional)</h2>
          <p className="text-text-muted text-sm">First image is the main one. Max 9, 100MB each.</p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setCoverFiles(Array.from(e.target.files || []).slice(0, 9))}
            className="block w-full text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-accent file:text-bg-primary file:font-medium"
          />
          {coverFiles.length > 0 && (
            <p className="text-text-secondary text-sm">{coverFiles.length} image(s) selected</p>
          )}
        </section>

        {/* Product file(s) */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary border-b border-border-primary pb-2">Product file(s) *</h2>
          <p className="text-text-muted text-sm">At least one file required. Max 100MB per file.</p>
          <input
            type="file"
            multiple
            onChange={(e) => setProductFiles(Array.from(e.target.files || []))}
            className="block w-full text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-accent file:text-bg-primary file:font-medium"
          />
          {productFiles.length > 0 && (
            <ul className="text-text-secondary text-sm list-disc list-inside">
              {productFiles.map((f, i) => (
                <li key={i}>{f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)</li>
              ))}
            </ul>
          )}
        </section>

        {/* Submit */}
        <div className="flex flex-wrap items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-full font-medium bg-accent text-bg-primary hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Please wait…' : 'Create product'}
          </button>
          {step && (
            <span className="text-text-secondary text-sm">
              {step}
              {loading && productFiles.length > 0 && ' Large files may take several minutes.'}
            </span>
          )}
          {!loading && (
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="text-text-muted hover:text-text-primary text-sm"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
