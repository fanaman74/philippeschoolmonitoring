export type EventType = 'homework' | 'test' | 'project';
export type Status = 'pending' | 'done';

export interface HomeworkItem {
  id: string;
  title: string;
  type: EventType;
  subject: string;
  dueDate: string;           // YYYY-MM-DD
  dueTime?: string;          // HH:MM (24h), absent = all-day
  durationMin?: number;
  notes?: string;
  reminderDaysBefore?: number;
  status: Status;
  htmlLink: string;          // Google Calendar event URL
}

export interface ItemInput {
  title: string;
  type: EventType;
  subject: string;
  dueDate: string;           // YYYY-MM-DD
  dueTime?: string;          // HH:MM
  durationMin?: number;      // default 30 when dueTime is set
  notes?: string;
  reminderDaysBefore?: number;
  status?: Status;           // absent = 'pending' on create
}
