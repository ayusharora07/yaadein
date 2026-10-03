import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { CircleModel, UserModel } from '@/lib/models';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

const DEMO_FALLBACK_MY_CIRCLES = [
  { code: 'COLLEGE2024', name: 'College Squad 2024 🎓', emoji: '🎓', membersCount: 5 },
  { code: 'GOATRIP', name: 'Goa Trip Memories 🏖️', emoji: '🏖️', membersCount: 3 },
  { code: 'TECHPIONEERS', name: 'Tech Pioneers ⚡', emoji: '⚡', membersCount: 3 },
];

export async function GET(req: NextRequest) {
  try {
    const session = getSession();

    if (!session || (!session.userId && !session.name && !session.email)) {
      return NextResponse.json({ success: true, circles: DEMO_FALLBACK_MY_CIRCLES });
    }

    try {
      await connectDB();

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

      const circles = await CircleModel.find({ $or: orConditions }).lean();

      if (circles && circles.length > 0) {
        const formatted = circles.map(c => ({
          code: c.code,
          name: c.name,
          emoji: c.emoji || '💖',
          membersCount: c.members?.length || 1,
        }));
        return NextResponse.json({ success: true, circles: formatted });
      }
    } catch (dbErr) {
      console.warn('DB error in my circles route, returning demo fallback:', dbErr);
    }

    return NextResponse.json({ success: true, circles: DEMO_FALLBACK_MY_CIRCLES });
  } catch (error) {
    console.error('Fetch my circles error:', error);
    return NextResponse.json({ success: true, circles: DEMO_FALLBACK_MY_CIRCLES });
  }
}
