import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Mail, Phone, User, DollarSign,
  Target, Calendar, Tag, Star, ChevronDown,
  Plus, Send, Clock, Activity, FileText,
  AlertTriangle, CheckCircle,
} from 'lucide-react';
import { leadsApi } from '../../api/client';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Badge from '../../components/UI/Badge';

const STAGES = [
  'New Lead','Booked Call','Call Completed','Proposal Sent',
  'Closed Won','Onboarding','Active Client','Upsell Opportunity','Churned Lost',
];

const STAGE_COLORS = {
  'New Lead':           'blue',
  'Booked Call':        'indigo',
  'Call Completed':     'yellow',
  'Proposal Sent':      'orange',
  'Closed Won':         'green',
  'Onboarding':         'teal',
  'Active Client':      'emerald',
  'Upsell Opportunity': 'purple',
  'Churned Lost':       'red',
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

function scoreColor(n) {
  if (n >= 8) return 'text-green-400';
  if (n >= 5) return 'text-yellow-400';
  return 'text-red-400';
}

const TABS = ['Overview', 'Notes', 'Activity'];

export default function LeadDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const qc         = useQueryClient();
  const [tab, setTab]           = useState('Overview');
  const [note, setNote]         = useState('');
  const [stageOpen, setStageOpen] = useState(false);
  const [submittingNote, setSubmittingNote] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadsApi.getById(id).then(r => r.data),
  });

  const moveMutation = useMutation({
    mutationFn: (stage) => leadsApi.move(id, stage),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead', id] });
      qc.invalidateQueries({ queryKey: ['leads-all'] });
      setStageOpen(false);
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: (content) => leadsApi.addNote(id, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lead', id] }),
  });

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    setSubmittingNote(true);
    try {
      await addNoteMutation.mutateAsync(note.trim());
      setNote('');
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleSendToFulfillment = () => moveMutation.mutate('Onboarding');

  if (isLoading) return <LoadingSpinner />;
  if (error || !data?.lead) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertTriangle size={32} className="text-red-400" />
        <p className="text-white font-semibold">Lead not found</p>
        <Link to="/pipeline" className="text-gold text-sm hover:underline">Back to Pipeline</Link>
      </div>
    );
  }

  const { lead, notes = [], activities = [] } = data;
  const stageColor = STAGE_COLORS[lead.stage] || 'gray';

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition"
      >
        <ArrowLeft size={16} /> Back to Pipeline
      </button>

      {/* Header card */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
              <span className="text-gold text-xl font-bold">
                {lead.first_name?.[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-white text-xl font-bold">
                {lead.first_name} {lead.last_name}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant={stageColor}>{lead.stage}</Badge>
                {lead.source && (
                  <span className="text-gray-500 text-xs">{lead.source}</span>
                )}
                <span className={`text-sm font-bold flex items-center gap-1 ${scoreColor(lead.lead_score)}`}>
                  <Star size={12} />
                  {lead.lead_score}/10
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Move Stage */}
            <div className="relative">
              <button
                onClick={() => setStageOpen(v => !v)}
                className="flex items-center gap-2 px-3 py-2 bg-dark border border-dark-border rounded-lg text-sm text-white hover:border-gold/40 transition"
              >
                Move Stage <ChevronDown size={13} />
              </button>
              {stageOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setStageOpen(false)} />
                  <div className="absolute right-0 top-10 z-50 w-48 bg-dark-card border border-dark-border rounded-xl shadow-2xl overflow-hidden">
                    {STAGES.filter(s => s !== lead.stage).map(s => (
                      <button
                        key={s}
                        onClick={() => moveMutation.mutate(s)}
                        disabled={moveMutation.isPending}
                        className="block w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-dark-hover hover:text-white transition"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Send to Fulfillment */}
            {lead.stage !== 'Onboarding' && lead.stage !== 'Active Client' && (
              <button
                onClick={handleSendToFulfillment}
                disabled={moveMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-2 bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 rounded-lg text-sm transition"
              >
                <CheckCircle size={13} /> Send to Fulfillment
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-card border border-dark-border rounded-xl p-1">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
              tab === t
                ? 'bg-gold text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contact info */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-5 space-y-3">
            <h3 className="text-white font-semibold text-sm mb-3">Contact Information</h3>
            {[
              { icon: Mail,     label: 'Email',  val: lead.email },
              { icon: Phone,    label: 'Phone',  val: lead.phone },
              { icon: User,     label: 'Rep',    val: lead.rep_name || 'Unassigned' },
              { icon: Calendar, label: 'Call',   val: lead.call_date ? new Date(lead.call_date).toLocaleString() : 'Not scheduled' },
            ].map(({ icon: Icon, label, val }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-500 text-xs">{label}</p>
                  <p className="text-white text-sm">{val || '—'}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Qualification */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-5 space-y-3">
            <h3 className="text-white font-semibold text-sm mb-3">Qualification</h3>
            {[
              { icon: DollarSign, label: 'Monthly Revenue', val: lead.monthly_revenue },
              { icon: DollarSign, label: 'Budget',           val: lead.budget },
              { icon: Target,     label: '90-Day Goal',      val: lead.goal_90_days },
              { icon: Star,       label: 'Investment Ready', val: lead.investment_ready },
            ].map(({ icon: Icon, label, val }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-500 text-xs">{label}</p>
                  <p className="text-white text-sm">{val || '—'}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Notes preview */}
          {lead.notes && (
            <div className="md:col-span-2 bg-dark-card border border-dark-border rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-2">Internal Notes</h3>
              <p className="text-gray-400 text-sm whitespace-pre-line">{lead.notes}</p>
            </div>
          )}

          {/* Tags */}
          {lead.tags?.length > 0 && (
            <div className="md:col-span-2 bg-dark-card border border-dark-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Tag size={14} className="text-gray-500" />
                <h3 className="text-white font-semibold text-sm">Tags</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {lead.tags.map(tag => (
                  <span key={tag} className="bg-dark border border-dark-border text-gray-300 text-xs px-2 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'Notes' && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-5 space-y-4">
          {/* Add note */}
          <form onSubmit={handleAddNote} className="flex gap-2">
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              placeholder="Add a note about this lead..."
              className="flex-1 bg-dark border border-dark-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gold/60 resize-none transition"
            />
            <button
              type="submit"
              disabled={submittingNote || !note.trim()}
              className="px-4 bg-gold hover:bg-gold-light disabled:opacity-50 text-black rounded-lg self-stretch flex items-center transition"
            >
              <Send size={15} />
            </button>
          </form>

          {/* Note list */}
          <div className="space-y-3">
            {notes.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No notes yet.</p>
            ) : notes.map(n => (
              <div key={n.id} className="flex gap-3 p-3 bg-dark rounded-lg border border-dark-border">
                <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-white font-medium">
                    {n.author_name?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white text-xs font-medium">{n.author_name || 'Unknown'}</span>
                    <span className="text-gray-600 text-xs">{timeAgo(n.created_at)}</span>
                  </div>
                  <p className="text-gray-300 text-sm whitespace-pre-line">{n.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Activity' && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          {activities.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No activity recorded.</p>
          ) : (
            <div className="space-y-3">
              {activities.map(a => (
                <div key={a.id} className="flex items-start gap-3">
                  <div className="mt-1 w-6 h-6 rounded-full bg-dark border border-dark-border flex items-center justify-center flex-shrink-0">
                    <Activity size={11} className="text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-300 text-sm">{a.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {a.actor_name && (
                        <span className="text-gray-600 text-xs">{a.actor_name}</span>
                      )}
                      <span className="text-gray-700 text-xs flex items-center gap-0.5">
                        <Clock size={9} /> {timeAgo(a.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
