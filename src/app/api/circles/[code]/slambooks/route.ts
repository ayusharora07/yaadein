import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { SlamBookModel, CircleModel } from '@/lib/models';
import { getSession } from '@/lib/session';

export async function GET(request: Request, { params }: { params: { code: string } }) {
  try {
    const session = getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const circle = await CircleModel.findOne({ code: params.code.toUpperCase() });
    if (!circle) return NextResponse.json({ error: 'Circle not found' }, { status: 404 });

    const slambooks = await SlamBookModel.find({ circleId: circle._id }).sort({ createdAt: -1 });
    return NextResponse.json(slambooks);
  } catch (error) {
    console.error('Error fetching slambooks:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { code: string } }) {
  try {
    const session = getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const circle = await CircleModel.findOne({ code: params.code.toUpperCase() });
    if (!circle) return NextResponse.json({ error: 'Circle not found' }, { status: 404 });

    const body = await request.json();
    const { title, description, prompts, isPrivate } = body;

    if (!title || !prompts || !prompts.length) {
      return NextResponse.json({ error: 'Title and prompts are required' }, { status: 400 });
    }

    const slambook = await SlamBookModel.create({
      circleId: circle._id,
      createdBy: session.userId,
      title,
      description,
      prompts,
      isPrivate: isPrivate === true,
      entries: []
    });

    return NextResponse.json(slambook, { status: 201 });
  } catch (error) {
    console.error('Error creating slambook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
