import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { SlamBookModel, CircleModel } from '@/lib/models';
import { getSession } from '@/lib/session';

export async function GET(request: Request, { params }: { params: { code: string, id: string } }) {
  try {
    const session = getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const circle = await CircleModel.findOne({ code: params.code });
    if (!circle) return NextResponse.json({ error: 'Circle not found' }, { status: 404 });

    const slambook = await SlamBookModel.findOne({ _id: params.id, circleId: circle._id });
    if (!slambook) return NextResponse.json({ error: 'Slambook not found' }, { status: 404 });

    return NextResponse.json(slambook);
  } catch (error) {
    console.error('Error fetching slambook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
