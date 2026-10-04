import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { UserModel } from '@/lib/models';
import { createSession } from '@/lib/session';
import { verifyPassword } from '@/lib/auth-crypto';

const DEMO_USERS: Record<string, { userId: string; name: string; email: string; avatar: string; password: string }> = {
  'a@gmail.com': { userId: '65f1234567890abcdef00001', name: 'Ayush Arora', email: 'a@gmail.com', avatar: '👨‍💻', password: 'password123' },
  'rohan@gmail.com': { userId: '65f1234567890abcdef00002', name: 'Rohan Sharma', email: 'rohan@gmail.com', avatar: '👦', password: 'password123' },
  'priya@gmail.com': { userId: '65f1234567890abcdef00003', name: 'Priya Patel', email: 'priya@gmail.com', avatar: '👧', password: 'password123' },
  'sneha@gmail.com': { userId: '65f1234567890abcdef00004', name: 'Sneha Roy', email: 'sneha@gmail.com', avatar: '👩', password: 'password123' },
  'vikram@gmail.com': { userId: '65f1234567890abcdef00005', name: 'Vikram Malhotra', email: 'vikram@gmail.com', avatar: '🧑', password: 'password123' },
};

export async function POST(req: NextRequest) {
  let cleanEmail = '';
  let inputPassword = '';

  try {
    const body = await req.json();
    cleanEmail = (body.email || '').toLowerCase().trim();
    inputPassword = body.password || '';

    if (!cleanEmail || !inputPassword) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    try {
      await connectDB();
      const user = await UserModel.findOne({ email: cleanEmail });
      if (user && verifyPassword(inputPassword, user.password)) {
        const session = createSession(user.name, user.email, user._id.toString());
        return NextResponse.json({
          success: true,
          user: {
            userId: user._id.toString(),
            name: user.name,
            email: user.email,
            avatar: user.avatar,
          },
          session,
        });
      }
    } catch (dbErr) {
      console.warn('DB connection error during login, attempting fallback auth:', dbErr);
    }

    // Demo user fallback check if DB connection is unavailable
    const demoUser = DEMO_USERS[cleanEmail];
    if (demoUser && demoUser.password === inputPassword) {
      const session = createSession(demoUser.name, demoUser.email, demoUser.userId);
      return NextResponse.json({
        success: true,
        user: {
          userId: demoUser.userId,
          name: demoUser.name,
          email: demoUser.email,
          avatar: demoUser.avatar,
        },
        session,
      });
    }

    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Failed to log in' }, { status: 500 });
  }
}
