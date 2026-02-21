import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, Filter, Download } from 'lucide-react';
import { api } from '../api/client';

export function Sales() {
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.orders.list(), api.stats()])
      .then(([orderList, s]) => {
        const completed = (orderList || []).filter(
          (o: any) => o.status === 'completed' || o.status === 'paid'
        );
        setOrders(completed);
        setStats(s);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const transactions = orders.map((o) => ({
    id: o.order_number || `#${o.id}`,
    customer: o.user_email || '—',
    date: o.created_at ? new Date(o.created_at).toLocaleDateString() : '—',
    amount: `$${(o.total || 0).toFixed(2)}`,
    status: o.status === 'completed' || o.status === 'paid' ? 'Completed' : 'Pending',
  }));

  const salesData = (stats?.sales_by_month || []).map((m: any) => ({
    name: m.name,
    sales: m.sales ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-display">Sales History</h1>
        <button className="flex items-center gap-2 bg-accent text-bg-primary px-4 py-2 rounded-full font-medium hover:bg-accent-hover transition-colors border border-accent">
          <Download size={18} />
          Export Report
        </button>
      </div>

      <div className="bg-bg-card p-6 rounded-xl border border-border-primary">
        <h2 className="text-lg font-bold mb-4 font-display">Sales Trends</h2>
        <div className="h-[400px] w-full min-h-[280px]">
          <ResponsiveContainer width="100%" height={400} minHeight={280}>
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="name" stroke="#52525b" axisLine={false} tickLine={false} />
              <YAxis stroke="#52525b" axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f0f12',
                  borderColor: 'rgba(255,255,255,0.06)',
                  color: '#fafafa',
                  borderRadius: '10px',
                }}
                itemStyle={{ color: '#3b82f6' }}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorSales)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-bg-card rounded-xl border border-border-primary overflow-hidden">
        <div className="p-6 border-b border-border-primary flex justify-between items-center">
          <h2 className="text-lg font-bold font-display">Recent Transactions</h2>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-bg-tertiary rounded-lg text-text-muted transition-colors">
              <Search size={20} />
            </button>
            <button className="p-2 hover:bg-bg-tertiary rounded-lg text-text-muted transition-colors">
              <Filter size={20} />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-text-secondary">
            <thead className="bg-bg-tertiary text-text-primary uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">Transaction ID</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                    Loading...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                    No sales yet.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-bg-tertiary/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-text-primary">{tx.id}</td>
                    <td className="px-6 py-4">{tx.customer}</td>
                    <td className="px-6 py-4">{tx.date}</td>
                    <td className="px-6 py-4 font-medium text-text-primary">{tx.amount}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tx.status === 'Completed'
                            ? 'bg-green-500/10 text-green-500'
                            : tx.status === 'Pending'
                              ? 'bg-yellow-500/10 text-yellow-500'
                              : 'bg-red-500/10 text-red-500'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
