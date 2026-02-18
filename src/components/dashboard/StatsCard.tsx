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
    <div className="bg-bg-card p-6 rounded-xl border border-border-primary hover:border-border-light transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-muted">{title}</p>
          <p className="text-2xl font-bold mt-2 font-display text-text-primary">{value}</p>
        </div>
        <div className="p-3 bg-bg-tertiary rounded-lg text-accent">
          <Icon size={24} />
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
