import React from 'react';

export default function Card({ children, className = '', padding = true, hover = false }) {
  return (
    <div
      className={`
        bg-dark-card border border-dark-border rounded-xl
        ${padding ? 'p-5' : ''}
        ${hover ? 'hover:border-gold/30 transition-colors duration-150 cursor-pointer' : ''}
        shadow-card
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between mb-4 ${className}`}>
      <div>
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0 ml-4">{action}</div>}
    </div>
  );
}

export function StatCard({ title, value, change, icon: Icon, color = 'gold', loading = false }) {
  const colorMap = {
    gold: 'text-gold bg-gold/10',
    blue: 'text-blue-400 bg-blue-400/10',
    green: 'text-emerald-400 bg-emerald-400/10',
    red: 'text-red-400 bg-red-400/10',
    purple: 'text-purple-400 bg-purple-400/10',
  };

  const isPositive = change > 0;
  const isNeutral = change === 0 || change === undefined;

  return (
    <Card className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-400 mb-1">{title}</p>
        {loading ? (
          <div className="h-8 w-24 bg-dark-hover rounded animate-pulse mt-1" />
        ) : (
          <p className="text-2xl font-bold text-white">{value}</p>
        )}
        {!isNeutral && !loading && (
          <p
            className={`text-xs mt-1 font-medium ${
              isPositive ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {isPositive ? '+' : ''}
            {change}% vs last period
          </p>
        )}
      </div>
      {Icon && (
        <div className={`p-2.5 rounded-lg ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </Card>
  );
}
