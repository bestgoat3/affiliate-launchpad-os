import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * MetricCard
 * Props:
 *   title     — string
 *   value     — string | number (formatted value to display)
 *   change    — number (% change, positive = up, negative = down, null = no change info)
 *   icon      — Lucide icon component
 *   iconColor — tailwind color class e.g. 'text-gold'
 *   iconBg    — tailwind bg class e.g. 'bg-gold/10'
 *   prefix    — string e.g. '$'
 *   suffix    — string e.g. '%'
 *   loading   — bool
 */
export default function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor = 'text-gold',
  iconBg    = 'bg-gold/10',
  prefix    = '',
  suffix    = '',
  loading   = false,
}) {
  const isPositive = change > 0;
  const isNeutral  = change === 0 || change === null || change === undefined;

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-5 flex flex-col gap-3 hover:border-gold/30 transition-colors">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <p className="text-gray-400 text-sm font-medium">{title}</p>
        {Icon && (
          <div className={`p-2 rounded-lg ${iconBg}`}>
            <Icon size={17} className={iconColor} />
          </div>
        )}
      </div>

      {/* Value */}
      {loading ? (
        <div className="h-8 w-24 bg-dark-border rounded animate-pulse" />
      ) : (
        <p className="text-white text-2xl font-bold tracking-tight">
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </p>
      )}

      {/* Change indicator */}
      {!isNeutral && (
        <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          <span>{isPositive ? '+' : ''}{change}% vs last period</span>
        </div>
      )}
      {isNeutral && change === 0 && (
        <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
          <Minus size={13} />
          <span>No change</span>
        </div>
      )}
    </div>
  );
}
