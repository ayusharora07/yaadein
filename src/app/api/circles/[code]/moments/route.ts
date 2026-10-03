import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { CircleModel, MomentModel } from '@/lib/models';
import { getSession } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const circle = await CircleModel.findOne({ code: params.code.toUpperCase() });
    if (!circle) return NextResponse.json({ error: 'Circle not found' }, { status: 404 });

    // Verify membership
    const isMember = circle.members.some((m: any) =>
      m.userId === session.userId || m.name?.toLowerCase() === session.name?.toLowerCase()
    ) || circle.createdBy === session.userId;

    if (!isMember) {
      return NextResponse.json({ error: 'You are not a member of this circle' }, { status: 403 });
    }

    const moments = await MomentModel.find({ circleId: circle._id.toString() })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(moments);
  } catch (error) {
    console.error('Error fetching moments:', error);
    return NextResponse.json({ error: 'Failed to fetch moments' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    await connectDB();
    const session = getSession();

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { type, content, mediaUrl, tags } = body;

    if (!content) return NextResponse.json({ error: 'Content is required' }, { status: 400 });

    const circle = await CircleModel.findOne({ code: params.code.toUpperCase() });
    if (!circle) return NextResponse.json({ error: 'Circle not found' }, { status: 404 });

    const moment = await MomentModel.create({
      circleId: circle._id.toString(),
      createdBy: session.userId,
      creatorName: session.name,
      type: type || 'text',
      content,
      mediaUrl: mediaUrl || '',
      tags: tags || [],
    });

    return NextResponse.json(moment, { status: 201 });
  } catch (error) {
    console.error('Error creating moment:', error);
    return NextResponse.json({ error: 'Failed to create moment' }, { status: 500 });
  }
}
