import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { CircleModel, UserModel } from '@/lib/models';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    await connectDB();
    const circle = await CircleModel.findOne({ code: params.code.toUpperCase() });
    if (!circle) return NextResponse.json({ error: 'Circle not found' }, { status: 404 });

    return NextResponse.json(circle.members || []);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    await connectDB();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email address is mandatory to add a friend' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Look up registered user by email
    const registeredUser = await UserModel.findOne({ email: cleanEmail });
    if (!registeredUser) {
      return NextResponse.json({
        error: `No registered account found for "${cleanEmail}". Ask your friend to sign up for Yaadein first, or share the invite code!`
      }, { status: 404 });
    }

    const circle = await CircleModel.findOne({ code: params.code.toUpperCase() });
    if (!circle) return NextResponse.json({ error: 'Circle not found' }, { status: 404 });

    // Check if user is already in circle by userId or email
    const isMember = circle.members.some((m: any) =>
      m.userId === registeredUser._id.toString() ||
      m.email?.toLowerCase() === cleanEmail ||
      m.name?.toLowerCase() === registeredUser.name.toLowerCase()
    );

    if (isMember) {
      return NextResponse.json({ error: `${registeredUser.name} is already a member of this circle!` }, { status: 400 });
    }

    circle.members.push({
      userId: registeredUser._id.toString(),
      name: registeredUser.name,
      email: registeredUser.email,
      joinedAt: new Date(),
    });
    await circle.save();

    return NextResponse.json({ success: true, members: circle.members, addedUser: registeredUser.name });
  } catch (error) {
    console.error('Error adding member:', error);
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
  }
}
