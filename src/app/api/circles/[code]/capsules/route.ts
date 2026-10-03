import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { CircleModel, CapsuleModel } from '@/lib/models';
import { getSession } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
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

    const capsules = await CapsuleModel.find({ circleId: circle._id }).sort({ createdAt: -1 });

    return NextResponse.json({ capsules });
  } catch (error) {
    console.error('Error fetching capsules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, unlockAt } = await request.json();

    if (!title || !unlockAt) {
      return NextResponse.json({ error: 'Title and unlock date are required' }, { status: 400 });
    }

    await connectDB();
    const circle = await CircleModel.findOne({ code: params.code });
    if (!circle) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    const newCapsule = new CapsuleModel({
      circleId: circle._id,
      createdBy: session.userId,
      creatorName: session.name,
      title,
      description,
      status: 'open',
      unlockAt: new Date(unlockAt),
      contributions: [],
    });

    await newCapsule.save();

    return NextResponse.json({ capsule: newCapsule }, { status: 201 });
  } catch (error) {
    console.error('Error creating capsule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
