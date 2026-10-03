import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { CircleModel, ChatMessageModel } from '@/lib/models';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
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

    const messages = await ChatMessageModel.find({ circleId: circle._id.toString() })
      .sort({ createdAt: 1 })
      .limit(200)
      .lean();

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
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

    const body = await req.json();
    const { content, mediaUrl } = body;

    if (!content && !mediaUrl) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const message = await ChatMessageModel.create({
      circleId: circle._id.toString(),
      senderId: session.userId,
      senderName: session.name,
      content: content || '',
      mediaUrl: mediaUrl || '',
    });

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error) {
    console.error('Error sending chat message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
