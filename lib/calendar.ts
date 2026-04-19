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

  const reminders: { useDefault: boolean; overrides: calendar_v3.Schema$EventReminder[] } = {
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

// ── Calendar client factory ────────────────────────────────────────────────

function getClient(): { client: calendar_v3.Calendar; calendarId: string } {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const calendarId = process.env.CALENDAR_ID;
  if (!json) throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON env var');
  if (!calendarId) throw new Error('Missing CALENDAR_ID env var');
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(json),
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  return { client: google.calendar({ version: 'v3', auth }), calendarId };
}

// ── CRUD ───────────────────────────────────────────────────────────────────

export interface ListFilters {
  from?: string;
  to?: string;
  type?: EventType;
  subject?: string;
  status?: Status;
}

export async function listItems(filters: ListFilters = {}): Promise<HomeworkItem[]> {
  const { client, calendarId } = getClient();

  const timeMin = filters.from
    ? new Date(filters.from).toISOString()
    : new Date().toISOString();
  const timeMax = filters.to
    ? new Date(filters.to + 'T23:59:59').toISOString()
    : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

  const res = await client.events.list({
    calendarId,
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 250,
  });

  const items = (res.data.items ?? [])
    .map(decodeEvent)
    .filter((i): i is HomeworkItem => i !== null);

  return items.filter(item => {
    if (filters.type && item.type !== filters.type) return false;
    if (filters.subject && item.subject.toLowerCase() !== filters.subject.toLowerCase()) return false;
    if (filters.status && item.status !== filters.status) return false;
    return true;
  });
}

export async function createItem(input: ItemInput): Promise<HomeworkItem> {
  const { client, calendarId } = getClient();
  const resource = encodeEvent({ ...input, status: 'pending' });
  const res = await client.events.insert({ calendarId, requestBody: resource });
  const decoded = decodeEvent(res.data);
  if (!decoded) throw new Error('Failed to decode created event');
  return decoded;
}

export async function updateItem(id: string, patch: Partial<ItemInput>): Promise<HomeworkItem> {
  const { client, calendarId } = getClient();
  const existing = await client.events.get({ calendarId, eventId: id });
  const current = decodeEvent(existing.data);
  if (!current) throw new Error('Event not found or not a homework item');

  const merged: ItemInput = {
    title: patch.title ?? current.title,
    type: patch.type ?? current.type,
    subject: patch.subject ?? current.subject,
    dueDate: patch.dueDate ?? current.dueDate,
    dueTime: patch.dueTime ?? current.dueTime,
    durationMin: patch.durationMin ?? current.durationMin,
    notes: patch.notes ?? current.notes,
    reminderDaysBefore: patch.reminderDaysBefore ?? current.reminderDaysBefore,
    status: patch.status ?? current.status,
  };

  const resource = encodeEvent(merged);
  const res = await client.events.patch({ calendarId, eventId: id, requestBody: resource });
  const decoded = decodeEvent(res.data);
  if (!decoded) throw new Error('Failed to decode updated event');
  return decoded;
}

export async function deleteItem(id: string): Promise<void> {
  const { client, calendarId } = getClient();
  await client.events.delete({ calendarId, eventId: id });
}
