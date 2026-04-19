import { NextRequest, NextResponse } from 'next/server';
import { updateItem, deleteItem } from '@/lib/calendar';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const item = await updateItem(id, body);
    return NextResponse.json({ item });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const isNotFound = message.includes('not found');
    return NextResponse.json(
      { error: message, code: isNotFound ? 'NOT_FOUND' : 'INTERNAL_ERROR' },
      { status: isNotFound ? 404 : 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteItem(id);
    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message, code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
