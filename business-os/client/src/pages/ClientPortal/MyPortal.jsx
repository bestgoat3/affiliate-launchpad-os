import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckSquare, Square, BookOpen, Video, FileText, Link2, Star } from 'lucide-react';
import { clientsApi, resourcesApi } from '../../api/client';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Badge from '../../components/UI/Badge';

const RESOURCE_ICONS = { pdf: FileText, video: Video, link: Link2 };
const RESOURCE_COLORS = { pdf: 'text-red-400 bg-red-400/10', video: 'text-blue-400 bg-blue-400/10', link: 'text-green-400 bg-green-400/10' };

export default function MyPortal() {
  const { data: portalData, isLoading: pLoading } = useQuery({
    queryKey: ['my-portal'],
    queryFn: () => clientsApi.getAll({ me: true }).then(r => r.data),
  });

  const { data: resourceData, isLoading: rLoading } = useQuery({
    queryKey: ['resources-client'],
    queryFn: () => resourcesApi.getAll().then(r => r.data),
  });

  const client    = portalData?.client || portalData?.clients?.[0];
  const checklist = portalData?.checklist || [];
  const resources = resourceData?.resources || [];

  const done  = checklist.filter(t => t.completed).length;
  const total = checklist.length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  if (pLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-gold/10 to-transparent border border-gold/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gold/20 rounded-xl flex items-center justify-center">
            <Star size={20} className="text-gold" />
          </div>
          <div>
            <h2 className="text-white text-xl font-bold">Welcome to Your Portal</h2>
            <p className="text-gray-400 text-sm">Track your progress and access all resources here.</p>
          </div>
        </div>
        {client && (
          <p className="text-gold text-sm mt-3">
            Program status: <span className="font-semibold">{client.status}</span>
          </p>
        )}
      </div>

      {/* Progress overview */}
      {total > 0 && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold">Your Onboarding Progress</h3>
            <span className="text-gold font-bold text-lg">{pct}%</span>
          </div>
          <div className="h-3 bg-dark-border rounded-full overflow-hidden mb-2">
            <div className="h-full bg-gold rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-gray-500 text-xs">{done} of {total} tasks completed</p>

          {/* Checklist */}
          <div className="mt-4 space-y-2">
            {checklist.map(item => (
              <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-dark border border-dark-border">
                <div className={`mt-0.5 flex-shrink-0 ${item.completed ? 'text-green-400' : 'text-gray-600'}`}>
                  {item.completed ? <CheckSquare size={16} /> : <Square size={16} />}
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${item.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                    {item.task_name}
                  </p>
                  {item.due_date && !item.completed && (
                    <p className="text-gray-600 text-xs mt-0.5">Due: {new Date(item.due_date).toLocaleDateString()}</p>
                  )}
                  {item.completed && item.completed_at && (
                    <p className="text-green-600 text-xs mt-0.5">
                      ✓ Completed {new Date(item.completed_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resources */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={17} className="text-gold" />
          <h3 className="text-white font-semibold">Your Resources</h3>
        </div>
        {rLoading ? <LoadingSpinner /> : resources.length === 0 ? (
          <p className="text-gray-500 text-sm">No resources have been added yet. Check back soon!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {resources.map(r => {
              const Icon = RESOURCE_ICONS[r.type] || Link2;
              const colors = RESOURCE_COLORS[r.type] || 'text-gray-400 bg-gray-400/10';
              return (
                <a
                  key={r.id}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-dark border border-dark-border hover:border-gold/30 transition group"
                >
                  <div className={`p-2 rounded-lg flex-shrink-0 ${colors}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium group-hover:text-gold transition truncate">
                      {r.title}
                    </p>
                    {r.description && (
                      <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{r.description}</p>
                    )}
                    <span className="text-gray-600 text-xs uppercase tracking-wide mt-1 block">{r.type}</span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Support */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <h3 className="text-white font-semibold mb-2">Need Help?</h3>
        <p className="text-gray-400 text-sm">
          Your dedicated success manager is here to support you. Reach out any time via the contact info below.
        </p>
        <div className="mt-3 p-3 bg-dark rounded-lg border border-dark-border">
          <p className="text-gold font-medium text-sm">Karl — Program Director</p>
          <p className="text-gray-500 text-xs mt-0.5">Available Mon–Fri, 9am–6pm EST</p>
        </div>
      </div>
    </div>
  );
}
