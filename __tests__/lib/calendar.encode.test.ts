import { describe, it, expect } from 'vitest';
import { encodeEvent, decodeEvent } from '@/lib/calendar';
import type { ItemInput } from '@/lib/types';

describe('encodeEvent', () => {
  it('encodes a minimal all-day homework item', () => {
    const input: ItemInput = {
      title: 'Read chapter 5',
      type: 'homework',
      subject: 'Math',
      dueDate: '2026-05-01',
    };
    const event = encodeEvent(input);
    expect(event.summary).toBe('[HW] Read chapter 5');
    expect(event.colorId).toBe('7');
    expect(event.description).toBe('Subject: Math');
    expect(event.start).toEqual({ date: '2026-05-01' });
    expect(event.end).toEqual({ date: '2026-05-01' });
    expect(event.reminders?.useDefault).toBe(false);
    expect(event.reminders?.overrides).toEqual([]);
  });

  it('encodes a test item', () => {
    const input: ItemInput = {
      title: 'Chapter 3 exam',
      type: 'test',
      subject: 'Science',
      dueDate: '2026-05-02',
    };
    const event = encodeEvent(input);
    expect(event.summary).toBe('[TEST] Chapter 3 exam');
    expect(event.colorId).toBe('11');
  });

  it('encodes a project item', () => {
    const input: ItemInput = {
      title: 'Poster',
      type: 'project',
      subject: 'History',
      dueDate: '2026-05-03',
    };
    const event = encodeEvent(input);
    expect(event.summary).toBe('[PRJ] Poster');
    expect(event.colorId).toBe('5');
  });

  it('encodes a timed event with dueTime and durationMin', () => {
    const input: ItemInput = {
      title: 'Oral exam',
      type: 'test',
      subject: 'French',
      dueDate: '2026-05-04',
      dueTime: '09:00',
      durationMin: 60,
    };
    const event = encodeEvent(input);
    expect(event.start).toEqual({ dateTime: '2026-05-04T09:00:00', timeZone: 'Europe/Brussels' });
    expect(event.end).toEqual({ dateTime: '2026-05-04T10:00:00', timeZone: 'Europe/Brussels' });
  });

  it('defaults durationMin to 30 when dueTime set but no durationMin', () => {
    const input: ItemInput = {
      title: 'Oral exam',
      type: 'test',
      subject: 'French',
      dueDate: '2026-05-04',
      dueTime: '09:00',
    };
    const event = encodeEvent(input);
    expect(event.end).toEqual({ dateTime: '2026-05-04T09:30:00', timeZone: 'Europe/Brussels' });
  });

  it('encodes a done item with ✓ prefix and gray color', () => {
    const input: ItemInput = {
      title: 'Essay',
      type: 'project',
      subject: 'English',
      dueDate: '2026-05-05',
      status: 'done',
    };
    const event = encodeEvent(input);
    expect(event.summary).toBe('✓ [PRJ] Essay');
    expect(event.colorId).toBe('8');
  });

  it('appends notes after the Subject line in description', () => {
    const input: ItemInput = {
      title: 'Exercises',
      type: 'homework',
      subject: 'French',
      dueDate: '2026-05-06',
      notes: 'Pages 12-15',
    };
    const event = encodeEvent(input);
    expect(event.description).toBe('Subject: French\nPages 12-15');
  });

  it('encodes a reminder as a popup override in minutes', () => {
    const input: ItemInput = {
      title: 'Test',
      type: 'test',
      subject: 'Math',
      dueDate: '2026-05-07',
      reminderDaysBefore: 2,
    };
    const event = encodeEvent(input);
    expect(event.reminders?.overrides).toEqual([
      { method: 'popup', minutes: 2880 },
    ]);
  });
});

describe('decodeEvent', () => {
  it('returns null when event has no id', () => {
    expect(decodeEvent({ summary: '[HW] Something', start: { date: '2026-05-01' } })).toBeNull();
  });

  it('returns null when summary has no recognized tag', () => {
    expect(decodeEvent({
      id: 'abc',
      summary: 'Doctor appointment',
      description: 'Family event',
      start: { date: '2026-05-01' },
      end: { date: '2026-05-01' },
    })).toBeNull();
  });

  it('returns null when description has no Subject line', () => {
    expect(decodeEvent({
      id: 'abc',
      summary: '[HW] Something',
      description: 'no subject here',
      start: { date: '2026-05-01' },
      end: { date: '2026-05-01' },
    })).toBeNull();
  });

  it('round-trips a pending all-day homework item', () => {
    const input: ItemInput = {
      title: 'Read chapter 5',
      type: 'homework',
      subject: 'Math',
      dueDate: '2026-05-01',
      notes: 'Pages 1-10',
      reminderDaysBefore: 1,
    };
    const encoded = encodeEvent(input);
    const decoded = decodeEvent({ ...encoded, id: 'evt1', htmlLink: 'https://cal.google.com/evt1' });
    expect(decoded).not.toBeNull();
    expect(decoded!.id).toBe('evt1');
    expect(decoded!.title).toBe('Read chapter 5');
    expect(decoded!.type).toBe('homework');
    expect(decoded!.subject).toBe('Math');
    expect(decoded!.dueDate).toBe('2026-05-01');
    expect(decoded!.dueTime).toBeUndefined();
    expect(decoded!.notes).toBe('Pages 1-10');
    expect(decoded!.reminderDaysBefore).toBe(1);
    expect(decoded!.status).toBe('pending');
  });

  it('round-trips a done project item', () => {
    const input: ItemInput = {
      title: 'Essay',
      type: 'project',
      subject: 'English',
      dueDate: '2026-05-03',
      status: 'done',
    };
    const encoded = encodeEvent(input);
    const decoded = decodeEvent({ ...encoded, id: 'evt2', htmlLink: '' });
    expect(decoded!.status).toBe('done');
    expect(decoded!.title).toBe('Essay');
    expect(decoded!.type).toBe('project');
  });

  it('round-trips a timed test item', () => {
    const input: ItemInput = {
      title: 'Oral exam',
      type: 'test',
      subject: 'French',
      dueDate: '2026-05-04',
      dueTime: '09:00',
      durationMin: 60,
    };
    const encoded = encodeEvent(input);
    const decoded = decodeEvent({ ...encoded, id: 'evt3', htmlLink: '' });
    expect(decoded!.dueDate).toBe('2026-05-04');
    expect(decoded!.dueTime).toBe('09:00');
    expect(decoded!.durationMin).toBe(60);
  });
});
