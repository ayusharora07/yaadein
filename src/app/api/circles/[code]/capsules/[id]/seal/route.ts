import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { CircleModel, CapsuleModel } from '@/lib/models';
import { getSession } from '@/lib/session';

export async function POST(
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

    if (capsule.createdBy !== session.userId) {
      return NextResponse.json({ error: 'Only the creator can seal the capsule' }, { status: 403 });
    }

    if (capsule.status !== 'open') {
      return NextResponse.json({ error: 'Capsule is already sealed or unlocked' }, { status: 400 });
    }

    capsule.status = 'sealed';
    capsule.sealedAt = new Date();
    await capsule.save();

    return NextResponse.json({ capsule }, { status: 200 });
  } catch (error) {
    console.error('Error sealing capsule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
