import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { CircleModel } from '@/lib/models';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    await connectDB();

    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'You must be logged in to join a circle' }, { status: 401 });
    }

    const circle = await CircleModel.findOne({ code: params.code.toUpperCase() });
    if (!circle) {
      return NextResponse.json({ error: 'Circle not found — check your invite code' }, { status: 404 });
    }

    // Check if already a member
    const isMember = circle.members.some((m: any) =>
      m.userId === session.userId ||
      m.name?.toLowerCase() === session.name?.toLowerCase()
    );

    if (!isMember) {
      circle.members.push({
        userId: session.userId,
        name: session.name,
        joinedAt: new Date(),
      });
      await circle.save();
    }

    return NextResponse.json({ success: true, circle });
  } catch (error) {
    console.error('Join circle error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
