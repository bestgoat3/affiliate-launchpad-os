import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus, Search, User, Phone, Mail, Star,
  DollarSign, Clock, GripVertical,
} from 'lucide-react';
import { leadsApi } from '../../api/client';
import Modal from '../../components/UI/Modal';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const STAGES = [
  { id: 'New Lead',           color: '#3B82F6', light: 'bg-blue-500/15 text-blue-300' },
  { id: 'Booked Call',        color: '#6366F1', light: 'bg-indigo-500/15 text-indigo-300' },
  { id: 'Call Completed',     color: '#EAB308', light: 'bg-yellow-500/15 text-yellow-300' },
  { id: 'Proposal Sent',      color: '#F97316', light: 'bg-orange-500/15 text-orange-300' },
  { id: 'Closed Won',         color: '#22C55E', light: 'bg-green-500/15 text-green-300' },
  { id: 'Onboarding',         color: '#14B8A6', light: 'bg-teal-500/15 text-teal-300' },
  { id: 'Active Client',      color: '#10B981', light: 'bg-emerald-500/15 text-emerald-300' },
  { id: 'Upsell Opportunity', color: '#A855F7', light: 'bg-purple-500/15 text-purple-300' },
  { id: 'Churned Lost',       color: '#EF4444', light: 'bg-red-500/15 text-red-300' },
];

function scoreColor(score) {
  if (score >= 8) return 'bg-green-500';
  if (score >= 5) return 'bg-yellow-500';
  return 'bg-red-500';
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  const days = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  return days;
}

// ─── Draggable Lead Card ──────────────────────────────────────────────────────
function LeadCard({ lead, isDragging }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: sortableDragging } =
    useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: sortableDragging ? 0.4 : 1,
  };

  const days = daysSince(lead.updated_at || lead.created_at);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-dark border border-dark-border rounded-lg p-3 cursor-pointer hover:border-gold/30 transition-all group ${isDragging ? 'shadow-2xl rotate-1' : ''}`}
    >
      {/* Drag handle + name */}
      <div className="flex items-start gap-2 mb-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0"
          onClick={e => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </button>
        <div className="flex-1 min-w-0">
          <Link
            to={`/pipeline/lead/${lead.id}`}
            className="text-white text-sm font-medium hover:text-gold transition truncate block"
          >
            {lead.first_name} {lead.last_name}
          </Link>
          {lead.source && (
            <span className="text-gray-500 text-xs">{lead.source}</span>
          )}
        </div>
        {/* Lead score dot */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <div className={`w-2 h-2 rounded-full ${scoreColor(lead.lead_score)}`} />
          <span className="text-gray-500 text-xs">{lead.lead_score}</span>
        </div>
      </div>

      {/* Details */}
      <div className="ml-5 space-y-1">
        {lead.email && (
          <div className="flex items-center gap-1.5 text-gray-500 text-xs">
            <Mail size={10} />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-1.5 text-gray-500 text-xs">
            <Phone size={10} />
            <span>{lead.phone}</span>
          </div>
        )}
      </div>

      {/* Footer badges */}
      <div className="ml-5 mt-2 flex items-center gap-1.5 flex-wrap">
        {lead.budget && (
          <span className="bg-gold/10 text-gold text-xs px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <DollarSign size={9} />{lead.budget}
          </span>
        )}
        {days !== null && (
          <span className="text-gray-600 text-xs flex items-center gap-0.5">
            <Clock size={9} />{days}d
          </span>
        )}
        {lead.rep_name && (
          <span className="text-gray-600 text-xs flex items-center gap-0.5">
            <User size={9} />{lead.rep_name?.split(' ')[0]}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Stage Column ─────────────────────────────────────────────────────────────
function StageColumn({ stage, leads }) {
  const stageConfig = STAGES.find(s => s.id === stage) || STAGES[0];
  const totalValue = leads.reduce((sum, l) => {
    const n = parseInt((l.budget || '').replace(/[^0-9]/g, ''), 10);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  return (
    <div className="flex flex-col w-64 flex-shrink-0 bg-dark-card border border-dark-border rounded-xl overflow-hidden">
      {/* Column header */}
      <div className="px-3 py-2.5 border-b border-dark-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stageConfig.color }} />
          <span className="text-white text-xs font-semibold truncate max-w-[120px]">{stage}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {totalValue > 0 && (
            <span className="text-gray-500 text-xs">${(totalValue / 1000).toFixed(0)}K</span>
          )}
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${stageConfig.light}`}>
            {leads.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px] max-h-[calc(100vh-240px)]">
          {leads.map(lead => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
          {leads.length === 0 && (
            <div className="flex items-center justify-center h-20 text-gray-700 text-xs">
              No leads
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ─── Add Lead Modal ───────────────────────────────────────────────────────────
function AddLeadModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    source: '', monthly_revenue: '', budget: '', goal_90_days: '',
    lead_score: 5, stage: 'New Lead',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.first_name.trim()) return;
    setSaving(true);
    try {
      await onSave(form);
      setForm({ first_name: '', last_name: '', email: '', phone: '', source: '', monthly_revenue: '', budget: '', goal_90_days: '', lead_score: 5, stage: 'New Lead' });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const field = (label, key, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => set(key, e.target.value)}
        placeholder={placeholder}
        className="w-full bg-dark border border-dark-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/20 transition"
      />
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title="Add New Lead">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {field('First Name *', 'first_name', 'text', 'Jane')}
          {field('Last Name', 'last_name', 'text', 'Smith')}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {field('Email', 'email', 'email', 'jane@example.com')}
          {field('Phone', 'phone', 'tel', '+1 555 000 0000')}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Source</label>
            <select
              value={form.source}
              onChange={e => set('source', e.target.value)}
              className="w-full bg-dark border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/60 transition"
            >
              <option value="">Select source</option>
              {['TikTok','Instagram','YouTube','Friend/Referral','Other'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Stage</label>
            <select
              value={form.stage}
              onChange={e => set('stage', e.target.value)}
              className="w-full bg-dark border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/60 transition"
            >
              {STAGES.map(s => <option key={s.id} value={s.id}>{s.id}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {field('Monthly Revenue', 'monthly_revenue', 'text', '$0 — just starting')}
          {field('Budget', 'budget', 'text', '$1K–$3K')}
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Lead Score: {form.lead_score}</label>
          <input
            type="range" min="1" max="10" value={form.lead_score}
            onChange={e => set('lead_score', parseInt(e.target.value))}
            className="w-full accent-gold"
          />
        </div>
        {field('90-Day Goal', 'goal_90_days', 'text', 'Reach $5K/month')}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-dark-border text-gray-400 rounded-lg text-sm hover:text-white hover:border-gray-500 transition">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !form.first_name.trim()}
            className="flex-1 px-4 py-2 bg-gold hover:bg-gold-light disabled:opacity-50 text-black font-semibold rounded-lg text-sm transition"
          >
            {saving ? 'Saving...' : 'Add Lead'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Main Pipeline Page ───────────────────────────────────────────────────────
export default function Pipeline() {
  const qc = useQueryClient();
  const [search, setSearch]   = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const { data, isLoading } = useQuery({
    queryKey: ['leads-all'],
    queryFn: () => leadsApi.getAll({ limit: 500 }).then(r => r.data),
    refetchInterval: 30000,
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, stage }) => leadsApi.move(id, stage),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads-all'] }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => leadsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads-all'] }),
  });

  const allLeads = data?.leads || [];
  const filtered = search.trim()
    ? allLeads.filter(l =>
        `${l.first_name} ${l.last_name} ${l.email}`.toLowerCase().includes(search.toLowerCase())
      )
    : allLeads;

  const byStage = STAGES.reduce((acc, s) => {
    acc[s.id] = filtered.filter(l => l.stage === s.id);
    return acc;
  }, {});

  const activeCard = activeId ? allLeads.find(l => l.id === activeId) : null;

  const handleDragStart = useCallback(({ active }) => setActiveId(active.id), []);
  const handleDragEnd   = useCallback(({ active, over }) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const lead     = allLeads.find(l => l.id === active.id);
    const toStage  = STAGES.find(s => byStage[s.id]?.some(l => l.id === over.id))?.id
      || over.id;

    if (lead && toStage && toStage !== lead.stage) {
      moveMutation.mutate({ id: lead.id, stage: toStage });
    }
  }, [allLeads, byStage, moveMutation]);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 bg-dark-card border border-dark-border rounded-lg px-3 py-2 w-64">
          <Search size={15} className="text-gray-500 flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search leads..."
            className="bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none flex-1"
          />
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold-light text-black font-semibold text-sm rounded-lg transition"
        >
          <Plus size={15} />
          Add Lead
        </button>
      </div>

      {/* Board */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
            {STAGES.map(s => (
              <StageColumn key={s.id} stage={s.id} leads={byStage[s.id] || []} />
            ))}
          </div>
          <DragOverlay>
            {activeCard && <LeadCard lead={activeCard} isDragging />}
          </DragOverlay>
        </DndContext>
      )}

      <AddLeadModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={(data) => createMutation.mutateAsync(data)}
      />
    </div>
  );
}
