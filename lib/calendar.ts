import { google } from 'googleapis';
import type { calendar_v3 } from 'googleapis';
import type { EventType, HomeworkItem, ItemInput, Status } from './types';

// ── Constants ──────────────────────────────────────────────────────────────

const TYPE_TAG: Record<EventType, string> = {
  homework: '[HW]',
  test: '[TEST]',
  project: '[PRJ]',
};

const TAG_TO_TYPE: Record<string, EventType> = {
  '[HW]': 'homework',
  '[TEST]': 'test',
  '[PRJ]': 'project',
};

const TYPE_COLOR: Record<EventType, string> = {
  homework: '7',   // Peacock blue
  test: '11',      // Tomato red
  project: '5',    // Banana yellow
};

const DONE_COLOR = '8';    // Graphite
const DONE_PREFIX = '✓ ';

const TZ = process.env.TIMEZONE ?? 'Europe/Brussels';

// ── Encoding ───────────────────────────────────────────────────────────────

export function encodeEvent(input: ItemInput): calendar_v3.Schema$Event {
  const status = input.status ?? 'pending';
  const tag = TYPE_TAG[input.type];
  const summary = status === 'done'
    ? `${DONE_PREFIX}${tag} ${input.title}`
    : `${tag} ${input.title}`;

  const colorId = status === 'done' ? DONE_COLOR : TYPE_COLOR[input.type];

  const descLines = [`Subject: ${input.subject}`];
  if (input.notes) descLines.push(input.notes);
  const description = descLines.join('\n');

  let start: calendar_v3.Schema$EventDateTime;
  let end: calendar_v3.Schema$EventDateTime;

  if (input.dueTime) {
    const durationMin = input.durationMin ?? 30;
    const [h, m] = input.dueTime.split(':').map(Number);
    const startMinutes = h * 60 + m;
    const endMinutes = startMinutes + durationMin;
    const endH = Math.floor(endMinutes / 60) % 24;
    const endM = endMinutes % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    const dayOffset = Math.floor((startMinutes + durationMin) / (24 * 60));
    let endDate = input.dueDate;
    if (dayOffset > 0) {
      const d = new Date(input.dueDate);
      d.setDate(d.getDate() + dayOffset);
      endDate = d.toISOString().slice(0, 10);
    }
    start = { dateTime: `${input.dueDate}T${pad(h)}:${pad(m)}:00`, timeZone: TZ };
    end = { dateTime: `${endDate}T${pad(endH)}:${pad(endM)}:00`, timeZone: TZ };
  } else {
    start = { date: input.dueDate };
    // Google Calendar requires end date to be exclusive (next day for all-day events)
    const endDate = new Date(input.dueDate);
    endDate.setDate(endDate.getDate() + 1);
    end = { date: endDate.toISOString().slice(0, 10) };
  }

  const reminders: calendar_v3.Schema$EventReminders = {
    useDefault: false,
    overrides: input.reminderDaysBefore != null
      ? [{ method: 'popup', minutes: input.reminderDaysBefore * 24 * 60 }]
      : [],
  };

  return { summary, colorId, description, start, end, reminders };
}

// ── Decoding ───────────────────────────────────────────────────────────────

export function decodeEvent(event: calendar_v3.Schema$Event): HomeworkItem | null {
  if (!event.id || !event.summary) return null;

  let summary = event.summary;
  const isDone = summary.startsWith(DONE_PREFIX);
  if (isDone) summary = summary.slice(DONE_PREFIX.length);

  const tagMatch = summary.match(/^(\[HW\]|\[TEST\]|\[PRJ\])\s*/);
  if (!tagMatch) return null;

  const type = TAG_TO_TYPE[tagMatch[1]];
  const title = summary.slice(tagMatch[0].length);

  const descLines = (event.description ?? '').split('\n');
  const subjectLine = descLines.find(l => l.startsWith('Subject: '));
  if (!subjectLine) return null;
  const subject = subjectLine.slice('Subject: '.length);
  const notes = descLines
    .filter(l => !l.startsWith('Subject: '))
    .join('\n')
    .trim() || undefined;

  let dueDate: string;
  let dueTime: string | undefined;
  let durationMin: number | undefined;

  if (event.start?.date) {
    dueDate = event.start.date;
  } else if (event.start?.dateTime) {
    dueDate = event.start.dateTime.slice(0, 10);
    dueTime = event.start.dateTime.slice(11, 16);
    if (event.end?.dateTime) {
      const startSec = timeToMinutes(event.start.dateTime.slice(11, 16));
      const endSec = timeToMinutes(event.end.dateTime.slice(11, 16));
      durationMin = endSec >= startSec
        ? endSec - startSec
        : (24 * 60 - startSec) + endSec;
    }
  } else {
    return null;
  }

  const reminderOverride = event.reminders?.overrides?.[0];
  const reminderDaysBefore = reminderOverride?.minutes != null
    ? Math.round(reminderOverride.minutes / (24 * 60))
    : undefined;

  return {
    id: event.id,
    title,
    type,
    subject,
    dueDate,
    dueTime,
    durationMin,
    notes,
    reminderDaysBefore,
    status: isDone ? 'done' : 'pending',
    htmlLink: event.htmlLink ?? '',
  };
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// ── Calendar client (added in Task 4) ─────────────────────────────────────
// Placeholder exports so API routes can import without error during dev.
// These are replaced with real implementations in Task 4.
export async function listItems(_filters: Record<string, string | undefined> = {}): Promise<HomeworkItem[]> {
  throw new Error('Not implemented yet');
}
export async function createItem(_input: ItemInput): Promise<HomeworkItem> {
  throw new Error('Not implemented yet');
}
export async function updateItem(_id: string, _patch: Partial<ItemInput>): Promise<HomeworkItem> {
  throw new Error('Not implemented yet');
}
export async function deleteItem(_id: string): Promise<void> {
  throw new Error('Not implemented yet');
}
