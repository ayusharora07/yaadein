import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { UserModel } from '@/lib/models';
import { createSession } from '@/lib/session';
import { hashPassword } from '@/lib/auth-crypto';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user exists
    const existing = await UserModel.findOne({ email: cleanEmail });
    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Hash password securely with scrypt + salt before saving to database
    const hashedPassword = hashPassword(password);

    // Create user
    const user = await UserModel.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
    });

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
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create account' }, { status: 500 });
  }
}
