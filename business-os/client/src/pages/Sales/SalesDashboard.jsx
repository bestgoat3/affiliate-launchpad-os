import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Users, PhoneCall, TrendingUp, DollarSign,
  Eye, CheckCircle, Award,
} from 'lucide-react';
import { salesApi } from '../../api/client';
import MetricCard from '../../components/Charts/MetricCard';
import ProgressBar from '../../components/Charts/ProgressBar';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const PERIODS = ['Today', 'This Week', 'This Month', 'Last Month'];

const CHART_STYLE = {
  tooltip: { contentStyle: { backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, color: '#fff', fontSize: 12 }, labelStyle: { color: '#9CA3AF' } },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function SalesDashboard() {
  const [period, setPeriod] = useState('This Month');

  const { data, isLoading } = useQuery({
    queryKey: ['sales-dashboard', period],
    queryFn: () => salesApi.getDashboard({ period }).then(r => r.data),
    refetchInterval: 60000,
  });

  const { data: leaderData, isLoading: lbLoading } = useQuery({
    queryKey: ['sales-leaderboard', period],
    queryFn: () => salesApi.getLeaderboard({ period }).then(r => r.data),
  });

  const { data: actData } = useQuery({
    queryKey: ['sales-activity'],
    queryFn: () => salesApi.getActivity({ limit: 15 }).then(r => r.data),
  });

  const metrics = data?.metrics || {};
  const chartData = data?.chart || [];
  const leaderboard = leaderData?.leaderboard || [];
  const activities = actData?.activities || [];

  const MONTHLY_GOAL = 50000;

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center gap-2 flex-wrap">
        {PERIODS.map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              period === p
                ? 'bg-gold text-black'
                : 'bg-dark-card border border-dark-border text-gray-400 hover:text-white'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard title="Leads In"      value={metrics.leads_in ?? '—'}       icon={Users}       loading={isLoading} />
        <MetricCard title="Calls Booked"  value={metrics.calls_booked ?? '—'}   icon={PhoneCall}   loading={isLoading} iconColor="text-blue-400"  iconBg="bg-blue-400/10" />
        <MetricCard title="Show Rate"     value={metrics.show_rate ?? '—'}      suffix="%" icon={Eye} loading={isLoading} iconColor="text-purple-400" iconBg="bg-purple-400/10" />
        <MetricCard title="Close Rate"    value={metrics.close_rate ?? '—'}     suffix="%" icon={TrendingUp} loading={isLoading} iconColor="text-green-400" iconBg="bg-green-400/10" />
        <MetricCard title="Revenue"       value={metrics.revenue_closed ?? '—'} prefix="$" icon={DollarSign} loading={isLoading} iconColor="text-gold" iconBg="bg-gold/10" />
        <MetricCard title="Avg Deal"      value={metrics.avg_deal_size ?? '—'}  prefix="$" icon={Award}  loading={isLoading} iconColor="text-yellow-400" iconBg="bg-yellow-400/10" />
      </div>

      {/* Goal Progress */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Monthly Revenue Goal</h3>
          <span className="text-gray-500 text-sm">Target: $50,000</span>
        </div>
        <ProgressBar
          label="Revenue Closed This Month"
          current={metrics.revenue_closed || 0}
          target={MONTHLY_GOAL}
          prefix="$"
          color="bg-gold"
        />
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Leads & Closes Chart */}
        <div className="lg:col-span-2 bg-dark-card border border-dark-border rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Leads & Closes Over Time</h3>
          {isLoading ? <LoadingSpinner /> : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-600 text-sm">No data for this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} />
                <Tooltip {...CHART_STYLE.tooltip} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#9CA3AF' }} />
                <Line type="monotone" dataKey="leads"  stroke="#C9A84C" strokeWidth={2} dot={false} name="Leads" />
                <Line type="monotone" dataKey="closes" stroke="#22C55E" strokeWidth={2} dot={false} name="Closes" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {activities.length === 0 ? (
              <p className="text-gray-500 text-sm">No recent activity.</p>
            ) : activities.map(a => (
              <div key={a.id} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gold mt-2 flex-shrink-0" />
                <div>
                  <p className="text-gray-300 text-xs leading-snug">{a.description}</p>
                  <p className="text-gray-600 text-xs mt-0.5">{timeAgo(a.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">Rep Leaderboard — {period}</h3>
        {lbLoading ? <LoadingSpinner /> : leaderboard.length === 0 ? (
          <p className="text-gray-500 text-sm">No rep data yet. Add team members in Settings.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border">
                  {['#', 'Rep', 'Leads', 'Calls', 'Closes', 'Revenue', 'Close Rate'].map(h => (
                    <th key={h} className="pb-2 text-left text-gray-500 font-medium text-xs px-2 first:pl-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((rep, i) => (
                  <tr key={rep.id} className="border-b border-dark-border/50 hover:bg-dark-hover transition">
                    <td className="py-3 pl-0 px-2">
                      <span className={`font-bold text-sm ${i === 0 ? 'text-gold' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-600' : 'text-gray-600'}`}>
                        #{i + 1}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-gold text-xs font-bold">{rep.name?.[0]?.toUpperCase()}</span>
                        </div>
                        <span className="text-white font-medium">{rep.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-gray-300">{rep.leads ?? 0}</td>
                    <td className="py-3 px-2 text-gray-300">{rep.calls ?? 0}</td>
                    <td className="py-3 px-2 text-green-400 font-medium">{rep.closes ?? 0}</td>
                    <td className="py-3 px-2 text-gold font-medium">${(rep.revenue ?? 0).toLocaleString()}</td>
                    <td className="py-3 px-2">
                      <span className={`font-semibold ${(rep.close_rate ?? 0) >= 30 ? 'text-green-400' : 'text-gray-400'}`}>
                        {rep.close_rate ?? 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pipeline Value by Stage */}
      {data?.pipeline_value && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Pipeline Value by Stage</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.pipeline_value} margin={{ top: 4, right: 4, left: -10, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
              <XAxis dataKey="stage" tick={{ fill: '#6B7280', fontSize: 10 }} angle={-30} textAnchor="end" />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} />
              <Tooltip {...CHART_STYLE.tooltip} formatter={v => [`$${v.toLocaleString()}`, 'Value']} />
              <Bar dataKey="value" fill="#C9A84C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
