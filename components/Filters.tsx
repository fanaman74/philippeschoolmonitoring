'use client';
import type { EventType, Status } from '@/lib/types';

export interface FilterState {
  type: EventType | '';
  subject: string;
  status: Status | 'all';
  range: 'week' | 'fortnight' | 'month' | 'all';
}

interface Props {
  filters: FilterState;
  subjects: string[];
  onChange: (f: FilterState) => void;
}

export default function Filters({ filters, subjects, onChange }: Props) {
  function set(key: keyof FilterState, value: string) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div>
        <label className="text-xs text-gray-500 mr-1">Type</label>
        <select
          className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filters.type}
          onChange={e => set('type', e.target.value)}
        >
          <option value="">All types</option>
          <option value="homework">Homework</option>
          <option value="test">Test</option>
          <option value="project">Project</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-gray-500 mr-1">Subject</label>
        <select
          className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filters.subject}
          onChange={e => set('subject', e.target.value)}
        >
          <option value="">All subjects</option>
          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-gray-500 mr-1">Status</label>
        <select
          className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filters.status}
          onChange={e => set('status', e.target.value)}
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="done">Done</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-gray-500 mr-1">Range</label>
        <select
          className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filters.range}
          onChange={e => set('range', e.target.value)}
        >
          <option value="week">This week</option>
          <option value="fortnight">Next 2 weeks</option>
          <option value="month">Next month</option>
          <option value="all">All upcoming</option>
        </select>
      </div>
    </div>
  );
}
