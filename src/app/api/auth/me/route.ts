import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { UserModel } from '@/lib/models';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  await connectDB();
  const user = await UserModel.findOne({ name: session.name }).lean();

  return NextResponse.json({
    authenticated: true,
    user: user ? {
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    } : {
      userId: session.userId,
      name: session.name,
      email: '',
      avatar: '👤',
    }
  });
}
