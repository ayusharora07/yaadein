import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { CircleModel } from '@/lib/models';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, description, emoji } = body;

    if (!name) {
      return NextResponse.json({ error: 'Circle name is required' }, { status: 400 });
    }

    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'You must be logged in to create a circle' }, { status: 401 });
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const circle = await CircleModel.create({
      name,
      description,
      emoji: emoji || '✨',
      code,
      createdBy: session.userId,
      members: [{
        userId: session.userId,
        name: session.name,
        email: session.email ? session.email.toLowerCase().trim() : '',
        joinedAt: new Date(),
      }]
    });

    return NextResponse.json(circle, { status: 201 });
  } catch (error) {
    console.error('Create circle error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
