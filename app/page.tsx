'use client';
import { useState, useEffect, useCallback } from 'react';
import EntryForm from '@/components/EntryForm';
import Filters, { type FilterState } from '@/components/Filters';
import ItemList from '@/components/ItemList';
import type { HomeworkItem } from '@/lib/types';

const DEFAULT_FILTERS: FilterState = {
  type: '',
  subject: '',
  status: 'pending',
  range: 'fortnight',
};

function rangeToDateParams(range: FilterState['range']): { from: string; to: string } {
  const from = new Date().toISOString().slice(0, 10);
  const daysMap: Record<FilterState['range'], number> = {
    week: 7,
    fortnight: 14,
    month: 30,
    all: 365,
  };
  const to = new Date(Date.now() + daysMap[range] * 86400000).toISOString().slice(0, 10);
  return { from, to };
}

export default function HomePage() {
  const [items, setItems] = useState<HomeworkItem[]>([]);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { from, to } = rangeToDateParams(filters.range);
      const params = new URLSearchParams({ from, to });
      if (filters.type) params.set('type', filters.type);
      if (filters.subject) params.set('subject', filters.subject);
      if (filters.status !== 'all') params.set('status', filters.status);

      const res = await fetch(`/api/events?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load items');
      setItems(data.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const subjects = [...new Set(items.map(i => i.subject))].sort();

  return (
    <main className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">📚 Homework Tracker</h1>

      <EntryForm onCreated={fetchItems} />

      <section className="space-y-3">
        <Filters filters={filters} subjects={subjects} onChange={setFilters} />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm flex justify-between items-center">
            <span>{error}</span>
            <button onClick={fetchItems} className="underline text-red-600 ml-3">
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-gray-400 text-sm text-center py-4">Loading…</p>
        ) : (
          <ItemList items={items} onUpdate={fetchItems} />
        )}
      </section>
    </main>
  );
}
