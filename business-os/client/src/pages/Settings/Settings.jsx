import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, Key, Bell, Settings2, Plus, Trash2,
  Eye, EyeOff, Shield, Check, AlertCircle,
} from 'lucide-react';
import { settingsApi } from '../../api/client';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Badge from '../../components/UI/Badge';
import Modal from '../../components/UI/Modal';

const TABS = [
  { id: 'team',          label: 'Team',          icon: Users },
  { id: 'apikeys',       label: 'API Keys',       icon: Key },
  { id: 'notifications', label: 'Notifications',  icon: Bell },
  { id: 'general',       label: 'General',        icon: Settings2 },
];

const ROLE_OPTIONS = ['admin', 'sales', 'fulfillment'];
const ROLE_COLORS  = {
  admin:       'green',
  sales:       'blue',
  fulfillment: 'purple',
  client:      'gray',
};

function Toast({ message, type = 'success' }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium
      ${type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
      {type === 'success' ? <Check size={15} /> : <AlertCircle size={15} />}
      {message}
    </div>
  );
}

// ── Team Tab ──────────────────────────────────────────────────────────────────
function TeamTab() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast]     = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'sales' });

  const { data, isLoading } = useQuery({
    queryKey: ['team'],
    queryFn: () => settingsApi.getTeam().then(r => r.data),
  });

  const addMutation = useMutation({
    mutationFn: settingsApi.inviteTeamMember,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] });
      setAddOpen(false);
      setForm({ name: '', email: '', password: '', role: 'sales' });
      setToast({ message: 'Team member added.', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (e) => {
      setToast({ message: e.response?.data?.error || 'Failed to add member.', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    },
  });

  const removeMutation = useMutation({
    mutationFn: settingsApi.removeTeamMember,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] });
      setToast({ message: 'Member deactivated.', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => settingsApi.updateTeamMember(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
  });

  const members = data?.members || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-sm">Manage your team members and their roles.</p>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold-light text-black font-semibold text-sm rounded-lg transition">
          <Plus size={14} /> Add Member
        </button>
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
          {members.length === 0 ? (
            <p className="p-8 text-center text-gray-500 text-sm">No team members yet.</p>
          ) : members.map((m, i) => (
            <div key={m.id} className={`flex items-center gap-4 px-5 py-4 ${i < members.length - 1 ? 'border-b border-dark-border' : ''}`}>
              <div className="w-9 h-9 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                <span className="text-gold font-bold text-sm">{m.name?.[0]?.toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{m.name}</p>
                <p className="text-gray-500 text-xs">{m.email}</p>
              </div>
              <select
                value={m.role}
                onChange={e => updateMutation.mutate({ id: m.id, data: { role: e.target.value } })}
                className="bg-dark border border-dark-border text-gray-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-gold/60"
              >
                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <Badge variant={m.active ? 'green' : 'gray'}>{m.active ? 'Active' : 'Inactive'}</Badge>
              <button
                onClick={() => removeMutation.mutate(m.id)}
                className="p-1.5 text-gray-600 hover:text-red-400 transition"
                title="Deactivate member"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Team Member">
        <form onSubmit={e => { e.preventDefault(); addMutation.mutate(form); }} className="space-y-3">
          {[['Full Name *', 'name', 'text', 'Jane Smith'], ['Email *', 'email', 'email', 'jane@example.com'], ['Password *', 'password', 'password', '••••••••']].map(([label, key, type, ph]) => (
            <div key={key}>
              <label className="block text-xs text-gray-400 mb-1">{label}</label>
              <input required type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={ph}
                className="w-full bg-dark border border-dark-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gold/60" />
            </div>
          ))}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Role</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full bg-dark border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/60">
              {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setAddOpen(false)} className="flex-1 px-4 py-2 border border-dark-border text-gray-400 rounded-lg text-sm hover:text-white transition">Cancel</button>
            <button type="submit" disabled={addMutation.isPending} className="flex-1 px-4 py-2 bg-gold hover:bg-gold-light disabled:opacity-50 text-black font-semibold rounded-lg text-sm transition">
              {addMutation.isPending ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </Modal>

      {toast && <Toast {...toast} />}
    </div>
  );
}

// ── API Keys Tab ──────────────────────────────────────────────────────────────
function ApiKeysTab() {
  const qc = useQueryClient();
  const [form, setForm]     = useState({ name: '', service: '', value: '' });
  const [showVal, setShowV] = useState(false);
  const [toast, setToast]   = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => settingsApi.getApiKeys().then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: settingsApi.createApiKey,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['api-keys'] });
      setForm({ name: '', service: '', value: '' });
      setToast({ message: 'API key saved.', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: settingsApi.deleteApiKey,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });

  const keys = data?.keys || [];

  const SERVICE_LABELS = {
    ghl: 'GoHighLevel', youform: 'YouForm', calendly: 'Calendly', smtp: 'SMTP', other: 'Other',
  };

  return (
    <div className="space-y-5">
      <p className="text-gray-400 text-sm">Store API keys securely. Values are hashed and cannot be retrieved after saving.</p>

      {/* Add key form */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Key size={15} className="text-gold" /> Add New Key</h3>
        <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form); }} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Key name (e.g. GHL Webhook Secret)"
            className="bg-dark border border-dark-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gold/60" />
          <select value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))}
            className="bg-dark border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/60">
            <option value="">Service</option>
            {Object.entries(SERVICE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <div className="relative">
            <input required type={showVal ? 'text' : 'password'} value={form.value}
              onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
              placeholder="Key value"
              className="w-full bg-dark border border-dark-border rounded-lg px-3 py-2 pr-9 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gold/60" />
            <button type="button" onClick={() => setShowV(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
              {showVal ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <button type="submit" disabled={createMutation.isPending}
            className="sm:col-span-3 px-4 py-2 bg-gold hover:bg-gold-light disabled:opacity-50 text-black font-semibold rounded-lg text-sm transition">
            {createMutation.isPending ? 'Saving...' : 'Save Key'}
          </button>
        </form>
      </div>

      {/* Key list */}
      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
        {isLoading ? <div className="p-6"><LoadingSpinner /></div> : keys.length === 0 ? (
          <p className="p-8 text-center text-gray-500 text-sm">No API keys stored yet.</p>
        ) : keys.map((k, i) => (
          <div key={k.id} className={`flex items-center gap-4 px-5 py-4 ${i < keys.length - 1 ? 'border-b border-dark-border' : ''}`}>
            <div className="p-2 bg-gold/10 rounded-lg"><Key size={14} className="text-gold" /></div>
            <div className="flex-1">
              <p className="text-white text-sm font-medium">{k.name}</p>
              <p className="text-gray-500 text-xs">{SERVICE_LABELS[k.service] || k.service || 'Unknown service'} · Added {new Date(k.created_at).toLocaleDateString()}</p>
            </div>
            <span className="text-gray-600 text-xs font-mono">••••••••</span>
            <button onClick={() => deleteMutation.mutate(k.id)} className="p-1.5 text-gray-600 hover:text-red-400 transition">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      {toast && <Toast {...toast} />}
    </div>
  );
}

// ── Notifications Tab ─────────────────────────────────────────────────────────
function NotificationsTab() {
  const qc = useQueryClient();
  const [toast, setToast] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications-settings'],
    queryFn: () => settingsApi.getNotifications().then(r => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: settingsApi.updateNotifications,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications-settings'] });
      setToast({ message: 'Notification preferences saved.', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    },
  });

  const notifs = data?.notifications || {};

  const NOTIF_OPTIONS = [
    { key: 'notify_new_lead',    label: 'New Lead',       desc: 'Email when a new lead is created or arrives via webhook.' },
    { key: 'notify_booked_call', label: 'Call Booked',    desc: 'Email when a lead books a strategy call.' },
    { key: 'notify_closed_won',  label: 'Closed Won',     desc: 'Email when a deal is marked Closed Won.' },
    { key: 'notify_no_show',     label: 'No-Show',        desc: 'Email when a scheduled call is marked no-show.' },
  ];

  const toggle = (key) => {
    const updated = { ...notifs, [key]: notifs[key] === '1' ? '0' : '1' };
    saveMutation.mutate(updated);
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-400 text-sm">Configure email alerts for key business events. Requires SMTP settings in your .env file.</p>
      {isLoading ? <LoadingSpinner /> : (
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
          {NOTIF_OPTIONS.map((opt, i) => (
            <div key={opt.key} className={`flex items-center justify-between px-5 py-4 ${i < NOTIF_OPTIONS.length - 1 ? 'border-b border-dark-border' : ''}`}>
              <div>
                <p className="text-white text-sm font-medium">{opt.label}</p>
                <p className="text-gray-500 text-xs mt-0.5">{opt.desc}</p>
              </div>
              <button
                onClick={() => toggle(opt.key)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${notifs[opt.key] === '1' ? 'bg-gold' : 'bg-dark-border'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${notifs[opt.key] === '1' ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      )}
      {toast && <Toast {...toast} />}
    </div>
  );
}

// ── General Tab ───────────────────────────────────────────────────────────────
function GeneralTab() {
  const qc = useQueryClient();
  const [form, setForm] = useState({});
  const [toast, setToast] = useState(null);
  const [initialized, setInit] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['general-settings'],
    queryFn: () => settingsApi.getGeneral().then(r => r.data),
    onSuccess: (d) => {
      if (!initialized) { setForm(d.settings || {}); setInit(true); }
    },
  });

  const saveMutation = useMutation({
    mutationFn: settingsApi.updateGeneral,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['general-settings'] });
      setToast({ message: 'Settings saved.', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    },
  });

  const settings = data?.settings || {};
  const displayForm = initialized ? form : settings;

  const FIELDS = [
    { key: 'business_name',    label: 'Business Name',      placeholder: 'Affiliate Launchpad' },
    { key: 'monthly_goal',     label: 'Monthly Revenue Goal ($)', placeholder: '50000' },
    { key: 'admin_email',      label: 'Admin Email',        placeholder: 'admin@affiliatelaunchpad.com' },
    { key: 'timezone',         label: 'Timezone',           placeholder: 'America/New_York' },
    { key: 'currency',         label: 'Currency',           placeholder: 'USD' },
  ];

  return (
    <div className="space-y-4">
      {isLoading ? <LoadingSpinner /> : (
        <div className="bg-dark-card border border-dark-border rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FIELDS.map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs text-gray-400 mb-1">{label}</label>
                <input
                  value={displayForm[key] || ''}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-dark border border-dark-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gold/60"
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => saveMutation.mutate(displayForm)}
            disabled={saveMutation.isPending}
            className="px-6 py-2 bg-gold hover:bg-gold-light disabled:opacity-50 text-black font-semibold rounded-lg text-sm transition"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* Environment info */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Shield size={15} className="text-gold" /> Environment Info
        </h3>
        <div className="space-y-2 text-sm">
          {[
            ['Platform', 'Affiliate Launchpad Business OS'],
            ['Version',  '1.0.0'],
            ['Database', 'SQLite (better-sqlite3)'],
            ['Auth',     'JWT (expires in 7 days)'],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-3">
              <span className="text-gray-500 w-24 flex-shrink-0">{k}</span>
              <span className="text-gray-300">{v}</span>
            </div>
          ))}
        </div>
      </div>
      {toast && <Toast {...toast} />}
    </div>
  );
}

// ── Main Settings Page ────────────────────────────────────────────────────────
export default function Settings() {
  const [activeTab, setActiveTab] = useState('team');
  const ActiveIcon = TABS.find(t => t.id === activeTab)?.icon || Settings2;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Tab nav */}
      <div className="flex gap-1 bg-dark-card border border-dark-border rounded-xl p-1 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${activeTab === id ? 'bg-gold text-black' : 'text-gray-400 hover:text-white'}`}>
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'team'          && <TeamTab />}
      {activeTab === 'apikeys'       && <ApiKeysTab />}
      {activeTab === 'notifications' && <NotificationsTab />}
      {activeTab === 'general'       && <GeneralTab />}
    </div>
  );
}
