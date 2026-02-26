import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
}

export function StatsCard({ title, value, change, trend, icon: Icon }: StatsCardProps) {
  return (
    <div className="bg-bg-card p-5 rounded-2xl border border-border-light hover:border-accent/20 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 group">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider truncate">{title}</p>
          <p className="text-2xl font-bold mt-1.5 font-display text-text-primary truncate">{value}</p>
        </div>
        <div className="p-3 bg-accent/15 rounded-2xl text-accent flex-shrink-0 group-hover:bg-accent/25 group-hover:scale-105 transition-all duration-300">
          <Icon size={22} strokeWidth={2.5} />
        </div>
      </div>
      {change && (
        <div className="mt-4 flex items-center text-sm">
          <span className={trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-text-secondary'}>
            {change}
          </span>
          <span className="text-text-muted ml-2">from last month</span>
        </div>
      )}
    </div>
  );
}
