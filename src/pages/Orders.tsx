import { useState, useEffect, Fragment } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { api } from '../api/client';

export function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [orderDetails, setOrderDetails] = useState<Record<number, any>>({});

  useEffect(() => {
    api.orders
      .list()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function toggleExpand(id: number) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    if (!orderDetails[id]) {
      try {
        const detail = await api.orders.get(id);
        setOrderDetails((prev) => ({ ...prev, [id]: detail }));
      } catch (e) {
        console.error(e);
        return;
      }
    }
    setExpandedId(id);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold font-display mb-6">Orders</h1>
      <div className="bg-bg-card rounded-3xl border border-border-light overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-text-muted">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No orders yet.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-bg-tertiary/50 border-b border-border-light">
              <tr>
                <th className="p-5 w-10" />
                <th className="p-5 font-semibold text-text-secondary text-sm tracking-wider uppercase">Order</th>
                <th className="p-5 font-semibold text-text-secondary text-sm tracking-wider uppercase">Customer</th>
                <th className="p-5 font-semibold text-text-secondary text-sm tracking-wider uppercase">Date</th>
                <th className="p-5 font-semibold text-text-secondary text-sm tracking-wider uppercase">Status</th>
                <th className="p-5 font-semibold text-text-secondary text-sm tracking-wider uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {orders.map((o) => (
                <Fragment key={o.id}>
                  <tr
                    onClick={() => toggleExpand(o.id)}
                    className="hover:bg-bg-hover transition-colors cursor-pointer group"
                  >
                    <td className="p-5 w-10 text-text-muted group-hover:text-accent transition-colors">
                      {expandedId === o.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </td>
                    <td className="p-5 font-bold text-text-primary">#{o.order_number || o.id}</td>
                    <td className="p-5 font-medium">{o.user_email || '-'}</td>
                    <td className="p-5 text-text-muted">
                      {o.created_at ? new Date(o.created_at).toLocaleString() : '-'}
                    </td>
                    <td className="p-5">
                      <span
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                          o.status === 'completed' || o.status === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {o.status || 'pending'}
                      </span>
                    </td>
                    <td className="p-5 font-bold text-accent">${Number(o.total || 0).toFixed(2)}</td>
                  </tr>
                  {expandedId === o.id && orderDetails[o.id] && (
                    <tr>
                      <td colSpan={6} className="p-0 bg-bg-tertiary/30">
                        <div className="p-6 pl-16">
                          <h4 className="font-bold text-text-secondary mb-4 uppercase tracking-wider text-sm">Order items</h4>
                          <div className="space-y-3">
                            {(orderDetails[o.id].items || []).map((item: any, i: number) => (
                              <div key={i} className="flex justify-between items-center py-3 border-b border-border-light last:border-0 bg-bg-card px-4 rounded-2xl shadow-sm">
                                <span className="text-text-primary font-semibold">{item.product_name || 'Product #' + item.product_id}</span>
                                <span className="text-text-muted font-medium bg-bg-tertiary px-3 py-1 rounded-lg">Qty: {item.quantity}</span>
                                <span className="text-accent font-bold">${Number(item.price || 0).toFixed(2)} each</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
