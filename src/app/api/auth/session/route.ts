import { NextRequest, NextResponse } from 'next/server';
import { getSession, createSession } from '@/lib/session';

export async function GET() {
  const session = getSession();
  return NextResponse.json(session || { userId: '', name: 'Friend' });
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    const session = createSession(name.trim());
    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}
