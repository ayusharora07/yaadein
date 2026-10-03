import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { CircleModel } from '@/lib/models';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const circle = await CircleModel.findOne({ code: params.code.toUpperCase() });
    if (!circle) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    // Remove user from members list
    circle.members = circle.members.filter((m: any) =>
      m.userId !== session.userId &&
      m.name?.toLowerCase() !== session.name?.toLowerCase()
    );

    await circle.save();

    return NextResponse.json({ success: true, message: 'Left circle successfully' });
  } catch (error) {
    console.error('Leave circle error:', error);
    return NextResponse.json({ error: 'Failed to leave circle' }, { status: 500 });
  }
}
