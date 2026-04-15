import React from 'react';

/**
 * ProgressBar
 * Props:
 *   label       — string
 *   current     — number
 *   target      — number
 *   prefix      — string e.g. '$'
 *   suffix      — string e.g. '%'
 *   color       — tailwind bg class for the fill (default: 'bg-gold')
 *   showValues  — bool (show current / target text, default true)
 */
export default function ProgressBar({
  label,
  current  = 0,
  target   = 100,
  prefix   = '',
  suffix   = '',
  color    = 'bg-gold',
  showValues = true,
}) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  const fmt = (n) => {
    if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M${suffix}`;
    if (n >= 1_000)     return `${prefix}${(n / 1_000).toFixed(1)}K${suffix}`;
    return `${prefix}${n.toLocaleString()}${suffix}`;
  };

  return (
    <div className="space-y-1.5">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-300 font-medium">{label}</p>
        {showValues && (
          <p className="text-sm text-gray-400">
            <span className="text-white font-semibold">{fmt(current)}</span>
            <span className="mx-1 text-gray-600">/</span>
            <span>{fmt(target)}</span>
          </p>
        )}
      </div>

      {/* Bar */}
      <div className="h-2.5 bg-dark-border rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Percentage */}
      <p className="text-xs text-gray-500 text-right">{pct}% of goal</p>
    </div>
  );
}
