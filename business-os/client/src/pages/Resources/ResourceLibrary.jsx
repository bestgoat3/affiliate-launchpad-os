import React, { useState, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileText, Video, Link2, Trash2, ExternalLink, Search, BookOpen } from 'lucide-react';
import { resourcesApi } from '../../api/client';
import { AuthContext } from '../../context/AuthContext';
import Modal from '../../components/UI/Modal';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Badge from '../../components/UI/Badge';

const TYPES   = ['', 'pdf', 'video', 'link'];
const TYPE_ICONS  = { pdf: FileText, video: Video, link: Link2 };
const TYPE_STYLES = {
  pdf:   'text-red-400 bg-red-400/10 border-red-400/20',
  video: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  link:  'text-green-400 bg-green-400/10 border-green-400/20',
};

function AddResourceModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({
    title: '', description: '', type: 'link', url: '', visible_to_clients: true,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(form);
    setForm({ title: '', description: '', type: 'link', url: '', visible_to_clients: true });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Resource">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Title *</label>
          <input required value={form.title} onChange={e => set('title', e.target.value)}
            placeholder="TikTok Shop Affiliate Quick-Start Guide"
            className="w-full bg-dark border border-dark-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gold/60" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Description</label>
          <textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Brief description of what this resource covers..."
            className="w-full bg-dark border border-dark-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gold/60 resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Type</label>
            <select value={form.type} onChange={e => set('type', e.target.value)}
              className="w-full bg-dark border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-gold/60">
              <option value="link">Link</option>
              <option value="pdf">PDF</option>
              <option value="video">Video</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer pb-2">
              <input
                type="checkbox"
                checked={form.visible_to_clients}
                onChange={e => set('visible_to_clients', e.target.checked)}
                className="accent-gold"
              />
              <span className="text-gray-400 text-sm">Visible to clients</span>
            </label>
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">URL *</label>
          <input required type="url" value={form.url} onChange={e => set('url', e.target.value)}
            placeholder="https://..."
            className="w-full bg-dark border border-dark-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gold/60" />
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-dark-border text-gray-400 rounded-lg text-sm hover:text-white transition">Cancel</button>
          <button type="submit" className="flex-1 px-4 py-2 bg-gold hover:bg-gold-light text-black font-semibold rounded-lg text-sm transition">Add Resource</button>
        </div>
      </form>
    </Modal>
  );
}

export default function ResourceLibrary() {
  const { hasRole } = useContext(AuthContext);
  const qc = useQueryClient();
  const canManage = hasRole('admin', 'fulfillment');

  const [search, setSearch]   = useState('');
  const [typeFilter, setType] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['resources', typeFilter],
    queryFn: () => resourcesApi.getAll({ type: typeFilter || undefined }).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: resourcesApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resources'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: resourcesApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resources'] }),
  });

  const resources = data?.resources || [];
  const filtered  = search.trim()
    ? resources.filter(r => `${r.title} ${r.description || ''}`.toLowerCase().includes(search.toLowerCase()))
    : resources;

  // Group by type
  const grouped = TYPES.slice(1).reduce((acc, t) => {
    acc[t] = filtered.filter(r => r.type === t);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-dark-card border border-dark-border rounded-lg px-3 py-2 w-64">
            <Search size={14} className="text-gray-500 flex-shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search resources..."
              className="bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none flex-1" />
          </div>
          <div className="flex gap-2">
            {TYPES.map(t => (
              <button key={t} onClick={() => setType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${typeFilter === t ? 'bg-gold text-black' : 'bg-dark-card border border-dark-border text-gray-400 hover:text-white'}`}>
                {t || 'All'}
              </button>
            ))}
          </div>
        </div>
        {canManage && (
          <button onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold-light text-black font-semibold text-sm rounded-lg transition">
            <Plus size={14} /> Add Resource
          </button>
        )}
      </div>

      {isLoading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <div className="bg-dark-card border border-dark-border rounded-xl p-12 text-center">
          <BookOpen size={40} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            {search || typeFilter ? 'No resources match your filters.' : 'No resources yet.'}
            {canManage && !search && !typeFilter && ' Click "Add Resource" to get started.'}
          </p>
        </div>
      ) : typeFilter ? (
        // Flat list when filtered
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(r => <ResourceCard key={r.id} resource={r} canManage={canManage} onDelete={id => deleteMutation.mutate(id)} />)}
        </div>
      ) : (
        // Grouped view
        Object.entries(grouped).map(([type, items]) => items.length === 0 ? null : (
          <div key={type}>
            <h3 className="text-white font-semibold mb-3 capitalize flex items-center gap-2">
              {React.createElement(TYPE_ICONS[type] || Link2, { size: 16, className: TYPE_STYLES[type]?.split(' ')[0] })}
              {type === 'pdf' ? 'PDFs & Documents' : type === 'video' ? 'Videos' : 'Links'}
              <span className="text-gray-600 text-sm font-normal">({items.length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map(r => <ResourceCard key={r.id} resource={r} canManage={canManage} onDelete={id => deleteMutation.mutate(id)} />)}
            </div>
          </div>
        ))
      )}

      <AddResourceModal open={addOpen} onClose={() => setAddOpen(false)} onSave={d => createMutation.mutateAsync(d)} />
    </div>
  );
}

function ResourceCard({ resource: r, canManage, onDelete }) {
  const Icon   = TYPE_ICONS[r.type] || Link2;
  const styles = TYPE_STYLES[r.type] || 'text-gray-400 bg-gray-400/10 border-gray-400/20';

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-4 flex flex-col gap-3 hover:border-gold/20 transition group">
      <div className="flex items-start justify-between gap-2">
        <div className={`p-2.5 rounded-xl border ${styles}`}>
          <Icon size={18} />
        </div>
        {canManage && (
          <button onClick={() => onDelete(r.id)} className="p-1.5 text-gray-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="flex-1">
        <p className="text-white font-medium text-sm line-clamp-2 leading-snug">{r.title}</p>
        {r.description && (
          <p className="text-gray-500 text-xs mt-1 line-clamp-2">{r.description}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        {r.visible_to_clients
          ? <Badge variant="green" className="text-xs">Client visible</Badge>
          : <Badge variant="gray" className="text-xs">Internal only</Badge>
        }
        <a href={r.url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-gold hover:text-gold-light text-xs transition font-medium">
          Open <ExternalLink size={11} />
        </a>
      </div>
    </div>
  );
}
