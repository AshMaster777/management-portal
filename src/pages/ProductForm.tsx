import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { ImageCropModal } from '../components/ImageCropModal';

export function ProductForm() {
  const descRef = useRef<HTMLTextAreaElement>(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('5.00');
  const [robuxPrice, setRobuxPrice] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'visible' | 'invisible' | 'unlisted'>('visible');
  const [tags, setTags] = useState('');
  const [coverFiles, setCoverFiles] = useState<File[]>([]);
  const [coverPreviews, setCoverPreviews] = useState<string[]>([]); // object URLs for immediate preview
  const [uploadingPreviews, setUploadingPreviews] = useState<Set<string>>(new Set()); // preview URLs being uploaded
  const [productFiles, setProductFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [developers, setDevelopers] = useState<any[]>([]);
  const [developerId, setDeveloperId] = useState<number | ''>('');
  const [tagList, setTagList] = useState<any[]>([]);
  const [existingFileCount, setExistingFileCount] = useState(0);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [existingFileUrls, setExistingFileUrls] = useState<string[]>([]);
  const [cropQueue, setCropQueue] = useState<File[]>([]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      coverPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [coverPreviews]);

  const MEDIA_BASE = import.meta.env.VITE_PRODUCT_RESOURCES_URL || '/productresources';

  useEffect(() => {
    api.categories.list().then(setCategories);
    api.tags.list().then(setTagList);
    api.developers.list().then(setDevelopers);
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      api.products.get(parseInt(id)).then((p) => {
        setTitle(p.name);
        setPrice(String(p.price));
        setRobuxPrice(p.robux_price ? String(p.robux_price) : '');
        setCategoryId(p.category_id);
        setDescription(p.description || '');
        setVisibility((p.visibility as any) || 'visible');
        setTags(p.tags ? (Array.isArray(p.tags) ? p.tags.join(', ') : p.tags) : '');
        setDeveloperId(p.developer_id ?? '');
        const fileUrls = p.file_urls || [];
        setExistingFileCount(fileUrls.length);
        setExistingFileUrls(fileUrls);
        const imgUrls = p.image_urls?.length ? p.image_urls : (p.image_url ? [p.image_url] : []);
        setExistingImageUrls(imgUrls);
      });
    }
  }, [isEdit, id]);

  function addImageFromCrop(file: File) {
    const preview = URL.createObjectURL(file);
    setCoverFiles((prev) => [...prev, file].slice(0, 9));
    setCoverPreviews((prev) => [...prev, preview].slice(0, 9));

    if (isEdit && id) {
      const pid = parseInt(id);
      setUploadingPreviews((s) => new Set(s).add(preview));
      api.products
        .uploadImage(pid, file)
        .then(({ url }) => {
          const relPath = url.startsWith('product-') ? url : `product-${pid}/images/${url.split('/').pop()}`;
          setExistingImageUrls((prev) => [...prev, relPath]);
          setCoverFiles((prev) => prev.filter((f) => f !== file));
          setCoverPreviews((prev) => {
            URL.revokeObjectURL(preview);
            return prev.filter((p) => p !== preview);
          });
        })
        .catch((e) => setError((e as Error).message))
        .finally(() => setUploadingPreviews((s) => { const n = new Set(s); n.delete(preview); return n; }));
    }
  }

  function processCropQueue() {
    setCropQueue((prev) => prev.slice(1));
  }

  function handleCropComplete(file: File) {
    addImageFromCrop(file);
    processCropQueue();
  }

  function handleCropSkip() {
    const current = cropQueue[0];
    if (current) addImageFromCrop(current);
    processCropQueue();
  }

  function setAsMainImage(index: number, isExisting: boolean) {
    if (isExisting) {
      if (index === 0) return;
      const next = [...existingImageUrls];
      const [removed] = next.splice(index, 1);
      next.unshift(removed);
      setExistingImageUrls(next);
      if (isEdit && id) {
        api.products.update(parseInt(id), { image_urls: next }).catch((e) => setError((e as Error).message));
      }
    } else {
      if (index === 0) return;
      const nextFiles = [...coverFiles];
      const nextPreviews = [...coverPreviews];
      const [f] = nextFiles.splice(index, 1);
      const [p] = nextPreviews.splice(index, 1);
      nextFiles.unshift(f);
      nextPreviews.unshift(p);
      setCoverFiles(nextFiles);
      setCoverPreviews(nextPreviews);
    }
  }

  function removeImage(index: number, isExisting: boolean) {
    if (isExisting && isEdit && id) {
      const next = existingImageUrls.filter((_, i) => i !== index);
      setExistingImageUrls(next);
      api.products.update(parseInt(id), { image_urls: next }).catch((e) => setError((e as Error).message));
    } else if (!isExisting) {
      setCoverFiles((prev) => prev.filter((_, i) => i !== index));
      setCoverPreviews((prev) => {
        const url = prev[index];
        if (url) URL.revokeObjectURL(url);
        return prev.filter((_, i) => i !== index);
      });
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const catId = categoryId === '' ? categories[0]?.id : categoryId;
    if (!catId) {
      setError('Create at least one category first.');
      setLoading(false);
      return;
    }
    const tagArr = tags.length ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

    const hasFiles = productFiles.length > 0 || (isEdit && existingFileCount > 0);
    if (!hasFiles) {
      setError('At least one product file is required for customers to download after purchase.');
      setLoading(false);
      return;
    }

    const run = async () => {
      const pid = isEdit ? parseInt(id!) : 0;
      if (isEdit && id) {
        // Upload first so media is saved before any update
        if (coverFiles.length) await api.products.uploadImages(pid, coverFiles);
        for (const f of productFiles) await api.products.uploadFile(pid, f);
        await api.products.update(pid, {
          name: title,
          price: parseFloat(price),
          robux_price: robuxPrice ? parseInt(robuxPrice) : null,
          category_id: Number(catId),
          description: description || undefined,
          visibility,
          tags: tagArr,
          developer_id: developerId === '' ? null : developerId,
        });
        navigate('/admin/products');
      } else {
        const prod = (await api.products.create({
          name: title,
          price: parseFloat(price),
          robux_price: robuxPrice ? parseInt(robuxPrice) : null,
          category_id: Number(catId),
          description: description || undefined,
          visibility,
          tags: tagArr,
          developer_id: developerId === '' ? null : developerId,
        })) as { id: number };
        const newPid = prod.id;
        if (coverFiles.length) await api.products.uploadImages(newPid, coverFiles);
        for (const f of productFiles) await api.products.uploadFile(newPid, f);
        navigate('/admin/products');
      }
    };

    run().catch((e) => setError(e.message)).finally(() => setLoading(false));
  }

  function formatDesc(cmd: 'bold' | 'italic' | 'underline') {
    const wrappers: Record<string, [string, string]> = {
      bold: ['**', '**'],
      italic: ['*', '*'],
      underline: ['__', '__'],
    };
    const [open, close] = wrappers[cmd];
    const textarea = descRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = description.slice(start, end);
    const before = description.slice(0, start);
    const after = description.slice(end);
    const next = selected ? before + open + selected + close + after : description + open + close;
    setDescription(next);
    setTimeout(() => {
      textarea.focus();
      const newStart = selected ? start + open.length : start + open.length;
      const newEnd = selected ? end + open.length : start + open.length;
      textarea.setSelectionRange(newStart, newEnd);
    }, 0);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold font-display mb-6">{isEdit ? 'Edit Product' : 'Add Product'}</h1>
      {error && <p className="mb-4 text-red-400 text-sm">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* File(s) upload */}
        <div>
          <h2 className="text-lg font-semibold mb-2">File(s) – upload your product files, all formats accepted. <span className="text-red-400">Required</span></h2>
          <p className="text-text-muted text-sm mb-2">
            {productFiles.length > 0
              ? `${productFiles.length} new file(s) selected`
              : existingFileCount > 0
                ? `${existingFileCount} file(s) already uploaded`
                : 'No product files added yet. At least one file is required so customers can download after purchase.'}
          </p>
          {existingFileUrls.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {existingFileUrls.map((url, i) => {
                const name = url.split('/').pop() || url;
                return (
                  <a
                    key={i}
                    href={`${MEDIA_BASE}/${url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-sm text-text-primary hover:bg-bg-hover"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" y1="18" x2="12" y2="12" />
                      <line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                    {name}
                  </a>
                );
              })}
            </div>
          )}
          <input
            type="file"
            multiple
            onChange={(e) => setProductFiles(Array.from(e.target.files || []))}
            className="hidden"
            id="product-files"
          />
          <label
            htmlFor="product-files"
            className="inline-flex items-center gap-2 bg-accent text-bg-primary px-4 py-2 rounded-full font-medium cursor-pointer hover:bg-accent-hover border border-accent"
          >
            + Upload product file
          </label>
        </div>

        {/* Title */}
        <div>
          <label className="block text-text-secondary mb-2">Title – choose a title for your product.</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-bg-card border border-border-primary rounded-lg py-2 px-4 text-text-primary"
            placeholder="Your product title..."
            required
          />
        </div>

        {/* Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-text-secondary mb-2">Price (USD) – choose a price.</label>
            <div className="flex items-center gap-2">
              <span className="text-text-muted">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="flex-1 bg-bg-card border border-border-primary rounded-lg py-2 px-4 text-text-primary"
                placeholder="5.00"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-text-secondary mb-2">Price (Robux) – optional Robux price.</label>
            <div className="flex items-center gap-2">
              <span className="text-text-muted">R$</span>
              <input
                type="number"
                step="1"
                min="0"
                value={robuxPrice}
                onChange={(e) => setRobuxPrice(e.target.value)}
                className="flex-1 bg-bg-card border border-border-primary rounded-lg py-2 px-4 text-text-primary"
                placeholder="100"
              />
            </div>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-text-secondary mb-2">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value ? parseInt(e.target.value) : '')}
            className="w-full bg-bg-card border border-border-primary rounded-lg py-2 px-4 text-text-primary"
            required
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Developer */}
        <div>
          <label className="block text-text-secondary mb-2">Developer (revenue share)</label>
          <select
            value={developerId}
            onChange={(e) => setDeveloperId(e.target.value ? parseInt(e.target.value) : '')}
            className="w-full bg-bg-card border border-border-primary rounded-lg py-2 px-4 text-text-primary"
          >
            <option value="">None</option>
            {developers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name || d.email} ({d.revenue_percent}%)
              </option>
            ))}
          </select>
        </div>

        {/* Cover images */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Cover – add multiple images. Up to 9 items.</h2>
          <p className="text-text-muted text-sm mb-2">
            {existingImageUrls.length + coverFiles.length > 0
              ? `${existingImageUrls.length} uploaded, ${coverFiles.length} pending`
              : 'No product images added yet.'}
          </p>
          <div className="flex flex-wrap gap-3 mb-3">
            {existingImageUrls.map((url, i) => (
              <div key={`ex-${i}`} className="relative group">
                <a
                  href={`${MEDIA_BASE}/${url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block w-24 h-24 rounded-lg overflow-hidden border flex-shrink-0 bg-[#404040] ${
                    i === 0 ? 'border-accent ring-2 ring-accent/50' : 'border-border-primary'
                  }`}
                >
                  <img
                    src={`${MEDIA_BASE}/${url}`}
                    alt={`Cover ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {i === 0 && (
                    <span className="absolute bottom-0 left-0 right-0 bg-accent/90 text-bg-primary text-xs py-0.5 text-center font-medium">
                      Main
                    </span>
                  )}
                </a>
                <button
                  type="button"
                  onClick={() => removeImage(i, true)}
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Remove"
                >
                  ×
                </button>
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={() => setAsMainImage(i, true)}
                    className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-accent text-bg-primary text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent-hover"
                    title="Set as main"
                  >
                    ★
                  </button>
                )}
              </div>
            ))}
            {coverPreviews.map((preview, i) => (
              <div key={`preview-${i}`} className="relative group">
                <div
                  className={`block w-24 h-24 rounded-lg overflow-hidden border flex-shrink-0 bg-[#404040] ${
                    existingImageUrls.length === 0 && i === 0 ? 'border-accent ring-2 ring-accent/50' : 'border-border-primary'
                  }`}
                >
                  <img src={preview} alt={`New ${i + 1}`} className="w-full h-full object-cover" />
                  {isEdit && uploadingPreviews.has(preview) && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-xs animate-pulse">Uploading...</span>
                    </div>
                  )}
                  {existingImageUrls.length === 0 && i === 0 && (
                    <span className="absolute bottom-0 left-0 right-0 bg-accent/90 text-bg-primary text-xs py-0.5 text-center font-medium">
                      Main
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(i, false)}
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Remove"
                >
                  ×
                </button>
                {existingImageUrls.length > 0 || i !== 0 ? (
                  <button
                    type="button"
                    onClick={() => setAsMainImage(i, false)}
                    className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-accent text-bg-primary text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent-hover"
                    title="Set as main"
                  >
                    ★
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          <p className="text-text-muted text-xs mb-2">Crop to 16:10 to fit product cards. First image is main. Click ★ to set main. Min width 1000px.</p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const maxNew = 9 - existingImageUrls.length - coverFiles.length;
              const files = Array.from(e.target.files || []).slice(0, maxNew);
              if (files.length) setCropQueue((prev) => [...prev, ...files].slice(0, maxNew));
              e.target.value = '';
            }}
            className="hidden"
            id="cover-files"
          />
          <label
            htmlFor="cover-files"
            className="inline-flex items-center gap-2 bg-accent text-bg-primary px-4 py-2 rounded-full font-medium cursor-pointer hover:bg-accent-hover border border-accent"
          >
            + Add product images
          </label>
        </div>

        {/* Description */}
        <div>
          <label className="block text-text-secondary mb-2">Description – add a description. Use the toolbar for <strong>bold</strong>, <em>italic</em>, and <u>underline</u>.</label>
          <div className="flex gap-1 mb-2">
            <button
              type="button"
              onClick={() => formatDesc('bold')}
              className="p-2 bg-bg-tertiary border border-border-primary rounded-lg hover:bg-bg-hover text-text-primary font-bold text-sm"
              title="Bold"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => formatDesc('italic')}
              className="p-2 bg-bg-tertiary border border-border-primary rounded-lg hover:bg-bg-hover text-text-primary italic text-sm"
              title="Italic"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => formatDesc('underline')}
              className="p-2 bg-bg-tertiary border border-border-primary rounded-lg hover:bg-bg-hover text-text-primary underline text-sm"
              title="Underline"
            >
              U
            </button>
          </div>
          <textarea
            ref={descRef}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-bg-card border border-border-primary rounded-lg py-2 px-4 text-text-primary min-h-[120px]"
            placeholder="Type your description here. Use the toolbar above or **bold**, *italic*, __underline__ in markdown."
          />
          <p className="text-text-muted text-xs mt-1">Markdown: **bold**, *italic*, __underline__</p>
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-text-secondary mb-2">
            Visibility – should your store visitors be able to see this product?
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value="visible"
                checked={visibility === 'visible'}
                onChange={() => setVisibility('visible')}
              />
              <span>Visible – Everyone can see this product.</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value="invisible"
                checked={visibility === 'invisible'}
                onChange={() => setVisibility('invisible')}
              />
              <span>Invisible – Nobody except you can see this product.</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value="unlisted"
                checked={visibility === 'unlisted'}
                onChange={() => setVisibility('unlisted')}
              />
              <span>Unlisted – Only people who know the direct link can see it.</span>
            </label>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-text-secondary mb-2">Tags (comma-separated)</label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full bg-bg-card border border-border-primary rounded-lg py-2 px-4 text-text-primary"
            placeholder="e.g. military, aircraft, maps"
          />
          {tagList.length > 0 && (
            <p className="text-text-muted text-xs mt-1">Existing: {tagList.map((t) => t.slug).join(', ')}</p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-accent text-bg-primary px-6 py-2 rounded-full font-medium hover:bg-accent-hover disabled:opacity-50 border border-accent"
          >
            {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="border border-border-primary px-6 py-2 rounded-full"
          >
            Cancel
          </button>
        </div>
      </form>

      {cropQueue.length > 0 && (
        <ImageCropModal
          key={cropQueue[0].name + cropQueue[0].size}
          file={cropQueue[0]}
          onComplete={handleCropComplete}
          onCancel={handleCropSkip}
        />
      )}
    </div>
  );
}
