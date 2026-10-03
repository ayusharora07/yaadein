import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { CircleModel, CapsuleModel } from '@/lib/models';
import { getSession } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string; id: string } }
) {
  try {
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const circle = await CircleModel.findOne({ code: params.code });
    if (!circle) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    const capsule = await CapsuleModel.findOne({ _id: params.id, circleId: circle._id });
    if (!capsule) {
      return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
    }

    return NextResponse.json({ capsule });
  } catch (error) {
    console.error('Error fetching capsule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
