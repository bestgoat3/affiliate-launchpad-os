import React, { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users, PhoneCall, TrendingUp, DollarSign,
  Clock, ArrowRight, Activity, CalendarDays,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { dashboardApi, salesApi } from '../api/client';
import MetricCard from '../components/Charts/MetricCard';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const STAGE_COLORS = {
  'New Lead':          'bg-blue-500',
  'Booked Call':       'bg-indigo-500',
  'Call Completed':    'bg-yellow-500',
  'Proposal Sent':     'bg-orange-500',
  'Closed Won':        'bg-green-500',
  'Onboarding':        'bg-teal-500',
  'Active Client':     'bg-emerald-500',
  'Upsell Opportunity':'bg-purple-500',
  'Churned Lost':      'bg-red-500',
};

const ACTIVITY_ICONS = {
  lead_created:    { icon: Users,      color: 'text-blue-400',   bg: 'bg-blue-400/10' },
  stage_change:    { icon: TrendingUp, color: 'text-gold',        bg: 'bg-gold/10' },
  note_added:      { icon: Activity,   color: 'text-purple-400', bg: 'bg-purple-400/10' },
  booked_call:     { icon: PhoneCall,  color: 'text-green-400',  bg: 'bg-green-400/10' },
  call_cancelled:  { icon: PhoneCall,  color: 'text-red-400',    bg: 'bg-red-400/10' },
  webhook_inbound: { icon: Users,      color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  default:         { icon: Activity,   color: 'text-gray-400',   bg: 'bg-gray-400/10' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function greeting(name) {
  const h = new Date().getHours();
  const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return `${g}, ${name?.split(' ')[0] || 'there'} 👋`;
}

export default function Dashboard() {
  const { user } = useContext(AuthContext);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats().then(r => r.data),
  });

  const { data: activityData, isLoading: actLoading } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: () => dashboardApi.getRecentActivity().then(r => r.data),
  });

  const { data: pipelineData, isLoading: pipeLoading } = useQuery({
    queryKey: ['dashboard-pipeline'],
    queryFn: () => dashboardApi.getPipelineOverview().then(r => r.data),
  });

  const { data: callsData } = useQuery({
    queryKey: ['dashboard-upcoming-calls'],
    queryFn: () => dashboardApi.getUpcomingCalls().then(r => r.data),
  });

  const metrics = stats?.metrics || {};
  const activities = activityData?.activities || [];
  const stages = pipelineData?.stages || [];
  const upcomingCalls = callsData?.leads || [];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-white text-2xl font-bold">{greeting(user?.name)}</h2>
        <p className="text-gray-500 text-sm mt-1">
          Here's what's happening with your business today.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Leads This Month"
          value={metrics.leads_this_month ?? '—'}
          change={metrics.leads_change}
          icon={Users}
          loading={statsLoading}
        />
        <MetricCard
          title="Calls Booked"
          value={metrics.calls_booked ?? '—'}
          change={metrics.calls_change}
          icon={PhoneCall}
          iconColor="text-blue-400"
          iconBg="bg-blue-400/10"
          loading={statsLoading}
        />
        <MetricCard
          title="Close Rate"
          value={metrics.close_rate ?? '—'}
          suffix="%"
          change={metrics.close_rate_change}
          icon={TrendingUp}
          iconColor="text-green-400"
          iconBg="bg-green-400/10"
          loading={statsLoading}
        />
        <MetricCard
          title="Revenue Closed"
          value={metrics.revenue_closed ?? '—'}
          prefix="$"
          change={metrics.revenue_change}
          icon={DollarSign}
          iconColor="text-gold"
          iconBg="bg-gold/10"
          loading={statsLoading}
        />
      </div>

      {/* Pipeline Overview + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pipeline Overview */}
        <div className="lg:col-span-2 bg-dark-card border border-dark-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Pipeline Overview</h3>
            <Link
              to="/pipeline"
              className="text-gold text-sm hover:text-gold-light flex items-center gap-1"
            >
              View full pipeline <ArrowRight size={13} />
            </Link>
          </div>
          {pipeLoading ? (
            <LoadingSpinner />
          ) : stages.length === 0 ? (
            <p className="text-gray-500 text-sm">No leads in pipeline yet.</p>
          ) : (
            <div className="space-y-3">
              {stages.map(s => {
                const maxCount = Math.max(...stages.map(x => x.count), 1);
                const pct = Math.round((s.count / maxCount) * 100);
                return (
                  <div key={s.stage} className="flex items-center gap-3">
                    <div className="w-36 text-xs text-gray-400 truncate flex-shrink-0">{s.stage}</div>
                    <div className="flex-1 h-2 bg-dark-border rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${STAGE_COLORS[s.stage] || 'bg-gold'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="w-6 text-xs text-white font-medium text-right flex-shrink-0">
                      {s.count}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Recent Activity</h3>
          {actLoading ? (
            <LoadingSpinner />
          ) : activities.length === 0 ? (
            <p className="text-gray-500 text-sm">No activity yet.</p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {activities.slice(0, 12).map(a => {
                const cfg = ACTIVITY_ICONS[a.activity_type] || ACTIVITY_ICONS.default;
                const Icon = cfg.icon;
                return (
                  <div key={a.id} className="flex items-start gap-2.5">
                    <div className={`mt-0.5 p-1.5 rounded-md flex-shrink-0 ${cfg.bg}`}>
                      <Icon size={12} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-300 text-xs leading-snug">{a.description}</p>
                      <p className="text-gray-600 text-xs mt-0.5">{timeAgo(a.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Calls */}
      {upcomingCalls.length > 0 && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays size={17} className="text-gold" />
            <h3 className="text-white font-semibold">Upcoming Calls</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingCalls.slice(0, 3).map(lead => (
              <Link
                key={lead.id}
                to={`/pipeline/lead/${lead.id}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-dark border border-dark-border hover:border-gold/30 transition"
              >
                <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-300 text-sm font-bold">
                    {lead.first_name?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {lead.first_name} {lead.last_name}
                  </p>
                  <p className="text-gray-500 text-xs flex items-center gap-1">
                    <Clock size={10} />
                    {lead.call_date
                      ? new Date(lead.call_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : 'Time TBD'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
