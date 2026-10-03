import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { CircleModel } from '@/lib/models';

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    await connectDB();
    const circle = await CircleModel.findOne({ code: params.code.toUpperCase() }).lean();
    
    if (!circle) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }
    
    return NextResponse.json(circle);
  } catch (error) {
    console.error('Get circle error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
