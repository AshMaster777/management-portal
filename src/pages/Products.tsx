import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { api } from '../api/client';

const MEDIA_BASE = import.meta.env.VITE_PRODUCT_RESOURCES_URL || '/productresources';

export function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [productStats, setProductStats] = useState<Record<number, { sales: number; revenue: number }>>({});
  const [platformRevenue, setPlatformRevenue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');

  function load() {
    setLoading(true);
    Promise.all([
      api.products.list({ category: filterCat || undefined }),
      api.categories.list(),
      api.stats(),
    ])
      .then(([prods, cats, stats]) => {
        setProducts(prods);
        setCategories(cats);
        setProductStats(stats?.by_product || {});
        setPlatformRevenue(stats?.platform_revenue ?? null);
      })
      .catch((e) => {
        console.error(e);
        setProductStats({});
        setPlatformRevenue(null);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => load(), [filterCat]);

  const totalRevenue = Object.values(productStats).reduce((s, p) => s + (p.revenue || 0), 0);
  const totalSales = Object.values(productStats).reduce((s, p) => s + (p.sales || 0), 0);

  const filtered = products.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  function handleDelete(id: number) {
    if (!confirm('Delete this product?')) return;
    api.products.delete(id).then(load).catch(alert);
  }

  function getThumb(p: any) {
    const url = p.image_url || p.image_urls?.[0];
    if (url) return `${MEDIA_BASE}/${url}`;
    return `https://picsum.photos/seed/${p.id}/80/45`;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold font-display">Products</h1>
          <p className="text-text-muted text-sm mt-1">
            Total revenue: <span className="text-accent font-semibold">${totalRevenue.toFixed(2)}</span>
            {' · '}
            Actual revenue (after developer split): <span className="text-accent font-semibold">${(platformRevenue ?? totalRevenue).toFixed(2)}</span>
            {' · '}
            Total sales: <span className="text-accent font-semibold">{totalSales}</span>
          </p>
        </div>
        <Link
          to="/admin/products/new"
          className="flex items-center gap-2 bg-accent text-bg-primary px-4 py-2 rounded-full font-medium hover:bg-accent-hover transition-colors border border-accent"
        >
          <Plus size={20} />
          Add Product
        </Link>
      </div>

      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full bg-bg-card border border-border-primary rounded-lg py-2 pl-10 pr-4 text-text-primary focus:outline-none focus:border-accent"
          />
        </div>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="bg-bg-card border border-border-primary rounded-lg py-2 px-4 text-text-primary"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-bg-card rounded-xl border border-border-primary overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-text-muted">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            No products yet. <Link to="/admin/products/new" className="text-accent">Add your first product</Link>.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-bg-tertiary border-b border-border-primary">
              <tr>
                <th className="p-4 font-medium text-text-secondary">Product</th>
                <th className="p-4 font-medium text-text-secondary">Price</th>
                <th className="p-4 font-medium text-text-secondary">Sales</th>
                <th className="p-4 font-medium text-text-secondary">Revenue</th>
                <th className="p-4 font-medium text-text-secondary">Category</th>
                <th className="p-4 font-medium text-text-secondary">Developer</th>
                <th className="p-4 font-medium text-text-secondary">Visibility</th>
                <th className="p-4 font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-bg-hover transition-colors">
                  <td className="p-4 font-medium flex items-center gap-3">
                    <img src={getThumb(p)} alt="" className="w-12 h-12 rounded object-cover bg-bg-tertiary" />
                    {p.name}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span>${Number(p.price).toFixed(2)}</span>
                      {p.robux_price && (
                        <span className="text-sm text-text-muted">R$ {p.robux_price.toLocaleString()}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">{productStats[p.id]?.sales ?? 0}</td>
                  <td className="p-4">${(productStats[p.id]?.revenue ?? 0).toFixed(2)}</td>
                  <td className="p-4 text-text-muted">{p.category_name || '-'}</td>
                  <td className="p-4 text-text-muted">{p.developer_name || '-'}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        p.visibility === 'visible'
                          ? 'bg-green-900/30 text-green-500'
                          : p.visibility === 'unlisted'
                          ? 'bg-yellow-900/30 text-yellow-500'
                          : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {p.visibility || 'visible'}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                    <Link to={`/admin/products/${p.id}`} className="p-2 text-text-muted hover:text-accent">
                      <Pencil size={18} />
                    </Link>
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
