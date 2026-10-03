import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { SlamBookModel, CircleModel } from '@/lib/models';
import { getSession } from '@/lib/session';

export async function POST(request: Request, { params }: { params: { code: string, id: string } }) {
  try {
    const session = getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const circle = await CircleModel.findOne({ code: params.code });
    if (!circle) return NextResponse.json({ error: 'Circle not found' }, { status: 404 });

    const body = await request.json();
    const { answers } = body;

    if (!answers || !answers.length) {
      return NextResponse.json({ error: 'Answers are required' }, { status: 400 });
    }

    const slambook = await SlamBookModel.findOne({ _id: params.id, circleId: circle._id });
    if (!slambook) return NextResponse.json({ error: 'Slambook not found' }, { status: 404 });

    // Check if user already submitted
    const existingEntryIndex = slambook.entries.findIndex((e: any) => e.userId === session.userId);
    
    const newEntry = {
      userId: session.userId,
      userName: session.name,
      answers,
      completedAt: new Date()
    };

    if (existingEntryIndex > -1) {
      slambook.entries[existingEntryIndex] = newEntry;
    } else {
      slambook.entries.push(newEntry);
    }

    await slambook.save();

    return NextResponse.json(slambook);
  } catch (error) {
    console.error('Error submitting slambook entry:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
