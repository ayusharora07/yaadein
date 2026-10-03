import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { CircleModel, CapsuleModel } from '@/lib/models';
import { getSession } from '@/lib/session';
import { nanoid } from 'nanoid';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string; id: string } }
) {
  try {
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, content, mediaUrl } = await request.json();

    if (!type || !content) {
      return NextResponse.json({ error: 'Type and content are required' }, { status: 400 });
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

    if (capsule.status !== 'open') {
      return NextResponse.json({ error: 'Capsule is not open for contributions' }, { status: 400 });
    }

    const contribution = {
      id: nanoid(),
      userId: session.userId,
      userName: session.name,
      type,
      content,
      mediaUrl,
      addedAt: new Date(),
    };

    capsule.contributions.push(contribution);
    await capsule.save();

    return NextResponse.json({ contribution }, { status: 201 });
  } catch (error) {
    console.error('Error adding contribution:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
