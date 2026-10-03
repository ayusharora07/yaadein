import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { CircleModel, UserModel } from '@/lib/models';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = getSession();

    if (!session || (!session.userId && !session.name && !session.email)) {
      return NextResponse.json({ success: true, circles: [] });
    }

    const userEmail = session.email ? session.email.toLowerCase().trim() : '';
    const userId = session.userId;
    const userName = session.name ? session.name.trim() : '';

    const orConditions: any[] = [];
    if (userId) {
      orConditions.push({ createdBy: userId });
      orConditions.push({ 'members.userId': userId });
    }
    if (userEmail) {
      orConditions.push({ 'members.email': userEmail });
    }
    if (userName) {
      orConditions.push({ 'members.name': { $regex: new RegExp(`^${userName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
    }

    // Find all circles where this user is creator or member
    const circles = await CircleModel.find({ $or: orConditions }).lean();

    const formatted = circles.map(c => ({
      code: c.code,
      name: c.name,
      emoji: c.emoji || '💖',
      membersCount: c.members?.length || 1,
    }));

    return NextResponse.json({ success: true, circles: formatted });
  } catch (error) {
    console.error('Fetch my circles error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch circles' }, { status: 500 });
  }
}
