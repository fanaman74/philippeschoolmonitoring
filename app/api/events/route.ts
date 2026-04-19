import { NextRequest, NextResponse } from 'next/server';
import { listItems, createItem, type ListFilters } from '@/lib/calendar';
import type { EventType, Status } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const p = new URL(request.url).searchParams;
    const filters: ListFilters = {
      from: p.get('from') ?? undefined,
      to: p.get('to') ?? undefined,
      type: (p.get('type') as EventType) ?? undefined,
      subject: p.get('subject') ?? undefined,
      status: (p.get('status') as Status) ?? undefined,
    };
    const items = await listItems(filters);
    return NextResponse.json({ items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message, code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, type, subject, dueDate } = body;
    if (!title || !type || !subject || !dueDate) {
      return NextResponse.json(
        { error: 'title, type, subject, and dueDate are required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }
    const item = await createItem(body);
    return NextResponse.json({ item }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message, code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
