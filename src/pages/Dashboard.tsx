import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatsCard } from '../components/dashboard/StatsCard';
import { DollarSign, Package, ShoppingBag, Users, Coins } from 'lucide-react';
import { api } from '../api/client';

const CHART_PROPS = {
  defs: (
    <defs>
      <linearGradient id="colorUsd" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
      </linearGradient>
      <linearGradient id="colorRobux" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
      </linearGradient>
      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.2} />
        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
      </linearGradient>
    </defs>
  ),
  grid: <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />,
  tooltipStyle: {
    backgroundColor: '#0f0f12',
    borderColor: 'rgba(255,255,255,0.06)',
    color: '#fafafa',
    borderRadius: '10px',
    fontSize: '13px',
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
    api.stats(period).then(setStats).catch(console.error);
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
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-accent text-bg-primary'
                  : 'bg-bg-card border border-border-primary text-text-secondary hover:text-text-primary'
              }`}
            >
              {p === 'all' ? 'All time' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
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
        <div className="bg-bg-card p-5 rounded-xl border border-border-primary">
          <h2 className="text-sm font-semibold mb-4 text-text-secondary uppercase tracking-wider">Revenue ($ USD)</h2>
          <div className="w-full min-h-[280px]">
            <ResponsiveContainer width="100%" height={280} minHeight={280}>
              <AreaChart data={usdChartData}>
                {CHART_PROPS.defs}
                {CHART_PROPS.grid}
                <XAxis dataKey="name" stroke="#52525b" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis stroke="#52525b" axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} fontSize={12} />
                <Tooltip contentStyle={CHART_PROPS.tooltipStyle} formatter={(v: number) => [`$${v.toFixed(2)}`, 'Revenue']} />
                <Area type="monotone" dataKey="usd" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorUsd)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-bg-card p-5 rounded-xl border border-border-primary">
          <h2 className="text-sm font-semibold mb-4 text-text-secondary uppercase tracking-wider">Revenue (R$ Robux)</h2>
          <div className="w-full min-h-[280px]">
            <ResponsiveContainer width="100%" height={280} minHeight={280}>
              <AreaChart data={robuxChartData}>
                {CHART_PROPS.defs}
                {CHART_PROPS.grid}
                <XAxis dataKey="name" stroke="#52525b" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis stroke="#52525b" axisLine={false} tickLine={false} tickFormatter={(v) => `R$ ${v}`} fontSize={12} />
                <Tooltip contentStyle={CHART_PROPS.tooltipStyle} formatter={(v: number) => [`R$ ${v.toLocaleString()}`, 'Revenue']} />
                <Area type="monotone" dataKey="robux" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorRobux)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-bg-card p-5 rounded-xl border border-border-primary">
          <h2 className="text-sm font-semibold mb-4 text-text-secondary uppercase tracking-wider">Users Overview</h2>
          <div className="w-full min-h-[280px]">
            <ResponsiveContainer width="100%" height={280} minHeight={280}>
              <AreaChart data={usersData}>
                {CHART_PROPS.defs}
                {CHART_PROPS.grid}
                <XAxis dataKey="name" stroke="#52525b" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis stroke="#52525b" axisLine={false} tickLine={false} fontSize={12} />
                <Tooltip contentStyle={CHART_PROPS.tooltipStyle} itemStyle={{ color: '#60a5fa' }} />
                <Area type="monotone" dataKey="users" stroke="#60a5fa" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-bg-card p-5 rounded-xl border border-border-primary">
          <h2 className="text-sm font-semibold mb-4 text-text-secondary uppercase tracking-wider">Visits Tracker</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-bg-tertiary rounded-lg">
              <span className="text-text-secondary text-sm">Today</span>
              <span className="font-bold">{visits?.today ?? 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-bg-tertiary rounded-lg">
              <span className="text-text-secondary text-sm">Yesterday</span>
              <span className="font-bold">{visits?.yesterday ?? 0}</span>
            </div>
            <div className="border-t border-border-primary my-3" />
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
