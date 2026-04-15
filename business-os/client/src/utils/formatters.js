// Currency formatter
export const formatCurrency = (value, decimals = 0) => {
  if (value === null || value === undefined) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

// Number formatter with commas
export const formatNumber = (value) => {
  if (value === null || value === undefined) return '0';
  return new Intl.NumberFormat('en-US').format(value);
};

// Percentage formatter
export const formatPercent = (value, decimals = 1) => {
  if (value === null || value === undefined) return '0%';
  return `${Number(value).toFixed(decimals)}%`;
};

// Date formatter
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';
  const defaultOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  };
  return date.toLocaleDateString('en-US', defaultOptions);
};

// Relative time formatter
export const formatRelativeTime = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(dateString);
};

// Days since date
export const daysSince = (dateString) => {
  if (!dateString) return 0;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 0;
  const now = new Date();
  const diff = now - date;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

// Short date
export const formatShortDate = (dateString) => {
  return formatDate(dateString, { month: 'short', day: 'numeric' });
};

// Time formatter
export const formatTime = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

// Lead score color
export const getLeadScoreColor = (score) => {
  if (score >= 8) return 'text-emerald-400';
  if (score >= 5) return 'text-yellow-400';
  return 'text-red-400';
};

export const getLeadScoreBg = (score) => {
  if (score >= 8) return 'bg-emerald-400';
  if (score >= 5) return 'bg-yellow-400';
  return 'bg-red-400';
};

// Stage color map
export const STAGE_COLORS = {
  'New Lead': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Contacted': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Call Booked': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Call Completed': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Proposal Sent': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'Negotiation': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  'Closed Won': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Closed Lost': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Onboarding': 'bg-gold/20 text-gold border-gold/30',
};

export const PIPELINE_STAGES = [
  'New Lead',
  'Contacted',
  'Call Booked',
  'Call Completed',
  'Proposal Sent',
  'Negotiation',
  'Closed Won',
  'Closed Lost',
  'Onboarding',
];

// Source badge color
export const SOURCE_COLORS = {
  TikTok: 'bg-pink-500/20 text-pink-400',
  Instagram: 'bg-purple-500/20 text-purple-400',
  YouTube: 'bg-red-500/20 text-red-400',
  Facebook: 'bg-blue-500/20 text-blue-400',
  Referral: 'bg-emerald-500/20 text-emerald-400',
  Organic: 'bg-green-500/20 text-green-400',
  Paid: 'bg-yellow-500/20 text-yellow-400',
  Email: 'bg-indigo-500/20 text-indigo-400',
  Other: 'bg-gray-500/20 text-gray-400',
};

// Truncate string
export const truncate = (str, length = 30) => {
  if (!str) return '';
  return str.length > length ? `${str.slice(0, length)}...` : str;
};

// Get initials
export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Get greeting based on time
export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};
