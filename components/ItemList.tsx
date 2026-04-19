'use client';
import { useState } from 'react';
import type { HomeworkItem } from '@/lib/types';

interface Props {
  items: HomeworkItem[];
  onUpdate: () => void;
}

const TYPE_BADGE: Record<string, string> = {
  homework: 'bg-blue-100 text-blue-800',
  test: 'bg-red-100 text-red-800',
  project: 'bg-yellow-100 text-yellow-800',
};

function relativeLabel(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff === -1) return 'yesterday';
  if (diff < 0) return `${Math.abs(diff)}d ago`;
  return `in ${diff}d`;
}

export default function ItemList({ items, onUpdate }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function toggleDone(item: HomeworkItem) {
    setLoadingId(item.id);
    setActionError(null);
    try {
      const res = await fetch(`/api/events/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: item.status === 'done' ? 'pending' : 'done' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to update');
      }
      onUpdate();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(item: HomeworkItem) {
    if (!confirm(`Delete "${item.title}"?`)) return;
    setLoadingId(item.id);
    setActionError(null);
    try {
      const res = await fetch(`/api/events/${item.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to delete');
      }
      onUpdate();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setLoadingId(null);
    }
  }

  if (items.length === 0) {
    return (
      <>
        {actionError && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-2">{actionError}</div>}
        <p className="text-gray-400 text-sm py-6 text-center">No items found.</p>
      </>
    );
  }

  return (
    <div className="space-y-2">
      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{actionError}</div>
      )}
      {items.map(item => (
        <div
          key={item.id}
          className={`border rounded-xl p-3 flex items-start gap-3 transition-opacity ${item.status === 'done' ? 'opacity-50' : ''}`}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_BADGE[item.type]}`}>
                {item.type}
              </span>
              <span className="text-xs font-medium text-gray-600">{item.subject}</span>
              <span className="text-xs text-gray-400">
                {item.dueDate}{item.dueTime ? ` ${item.dueTime}` : ''}{' '}
                <span className="font-medium">({relativeLabel(item.dueDate)})</span>
              </span>
            </div>
            <p className={`font-medium mt-1 text-sm ${item.status === 'done' ? 'line-through text-gray-400' : ''}`}>
              {item.title}
            </p>
            {item.notes && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">{item.notes}</p>
            )}
          </div>
          <div className="flex gap-1.5 shrink-0">
            <button
              onClick={() => toggleDone(item)}
              disabled={loadingId === item.id}
              title={item.status === 'done' ? 'Mark pending' : 'Mark done'}
              className="text-xs px-2 py-1 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              {item.status === 'done' ? 'Undo' : '✓'}
            </button>
            <a
              href={item.htmlLink}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in Google Calendar"
              className="text-xs px-2 py-1 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              📅
            </a>
            <button
              onClick={() => handleDelete(item)}
              disabled={loadingId === item.id}
              title="Delete"
              className="text-xs px-2 py-1 rounded-md border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-40 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
