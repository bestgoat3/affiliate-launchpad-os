import React from 'react';

const variants = {
  default: 'bg-dark-hover text-gray-300 border border-dark-border',
  gold: 'bg-gold/15 text-gold border border-gold/20',
  success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  warning: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
  danger: 'bg-red-500/15 text-red-400 border border-red-500/20',
  info: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  purple: 'bg-purple-500/15 text-purple-400 border border-purple-500/20',
  pink: 'bg-pink-500/15 text-pink-400 border border-pink-500/20',
  orange: 'bg-orange-500/15 text-orange-400 border border-orange-500/20',
};

const sizes = {
  xs: 'px-1.5 py-0.5 text-xs rounded',
  sm: 'px-2 py-0.5 text-xs rounded-md',
  md: 'px-2.5 py-1 text-xs rounded-md',
};

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
  dot = false,
}) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 font-medium whitespace-nowrap
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 flex-shrink-0" />
      )}
      {children}
    </span>
  );
}

export function StageBadge({ stage }) {
  const stageVariants = {
    'New Lead': 'info',
    Contacted: 'purple',
    'Call Booked': 'warning',
    'Call Completed': 'orange',
    'Proposal Sent': 'pink',
    Negotiation: 'purple',
    'Closed Won': 'success',
    'Closed Lost': 'danger',
    Onboarding: 'gold',
  };
  return (
    <Badge variant={stageVariants[stage] || 'default'} dot>
      {stage}
    </Badge>
  );
}

export function RoleBadge({ role }) {
  const roleVariants = {
    admin: 'gold',
    sales: 'info',
    fulfillment: 'success',
    client: 'purple',
  };
  return (
    <Badge variant={roleVariants[role] || 'default'}>
      {role?.charAt(0).toUpperCase() + role?.slice(1)}
    </Badge>
  );
}

export function StatusBadge({ status }) {
  const statusVariants = {
    active: 'success',
    inactive: 'default',
    onboarding: 'gold',
    completed: 'info',
    cancelled: 'danger',
    paused: 'warning',
  };
  return (
    <Badge variant={statusVariants[status?.toLowerCase()] || 'default'} dot>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </Badge>
  );
}
