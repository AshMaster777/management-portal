import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatsCard } from '../components/dashboard/StatsCard';
import { DollarSign, Package, ShoppingBag, Users, Coins } from 'lucide-react';
import { api } from '../api/client';

const CHART_PROPS = {
  defs: (
    <defs>
      <linearGradient id="colorUsd" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#c4a7e7" stopOpacity={0.35} />
        <stop offset="95%" stopColor="#c4a7e7" stopOpacity={0} />
      </linearGradient>
      <linearGradient id="colorRobux" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#98c9a3" stopOpacity={0.35} />
        <stop offset="95%" stopColor="#98c9a3" stopOpacity={0} />
      </linearGradient>
      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#e0c3fc" stopOpacity={0.35} />
        <stop offset="95%" stopColor="#e0c3fc" stopOpacity={0} />
      </linearGradient>
    </defs>
  ),
  grid: <CartesianGrid strokeDasharray="4 4" stroke="rgba(184,180,200,0.1)" vertical={false} />,
  tooltipStyle: {
    backgroundColor: '#18181f',
    borderColor: 'rgba(196,167,231,0.2)',
    color: '#f8f7fc',
    borderRadius: '14px',
    fontSize: '13px',
    boxShadow: '0 12px 28px -6px rgba(0, 0, 0, 0.35)',
    padding: '12px 16px',
  },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function emptyChartData(valueKey: string) {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return {
      name: MONTHS[d.getMonth()] + ' ' + d.getFullYear().toString().slice(2),
      [valueKey]: 0,
    };
  });
}

type Period = 'daily' | 'weekly' | 'monthly' | 'all';

export function Dashboard() {
  const [period, setPeriod] = useState<Period>('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    products: number;
    orders: number;
    customers: number;
    users: number;
    revenue: number;
    revenue_usd?: number;
    revenue_robux?: number;
    platform_revenue?: number;
    platform_revenue_usd?: number;
    platform_revenue_robux?: number;
    users_by_month?: { name: string; users: number }[];
    sales_by_month?: { name: string; sales: number }[];
    sales_by_month_usd?: { name: string; usd: number; platform_usd: number }[];
    sales_by_month_robux?: { name: string; robux: number; platform_robux: number }[];
  } | null>(null);
  const [visits, setVisits] = useState<{ today: number; yesterday: number; this_month: number; last_month: number } | null>(null);

  useEffect(() => {
    setLoading(true);
    api.stats(period)
      .then((data) => { setStats(data); setLoading(false); })
      .catch((e) => { console.error(e); setLoading(false); });
  }, [period]);

  useEffect(() => {
    api.visits().then(setVisits).catch(() => setVisits({ today: 0, yesterday: 0, this_month: 0, last_month: 0 }));
  }, []);

  // Support both new format (sales_by_month_usd/robux) and legacy (sales_by_month with 'sales' key)
  const usdChartData = stats?.sales_by_month_usd?.length
    ? stats.sales_by_month_usd
    : stats?.sales_by_month?.length
      ? stats.sales_by_month.map((r) => ({ name: r.name, usd: (r as { sales?: number }).sales ?? 0 }))
      : emptyChartData('usd');
  const robuxChartData = stats?.sales_by_month_robux?.length
    ? stats.sales_by_month_robux
    : emptyChartData('robux');
  const usersData = stats?.users_by_month?.length ? stats.users_by_month : emptyChartData('users');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex gap-2">
          {(['daily', 'weekly', 'monthly', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-all ${
                period === p
                  ? 'bg-accent text-[#0f0f14] shadow-md shadow-accent/25'
                  : 'bg-bg-card border border-border-light text-text-secondary hover:text-text-primary hover:bg-bg-hover'
              }`}
            >
              {p === 'daily' ? 'Last 7 days' : p === 'weekly' ? 'Last 8 weeks' : p === 'monthly' ? 'Last 12 months' : 'All time'}
            </button>
          ))}
        </div>
      </div>

      <div className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 transition-opacity ${loading ? 'opacity-60' : ''}`}>
        <StatsCard
          title="Total Revenue ($)"
          value={`$${(stats?.revenue_usd ?? stats?.revenue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          change=""
          trend="up"
          icon={DollarSign}
        />
        <StatsCard
          title="Actual Revenue $ (after dev split)"
          value={`$${(stats?.platform_revenue_usd ?? stats?.platform_revenue ?? stats?.revenue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          change=""
          trend="up"
          icon={DollarSign}
        />
        <StatsCard
          title="Total Revenue (R$)"
          value={`R$ ${(stats?.revenue_robux ?? 0).toLocaleString()}`}
          change=""
          trend="up"
          icon={Coins}
        />
        <StatsCard
          title="Actual Revenue R$ (after dev split)"
          value={`R$ ${(stats?.platform_revenue_robux ?? 0).toLocaleString()}`}
          change=""
          trend="up"
          icon={Coins}
        />
        <StatsCard title="Products" value={String(stats?.products ?? 0)} change="" trend="up" icon={Package} />
        <StatsCard title="Orders" value={String(stats?.orders ?? 0)} change="" trend="up" icon={ShoppingBag} />
        <StatsCard title="Total Customers" value={String(stats?.customers ?? 0)} change="" trend="up" icon={Users} />
        <StatsCard title="Total Users" value={String(stats?.users ?? 0)} change="" trend="up" icon={Users} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-bg-card p-6 rounded-2xl border border-border-light shadow-sm hover:shadow-lg hover:shadow-accent/5 transition-all duration-300">
          <h2 className="text-sm font-semibold mb-4 text-text-secondary uppercase tracking-wider">Revenue ($ USD)</h2>
          <div className="w-full min-h-[280px]">
            <ResponsiveContainer width="100%" height={280} minHeight={280}>
              <AreaChart data={usdChartData}>
                {CHART_PROPS.defs}
                {CHART_PROPS.grid}
                <XAxis dataKey="name" stroke="#8a8699" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis stroke="#8a8699" axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} fontSize={12} />
                <Tooltip contentStyle={CHART_PROPS.tooltipStyle} formatter={(v: number | undefined) => [`$${(v ?? 0).toFixed(2)}`, 'Revenue']} />
                <Area type="monotone" dataKey="usd" stroke="#c4a7e7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorUsd)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-bg-card p-6 rounded-2xl border border-border-light shadow-sm hover:shadow-lg hover:shadow-accent/5 transition-all duration-300">
          <h2 className="text-sm font-semibold mb-4 text-text-secondary uppercase tracking-wider">Revenue (R$ Robux)</h2>
          <div className="w-full min-h-[280px]">
            <ResponsiveContainer width="100%" height={280} minHeight={280}>
              <AreaChart data={robuxChartData}>
                {CHART_PROPS.defs}
                {CHART_PROPS.grid}
                <XAxis dataKey="name" stroke="#8a8699" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis stroke="#8a8699" axisLine={false} tickLine={false} tickFormatter={(v) => `R$ ${v}`} fontSize={12} />
                <Tooltip contentStyle={CHART_PROPS.tooltipStyle} formatter={(v: number | undefined) => [`R$ ${(v ?? 0).toLocaleString()}`, 'Revenue']} />
                <Area type="monotone" dataKey="robux" stroke="#98c9a3" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRobux)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-bg-card p-6 rounded-2xl border border-border-light shadow-sm hover:shadow-lg hover:shadow-accent/5 transition-all duration-300">
          <h2 className="text-sm font-semibold mb-4 text-text-secondary uppercase tracking-wider">Users Overview</h2>
          <div className="w-full min-h-[280px]">
            <ResponsiveContainer width="100%" height={280} minHeight={280}>
              <AreaChart data={usersData}>
                {CHART_PROPS.defs}
                {CHART_PROPS.grid}
                <XAxis dataKey="name" stroke="#8a8699" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis stroke="#8a8699" axisLine={false} tickLine={false} fontSize={12} />
                <Tooltip contentStyle={CHART_PROPS.tooltipStyle} itemStyle={{ color: '#e0c3fc', fontWeight: 600 }} />
                <Area type="monotone" dataKey="users" stroke="#e0c3fc" strokeWidth={2.5} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-bg-card p-6 rounded-2xl border border-border-light shadow-sm hover:shadow-lg hover:shadow-accent/5 transition-all duration-300">
          <h2 className="text-sm font-semibold mb-4 text-text-secondary uppercase tracking-wider">Visits Tracker</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-4 bg-bg-tertiary rounded-lg">
              <span className="text-text-secondary text-sm">Today</span>
              <span className="font-bold">{visits?.today ?? 0}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-bg-tertiary rounded-lg">
              <span className="text-text-secondary text-sm">Yesterday</span>
              <span className="font-bold">{visits?.yesterday ?? 0}</span>
            </div>
            <div className="border-t border-border-light my-3" />
            <div className="flex justify-between items-center">
              <span className="text-text-secondary text-sm">This Month</span>
              <span className="font-semibold">{visits?.this_month ?? 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary text-sm">Last Month</span>
              <span className="font-semibold">{visits?.last_month ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
