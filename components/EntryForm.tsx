'use client';
import { useState } from 'react';
import type { EventType, ItemInput } from '@/lib/types';

interface Props {
  onCreated: () => void;
}

const SUBJECTS = ['Math', 'Science', 'French', 'English', 'History', 'Geography', 'Art', 'PE'];
const TYPES: { value: EventType; label: string }[] = [
  { value: 'homework', label: 'Homework' },
  { value: 'test', label: 'Test' },
  { value: 'project', label: 'Project' },
];

export default function EntryForm({ onCreated }: Props) {
  const [form, setForm] = useState<Partial<ItemInput>>({
    type: 'homework',
    reminderDaysBefore: 1,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof ItemInput>(key: K, value: ItemInput[K] | undefined) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create');
      setForm({ type: 'homework', reminderDaysBefore: 1 });
      onCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-4 space-y-3">
      <h2 className="font-semibold text-lg">Add Homework / Test</h2>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-2 rounded text-sm">{error}</div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {/* Title */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">Title *</label>
          <input
            required
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.title ?? ''}
            onChange={e => set('title', e.target.value)}
            placeholder="e.g. Chapter 5 test"
          />
        </div>
        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Type *</label>
          <select
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.type}
            onChange={e => set('type', e.target.value as EventType)}
          >
            {TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Subject *</label>
          <input
            required
            list="subjects-list"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.subject ?? ''}
            onChange={e => set('subject', e.target.value)}
            placeholder="e.g. Math"
          />
          <datalist id="subjects-list">
            {SUBJECTS.map(s => <option key={s} value={s} />)}
          </datalist>
        </div>
        {/* Due Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Due Date *</label>
          <input
            required
            type="date"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.dueDate ?? ''}
            onChange={e => set('dueDate', e.target.value)}
          />
        </div>
        {/* Due Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Due Time (optional)</label>
          <input
            type="time"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.dueTime ?? ''}
            onChange={e => set('dueTime', e.target.value || undefined)}
          />
        </div>
        {/* Duration — only shown when time is set */}
        {form.dueTime && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
            <input
              type="number"
              min={5}
              step={5}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.durationMin ?? 30}
              onChange={e => set('durationMin', parseInt(e.target.value, 10))}
            />
          </div>
        )}
        {/* Notes */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
          <textarea
            rows={2}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.notes ?? ''}
            onChange={e => set('notes', e.target.value || undefined)}
            placeholder="e.g. Pages 12-15"
          />
        </div>
        {/* Reminder */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Reminder</label>
          <select
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.reminderDaysBefore ?? 1}
            onChange={e => set('reminderDaysBefore', parseInt(e.target.value, 10))}
          >
            <option value={0}>None</option>
            <option value={1}>1 day before</option>
            <option value={2}>2 days before</option>
            <option value={3}>3 days before</option>
          </select>
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
      >
        {loading ? 'Adding…' : 'Add to Calendar'}
      </button>
    </form>
  );
}
