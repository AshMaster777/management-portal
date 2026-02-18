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
      <div className="bg-bg-card rounded-xl border border-border-primary overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-text-muted">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No orders yet.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-bg-tertiary border-b border-border-primary">
              <tr>
                <th className="p-4 w-10" />
                <th className="p-4 font-medium text-text-secondary">Order</th>
                <th className="p-4 font-medium text-text-secondary">Customer</th>
                <th className="p-4 font-medium text-text-secondary">Date</th>
                <th className="p-4 font-medium text-text-secondary">Status</th>
                <th className="p-4 font-medium text-text-secondary">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {orders.map((o) => (
                <Fragment key={o.id}>
                  <tr
                    onClick={() => toggleExpand(o.id)}
                    className="hover:bg-bg-hover transition-colors cursor-pointer"
                  >
                    <td className="p-4 w-10 text-text-muted">
                      {expandedId === o.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </td>
                    <td className="p-4 font-medium">#{o.order_number || o.id}</td>
                    <td className="p-4">{o.user_email || '-'}</td>
                    <td className="p-4 text-text-muted">
                      {o.created_at ? new Date(o.created_at).toLocaleString() : '-'}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          o.status === 'completed' || o.status === 'paid'
                            ? 'bg-green-900/30 text-green-500'
                            : 'bg-yellow-900/30 text-yellow-500'
                        }`}
                      >
                        {o.status || 'pending'}
                      </span>
                    </td>
                    <td className="p-4">${Number(o.total || 0).toFixed(2)}</td>
                  </tr>
                  {expandedId === o.id && orderDetails[o.id] && (
                    <tr>
                      <td colSpan={6} className="p-0 bg-bg-tertiary/50">
                        <div className="p-4 pl-14">
                          <h4 className="font-medium text-text-secondary mb-3">Order items</h4>
                          <div className="space-y-2">
                            {(orderDetails[o.id].items || []).map((item: any, i: number) => (
                              <div key={i} className="flex justify-between items-center py-2 border-b border-border-primary last:border-0">
                                <span className="text-text-primary">{item.product_name || 'Product #' + item.product_id}</span>
                                <span className="text-text-muted">Qty: {item.quantity}</span>
                                <span className="text-accent font-medium">${Number(item.price || 0).toFixed(2)} each</span>
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
