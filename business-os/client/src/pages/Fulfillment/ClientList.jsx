import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, ChevronRight, CheckCircle, Clock, XCircle } from 'lucide-react';
import { clientsApi } from '../../api/client';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Badge from '../../components/UI/Badge';

const STATUS_CONFIG = {
  Onboarding: { variant: 'yellow',   icon: Clock,        label: 'Onboarding' },
  Active:     { variant: 'green',    icon: CheckCircle,  label: 'Active' },
  Completed:  { variant: 'gray',     icon: CheckCircle,  label: 'Completed' },
};

const STATUSES = ['', 'Onboarding', 'Active', 'Completed'];

export default function ClientList() {
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['clients', status],
    queryFn: () => clientsApi.getAll({ status: status || undefined }).then(r => r.data),
    refetchInterval: 30000,
  });

  const clients = data?.clients || [];

  const filtered = search.trim()
    ? clients.filter(c =>
        `${c.name || ''} ${c.email || ''}`.toLowerCase().includes(search.toLowerCase())
      )
    : clients;

  function progressColor(pct) {
    if (pct >= 80) return 'bg-green-500';
    if (pct >= 40) return 'bg-yellow-500';
    return 'bg-blue-500';
  }

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Onboarding', color: 'text-yellow-400', count: clients.filter(c => c.status === 'Onboarding').length },
          { label: 'Active',     color: 'text-green-400',  count: clients.filter(c => c.status === 'Active').length },
          { label: 'Completed',  color: 'text-gray-400',   count: clients.filter(c => c.status === 'Completed').length },
        ].map(s => (
          <div key={s.label} className="bg-dark-card border border-dark-border rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-gray-500 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-dark-card border border-dark-border rounded-lg px-3 py-2 flex-1 max-w-sm">
          <Search size={14} className="text-gray-500 flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none flex-1"
          />
        </div>
        <div className="flex gap-2">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${status === s ? 'bg-gold text-black' : 'bg-dark-card border border-dark-border text-gray-400 hover:text-white'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Client table */}
      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
        {isLoading ? <div className="p-8"><LoadingSpinner /></div> : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-600 text-sm">
            {search || status ? 'No clients match your filters.' : 'No clients yet. Leads become clients when moved to Onboarding stage.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-dark-border">
                <tr>
                  {['Client', 'Status', 'Progress', 'Assigned To', 'Since', ''].map(h => (
                    <th key={h} className="pb-3 pt-4 px-4 first:pl-5 text-left text-gray-500 text-xs font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(client => {
                  const cfg  = STATUS_CONFIG[client.status] || STATUS_CONFIG.Onboarding;
                  const pct  = client.checklist_progress ?? 0;
                  const since = client.active_since || client.onboarding_started_at;
                  return (
                    <tr key={client.id} className="border-b border-dark-border/40 hover:bg-dark-hover transition group">
                      <td className="py-3.5 px-4 pl-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-gold font-bold text-sm">
                              {(client.name || '?')[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium">{client.name}</p>
                            <p className="text-gray-500 text-xs">{client.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1 w-32">
                          <div className="h-1.5 bg-dark-border rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${progressColor(pct)}`} style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-gray-500 text-xs">{pct}% complete</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-400 text-sm">
                        {client.fulfillment_rep || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 text-xs whitespace-nowrap">
                        {since ? new Date(since).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <Link to={`/clients/${client.id}`}
                          className="flex items-center gap-1 text-gray-500 hover:text-gold text-xs transition">
                          View <ChevronRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
