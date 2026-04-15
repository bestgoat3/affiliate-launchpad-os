import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  Plus, ExternalLink,
  BarChart2, Megaphone, Globe, Trash2, Edit2,
} from 'lucide-react';
import { marketingApi } from '../../api/client';
import Modal from '../../components/UI/Modal';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Badge from '../../components/UI/Badge';

const PLATFORMS = ['TikTok', 'Instagram', 'YouTube', 'Facebook', 'Other'];
const FORMATS   = ['Hook', 'Story', 'CTA', 'Tutorial', 'Review', 'Vlog'];

const PLATFORM_COLORS = {
  TikTok:    '#C9A84C',
  Instagram: '#E1306C',
  YouTube:   '#FF0000',
  Facebook:  '#1877F2',
  Other:     '#6B7280',
};

const PIE_COLORS = ['#C9A84C', '#E1306C', '#FF0000', '#1877F2', '#6B7280'];

const CHART_TOOLTIP = {
  contentStyle: { backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, color: '#fff', fontSize: 12 },
  labelStyle: { color: '#9CA3AF' },
};

const TABS = ['Content Tracker', 'Campaigns', 'Traffic Sources'];

function fmtNum(n) {
  if (!n) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ─── Add Content Modal ────────────────────────────────────────────────────────
function AddContentModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({
    platform: 'TikTok', format: 'Hook', title: '',
    posted_at: new Date().toISOString().slice(0, 10),
    views: '', clicks: '', leads_generated: '', notes: '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(form);
    setForm({ platform: 'TikTok', format: 'Hook', title: '', posted_at: new Date().toISOString().slice(0, 10), views: '', clicks: '', leads_generated: '', notes: '' });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Log New Post">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Platform</label>
            <select value={form.platform} onChange={e => set('platform', e.target.value)}
              className="w-full bg-dark border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/60">
              {PLATFORMS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Format</label>
            <select value={form.format} onChange={e => set('format', e.target.value)}
              className="w-full bg-dark border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/60">
              {FORMATS.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Title / Description *</label>
          <input required value={form.title} onChange={e => set('title', e.target.value)}
            placeholder="My viral hook video"
            className="w-full bg-dark border border-dark-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gold/60" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Posted Date</label>
          <input type="date" value={form.posted_at} onChange={e => set('posted_at', e.target.value)}
            className="w-full bg-dark border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/60" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[['Views', 'views'], ['Clicks', 'clicks'], ['Leads', 'leads_generated']].map(([label, key]) => (
            <div key={key}>
              <label className="block text-xs text-gray-400 mb-1">{label}</label>
              <input type="number" min="0" value={form[key]} onChange={e => set(key, e.target.value)}
                placeholder="0"
                className="w-full bg-dark border border-dark-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gold/60" />
            </div>
          ))}
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Notes</label>
          <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
            placeholder="What made this perform?"
            className="w-full bg-dark border border-dark-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gold/60 resize-none" />
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-dark-border text-gray-400 rounded-lg text-sm hover:text-white transition">Cancel</button>
          <button type="submit" className="flex-1 px-4 py-2 bg-gold hover:bg-gold-light text-black font-semibold rounded-lg text-sm transition">Log Post</button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Add Campaign Modal ───────────────────────────────────────────────────────
function AddCampaignModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '', platform: 'TikTok', start_date: '', end_date: '',
    budget_spent: '', leads_generated: '', revenue_attributed: '', status: 'active',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(form);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="New Campaign">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Campaign Name *</label>
          <input required value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="Spring TikTok Push"
            className="w-full bg-dark border border-dark-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gold/60" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Platform</label>
            <select value={form.platform} onChange={e => set('platform', e.target.value)}
              className="w-full bg-dark border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/60">
              {PLATFORMS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full bg-dark border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/60">
              {['active','paused','completed'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Start Date</label>
            <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}
              className="w-full bg-dark border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/60" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">End Date</label>
            <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)}
              className="w-full bg-dark border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/60" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[['Ad Spend $', 'budget_spent'], ['Leads', 'leads_generated'], ['Revenue $', 'revenue_attributed']].map(([label, key]) => (
            <div key={key}>
              <label className="block text-xs text-gray-400 mb-1">{label}</label>
              <input type="number" min="0" value={form[key]} onChange={e => set(key, e.target.value)}
                placeholder="0"
                className="w-full bg-dark border border-dark-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gold/60" />
            </div>
          ))}
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-dark-border text-gray-400 rounded-lg text-sm hover:text-white transition">Cancel</button>
          <button type="submit" className="flex-1 px-4 py-2 bg-gold hover:bg-gold-light text-black font-semibold rounded-lg text-sm transition">Add Campaign</button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MarketingDashboard() {
  const qc = useQueryClient();
  const [tab, setTab]             = useState('Content Tracker');
  const [platformFilter, setPF]   = useState('');
  const [addContentOpen, setAC]   = useState(false);
  const [addCampaignOpen, setACa] = useState(false);
  const [sortKey, setSortKey]     = useState('leads_generated');
  const [sortDir, setSortDir]     = useState('desc');

  const { data: contentData, isLoading: cLoading } = useQuery({
    queryKey: ['marketing-content', platformFilter],
    queryFn: () => marketingApi.getContent({ platform: platformFilter || undefined, limit: 100 }).then(r => r.data),
  });

  const { data: campaignData, isLoading: campLoading } = useQuery({
    queryKey: ['marketing-campaigns'],
    queryFn: () => marketingApi.getCampaigns().then(r => r.data),
  });

  const { data: overviewData } = useQuery({
    queryKey: ['marketing-overview'],
    queryFn: () => marketingApi.getTrafficSources().then(r => r.data),
  });

  const createContent = useMutation({
    mutationFn: marketingApi.createContent,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketing-content'] }),
  });

  const deleteContent = useMutation({
    mutationFn: marketingApi.deleteContent,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketing-content'] }),
  });

  const createCampaign = useMutation({
    mutationFn: marketingApi.createCampaign,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketing-campaigns'] }),
  });

  const posts = contentData?.posts || [];
  const sorted = [...posts].sort((a, b) => {
    const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0;
    return sortDir === 'desc' ? bv - av : av - bv;
  });

  const campaigns  = campaignData?.campaigns || [];
  const traffic    = overviewData?.sources   || [];
  const topContent = [...posts].sort((a, b) => (b.leads_generated ?? 0) - (a.leads_generated ?? 0)).slice(0, 5);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortTh = ({ label, k }) => (
    <th
      className="pb-2 px-3 first:pl-0 text-left text-gray-500 text-xs font-medium cursor-pointer hover:text-white transition select-none"
      onClick={() => handleSort(k)}
    >
      {label} {sortKey === k ? (sortDir === 'desc' ? '↓' : '↑') : ''}
    </th>
  );

  const campaignStatusBadge = (s) => {
    if (s === 'active')    return <Badge variant="green">Active</Badge>;
    if (s === 'paused')    return <Badge variant="yellow">Paused</Badge>;
    return <Badge variant="gray">Completed</Badge>;
  };

  return (
    <div className="space-y-5">
      {/* Tab Nav */}
      <div className="flex gap-1 bg-dark-card border border-dark-border rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t ? 'bg-gold text-black' : 'text-gray-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Content Tracker ── */}
      {tab === 'Content Tracker' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex gap-2 flex-wrap">
              {['', ...PLATFORMS].map(p => (
                <button key={p} onClick={() => setPF(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${platformFilter === p ? 'bg-gold text-black' : 'bg-dark-card border border-dark-border text-gray-400 hover:text-white'}`}>
                  {p || 'All'}
                </button>
              ))}
            </div>
            <button onClick={() => setAC(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold-light text-black font-semibold text-sm rounded-lg transition">
              <Plus size={14} /> Log Post
            </button>
          </div>

          {/* Table */}
          <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
            {cLoading ? <LoadingSpinner /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-dark-border">
                    <tr>
                      <SortTh label="Date"    k="posted_at" />
                      <th className="pb-2 px-3 text-left text-gray-500 text-xs font-medium">Platform</th>
                      <th className="pb-2 px-3 text-left text-gray-500 text-xs font-medium">Format</th>
                      <th className="pb-2 px-3 text-left text-gray-500 text-xs font-medium">Title</th>
                      <SortTh label="Views"   k="views" />
                      <SortTh label="Clicks"  k="clicks" />
                      <SortTh label="Leads"   k="leads_generated" />
                      <th className="pb-2 px-3 text-left text-gray-500 text-xs font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.length === 0 ? (
                      <tr><td colSpan={8} className="py-8 text-center text-gray-600 text-sm">No posts logged yet. Click "Log Post" to add your first.</td></tr>
                    ) : sorted.map(post => (
                      <tr key={post.id} className="border-b border-dark-border/40 hover:bg-dark-hover transition">
                        <td className="py-3 px-3 first:pl-5 text-gray-400 text-xs whitespace-nowrap">
                          {post.posted_at ? new Date(post.posted_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${PLATFORM_COLORS[post.platform] || '#6B7280'}20`, color: PLATFORM_COLORS[post.platform] || '#6B7280' }}>
                            {post.platform}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-400 text-xs">{post.format}</td>
                        <td className="py-3 px-3 text-white max-w-[200px] truncate">{post.title}</td>
                        <td className="py-3 px-3 text-gray-300">{fmtNum(post.views)}</td>
                        <td className="py-3 px-3 text-gray-300">{fmtNum(post.clicks)}</td>
                        <td className="py-3 px-3">
                          <span className={`font-semibold ${(post.leads_generated ?? 0) > 0 ? 'text-gold' : 'text-gray-600'}`}>
                            {post.leads_generated ?? 0}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <button onClick={() => deleteContent.mutate(post.id)}
                            className="p-1 text-gray-600 hover:text-red-400 transition">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top Performers */}
          {topContent.length > 0 && (
            <div className="bg-dark-card border border-dark-border rounded-xl p-5">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <BarChart2 size={16} className="text-gold" /> Top Performers by Leads Generated
              </h3>
              <div className="space-y-2">
                {topContent.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="text-gray-600 text-xs w-4">{i + 1}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: `${PLATFORM_COLORS[p.platform]}20`, color: PLATFORM_COLORS[p.platform] }}>
                      {p.platform}
                    </span>
                    <span className="text-gray-300 text-sm flex-1 truncate">{p.title}</span>
                    <span className="text-gold font-semibold text-sm flex-shrink-0">{p.leads_generated} leads</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Campaigns ── */}
      {tab === 'Campaigns' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setACa(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold-light text-black font-semibold text-sm rounded-lg transition">
              <Plus size={14} /> New Campaign
            </button>
          </div>

          {campLoading ? <LoadingSpinner /> : campaigns.length === 0 ? (
            <div className="bg-dark-card border border-dark-border rounded-xl p-10 text-center text-gray-600 text-sm">
              No campaigns yet. Click "New Campaign" to start tracking.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {campaigns.map(c => {
                const roas = c.budget_spent > 0 ? ((c.revenue_attributed || 0) / c.budget_spent).toFixed(2) : '—';
                const cpl  = c.leads_generated > 0 ? ((c.budget_spent || 0) / c.leads_generated).toFixed(2) : '—';
                return (
                  <div key={c.id} className="bg-dark-card border border-dark-border rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-white font-semibold">{c.name}</p>
                        <p className="text-gray-500 text-xs">{c.platform}</p>
                      </div>
                      {campaignStatusBadge(c.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {[['Ad Spend', `$${(c.budget_spent || 0).toLocaleString()}`],
                        ['Leads', c.leads_generated ?? 0],
                        ['Revenue', `$${(c.revenue_attributed || 0).toLocaleString()}`],
                        ['ROAS', roas],
                        ['CPL', cpl !== '—' ? `$${cpl}` : '—'],
                      ].map(([label, val]) => (
                        <div key={label}>
                          <p className="text-gray-500 text-xs">{label}</p>
                          <p className="text-white font-medium">{val}</p>
                        </div>
                      ))}
                    </div>
                    {c.start_date && (
                      <p className="text-gray-600 text-xs">
                        {new Date(c.start_date).toLocaleDateString()} {c.end_date ? `→ ${new Date(c.end_date).toLocaleDateString()}` : '→ ongoing'}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Traffic Sources ── */}
      {tab === 'Traffic Sources' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-dark-card border border-dark-border rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Lead Sources Breakdown</h3>
            {traffic.length === 0 ? (
              <p className="text-gray-500 text-sm">No traffic data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={traffic} cx="50%" cy="50%" outerRadius={100}
                    dataKey="count" nameKey="source" label={({ source, percent }) => `${source} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}>
                    {traffic.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-dark-card border border-dark-border rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Leads by Source</h3>
            {traffic.length === 0 ? (
              <p className="text-gray-500 text-sm">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={traffic} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                  <XAxis dataKey="source" tick={{ fill: '#6B7280', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} />
                  <Tooltip {...CHART_TOOLTIP} />
                  <Bar dataKey="count" fill="#C9A84C" radius={[4, 4, 0, 0]} name="Leads" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      <AddContentModal  open={addContentOpen}  onClose={() => setAC(false)}   onSave={d => createContent.mutateAsync(d)} />
      <AddCampaignModal open={addCampaignOpen} onClose={() => setACa(false)} onSave={d => createCampaign.mutateAsync(d)} />
    </div>
  );
}
