import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, CheckSquare, Square, Plus, Package,
  Send, FileText, AlertTriangle, Pencil,
} from 'lucide-react';
import { clientsApi } from '../../api/client';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Badge from '../../components/UI/Badge';
import Modal from '../../components/UI/Modal';

const TABS = ['Checklist', 'Deliverables', 'Notes'];

const STATUS_BADGE = {
  Onboarding: 'yellow',
  Active:     'green',
  Completed:  'gray',
};

const DELIV_STATUS = {
  pending:   { variant: 'yellow', label: 'Pending' },
  sent:      { variant: 'blue',   label: 'Sent' },
  completed: { variant: 'green',  label: 'Completed' },
};

export default function ClientDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const qc       = useQueryClient();

  const [tab, setTab]         = useState('Checklist');
  const [note, setNote]       = useState('');
  const [addTask, setAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ task_name: '', due_date: '' });
  const [addDeliv, setAddDeliv] = useState(false);
  const [newDeliv, setNewDeliv]  = useState({ name: '', status: 'pending', notes: '' });

  const { data, isLoading, error } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsApi.getById(id).then(r => r.data),
  });

  const checkMutation = useMutation({
    mutationFn: ({ itemId, completed }) => clientsApi.updateChecklistItem(id, itemId, { completed }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client', id] }),
  });

  const addTaskMutation = useMutation({
    mutationFn: (d) => clientsApi.addChecklistItem(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['client', id] }); setAddTask(false); setNewTask({ task_name: '', due_date: '' }); },
  });

  const addDelivMutation = useMutation({
    mutationFn: (d) => clientsApi.addDeliverable(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['client', id] }); setAddDeliv(false); setNewDeliv({ name: '', status: 'pending', notes: '' }); },
  });

  const updateDelivMutation = useMutation({
    mutationFn: ({ delivId, status }) => clientsApi.updateDeliverable(id, delivId, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client', id] }),
  });

  const addNoteMutation = useMutation({
    mutationFn: (content) => clientsApi.addNote(id, content),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['client', id] }); setNote(''); },
  });

  if (isLoading) return <LoadingSpinner />;
  if (error || !data?.client) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertTriangle size={32} className="text-red-400" />
        <p className="text-white font-semibold">Client not found</p>
        <button onClick={() => navigate(-1)} className="text-gold text-sm hover:underline">Go back</button>
      </div>
    );
  }

  const { client, checklist = [], deliverables = [], notes = [] } = data;
  const done  = checklist.filter(t => t.completed).length;
  const total = checklist.length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition">
        <ArrowLeft size={16} /> Back to Clients
      </button>

      {/* Header */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
              <span className="text-gold text-xl font-bold">{(client.name || '?')[0].toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-white text-xl font-bold">{client.name}</h2>
              <p className="text-gray-500 text-sm">{client.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={STATUS_BADGE[client.status] || 'gray'}>{client.status}</Badge>
                {client.fulfillment_rep && (
                  <span className="text-gray-500 text-xs">Rep: {client.fulfillment_rep}</span>
                )}
              </div>
            </div>
          </div>
          {/* Progress ring summary */}
          <div className="text-center">
            <p className="text-gold text-3xl font-bold">{pct}%</p>
            <p className="text-gray-500 text-xs">{done}/{total} tasks done</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4 h-2 bg-dark-border rounded-full overflow-hidden">
          <div className="h-full bg-gold rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-card border border-dark-border rounded-xl p-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${tab === t ? 'bg-gold text-black' : 'text-gray-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Checklist ── */}
      {tab === 'Checklist' && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-white font-semibold">Onboarding Checklist</h3>
            <button onClick={() => setAddTask(true)}
              className="flex items-center gap-1.5 text-sm text-gold hover:text-gold-light transition">
              <Plus size={14} /> Add Task
            </button>
          </div>
          {checklist.length === 0 ? (
            <p className="text-gray-500 text-sm">No tasks yet.</p>
          ) : checklist.map(item => (
            <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-dark border border-dark-border hover:border-dark-border/80 transition">
              <button
                onClick={() => checkMutation.mutate({ itemId: item.id, completed: !item.completed })}
                className={`mt-0.5 flex-shrink-0 transition ${item.completed ? 'text-green-400' : 'text-gray-600 hover:text-gray-400'}`}
              >
                {item.completed ? <CheckSquare size={18} /> : <Square size={18} />}
              </button>
              <div className="flex-1">
                <p className={`text-sm ${item.completed ? 'line-through text-gray-500' : 'text-white'}`}>{item.task_name}</p>
                {item.due_date && (
                  <p className="text-gray-600 text-xs mt-0.5">Due: {new Date(item.due_date).toLocaleDateString()}</p>
                )}
                {item.completed && item.completed_at && (
                  <p className="text-green-600 text-xs mt-0.5">Completed {new Date(item.completed_at).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Deliverables ── */}
      {tab === 'Deliverables' && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Deliverables</h3>
            <button onClick={() => setAddDeliv(true)}
              className="flex items-center gap-1.5 text-sm text-gold hover:text-gold-light transition">
              <Plus size={14} /> Add Deliverable
            </button>
          </div>
          {deliverables.length === 0 ? (
            <p className="text-gray-500 text-sm">No deliverables tracked yet.</p>
          ) : (
            <div className="space-y-2">
              {deliverables.map(d => {
                const cfg = DELIV_STATUS[d.status] || DELIV_STATUS.pending;
                return (
                  <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg bg-dark border border-dark-border">
                    <Package size={14} className="text-gray-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{d.name}</p>
                      {d.notes && <p className="text-gray-500 text-xs truncate">{d.notes}</p>}
                    </div>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    <select
                      value={d.status}
                      onChange={e => updateDelivMutation.mutate({ delivId: d.id, status: e.target.value })}
                      className="bg-dark border border-dark-border text-gray-400 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-gold/60"
                    >
                      <option value="pending">Pending</option>
                      <option value="sent">Sent</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Notes ── */}
      {tab === 'Notes' && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-5 space-y-4">
          <form onSubmit={e => { e.preventDefault(); if (note.trim()) addNoteMutation.mutate(note.trim()); }} className="flex gap-2">
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              placeholder="Add a note about this client..."
              className="flex-1 bg-dark border border-dark-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gold/60 resize-none transition"
            />
            <button type="submit" disabled={!note.trim()}
              className="px-4 bg-gold hover:bg-gold-light disabled:opacity-50 text-black rounded-lg self-stretch flex items-center transition">
              <Send size={15} />
            </button>
          </form>
          <div className="space-y-3">
            {notes.length === 0 ? (
              <p className="text-gray-500 text-sm">No notes yet.</p>
            ) : notes.map(n => (
              <div key={n.id} className="p-3 bg-dark rounded-lg border border-dark-border">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white text-xs font-medium">{n.author_name || 'Team'}</span>
                  <span className="text-gray-600 text-xs">{new Date(n.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-300 text-sm whitespace-pre-line">{n.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      <Modal open={addTask} onClose={() => setAddTask(false)} title="Add Checklist Task">
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Task Name *</label>
            <input value={newTask.task_name} onChange={e => setNewTask(t => ({ ...t, task_name: e.target.value }))}
              placeholder="Complete onboarding call"
              className="w-full bg-dark border border-dark-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gold/60" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Due Date</label>
            <input type="date" value={newTask.due_date} onChange={e => setNewTask(t => ({ ...t, due_date: e.target.value }))}
              className="w-full bg-dark border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/60" />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setAddTask(false)} className="flex-1 px-4 py-2 border border-dark-border text-gray-400 rounded-lg text-sm hover:text-white transition">Cancel</button>
            <button
              disabled={!newTask.task_name.trim()}
              onClick={() => addTaskMutation.mutate(newTask)}
              className="flex-1 px-4 py-2 bg-gold hover:bg-gold-light disabled:opacity-50 text-black font-semibold rounded-lg text-sm transition">
              Add Task
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Deliverable Modal */}
      <Modal open={addDeliv} onClose={() => setAddDeliv(false)} title="Add Deliverable">
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Name *</label>
            <input value={newDeliv.name} onChange={e => setNewDeliv(d => ({ ...d, name: e.target.value }))}
              placeholder="Welcome packet"
              className="w-full bg-dark border border-dark-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gold/60" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Status</label>
            <select value={newDeliv.status} onChange={e => setNewDeliv(d => ({ ...d, status: e.target.value }))}
              className="w-full bg-dark border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/60">
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Notes</label>
            <textarea rows={2} value={newDeliv.notes} onChange={e => setNewDeliv(d => ({ ...d, notes: e.target.value }))}
              placeholder="Additional details..."
              className="w-full bg-dark border border-dark-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gold/60 resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setAddDeliv(false)} className="flex-1 px-4 py-2 border border-dark-border text-gray-400 rounded-lg text-sm hover:text-white transition">Cancel</button>
            <button
              disabled={!newDeliv.name.trim()}
              onClick={() => addDelivMutation.mutate(newDeliv)}
              className="flex-1 px-4 py-2 bg-gold hover:bg-gold-light disabled:opacity-50 text-black font-semibold rounded-lg text-sm transition">
              Add
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
