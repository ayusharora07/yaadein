import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { CommentModel, MomentModel } from '@/lib/models';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const comments = await CommentModel.find({ momentId: params.id })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({ success: true, comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    const moment = await MomentModel.findById(params.id);
    if (!moment) {
      return NextResponse.json({ error: 'Moment not found' }, { status: 404 });
    }

    const comment = await CommentModel.create({
      momentId: params.id,
      circleId: moment.circleId,
      authorId: session.userId,
      authorName: session.name,
      content: content.trim(),
    });

    return NextResponse.json({ success: true, comment }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
