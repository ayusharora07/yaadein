import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { CircleModel, MomentModel, UserModel } from '@/lib/models';
import { getSession } from '@/lib/session';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

const DEMO_FALLBACK_CIRCLES = [
  { code: 'COLLEGE2024', name: 'College Squad 2024 🎓', emoji: '🎓', membersCount: 5 },
  { code: 'GOATRIP', name: 'Goa Trip Memories 🏖️', emoji: '🏖️', membersCount: 3 },
  { code: 'TECHPIONEERS', name: 'Tech Pioneers ⚡', emoji: '⚡', membersCount: 3 },
];

const DEMO_FALLBACK_POSTS = [
  {
    _id: 'm1',
    circleId: 'c1',
    circleName: 'College Squad 2024 🎓',
    circleCode: 'COLLEGE2024',
    circleEmoji: '🎓',
    createdBy: '65f1234567890abcdef00001',
    creatorName: 'Ayush Arora',
    type: 'photo',
    content: "Graduation Day memories with the best squad! Can't believe 4 years passed so fast 🎓✨",
    mediaUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1000&auto=format&fit=crop',
    tags: ['Graduation', 'SquadGoals', 'Nostalgia'],
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'm2',
    circleId: 'c1',
    circleName: 'College Squad 2024 🎓',
    circleCode: 'COLLEGE2024',
    circleEmoji: '🎓',
    createdBy: '65f1234567890abcdef00002',
    creatorName: 'Rohan Sharma',
    type: 'text',
    content: 'Late night study session at 3 AM before the final exams! Who else remembers drinking 5 cups of chai in Hostel 4? ☕📚',
    tags: ['CollegeLife', 'LateNight', 'Exams'],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    _id: 'm3',
    circleId: 'c2',
    circleName: 'Goa Trip Memories 🏖️',
    circleCode: 'GOATRIP',
    circleEmoji: '🏖️',
    createdBy: '65f1234567890abcdef00003',
    creatorName: 'Priya Patel',
    type: 'photo',
    content: 'Sunset at Baga Beach, Goa 🌅 Best trip ever!',
    mediaUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop',
    tags: ['Goa2024', 'BeachVibes'],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

export async function GET(req: NextRequest) {
  try {
    const session = getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    try {
      await connectDB();

      const userQuery: any[] = [];
      if (session.name) userQuery.push({ name: session.name });
      if (session.email) userQuery.push({ email: session.email.toLowerCase() });
      if (session.userId && mongoose.Types.ObjectId.isValid(session.userId)) {
        userQuery.push({ _id: session.userId });
      }

      const userDoc = userQuery.length > 0
        ? await UserModel.findOne({ $or: userQuery }).lean()
        : null;

      const userEmail = userDoc?.email ? userDoc.email.toLowerCase() : (session.email ? session.email.toLowerCase() : '');
      const userId = userDoc?._id?.toString() || session.userId;
      const userName = userDoc?.name || session.name;

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

      const circles = orConditions.length > 0
        ? await CircleModel.find({ $or: orConditions }).lean()
        : [];

      if (circles && circles.length > 0) {
        const circleIds = circles.map(c => c._id.toString());
        const circleMap: Record<string, { name: string; code: string; emoji: string }> = {};
        for (const c of circles) {
          circleMap[c._id.toString()] = { name: c.name, code: c.code, emoji: c.emoji || '✨' };
        }

        const moments = await MomentModel.find({ circleId: { $in: circleIds } })
          .sort({ createdAt: -1 })
          .limit(100)
          .lean();

        if (moments && moments.length > 0) {
          const posts = moments.map(m => ({
            _id: m._id.toString(),
            circleId: m.circleId,
            circleName: circleMap[m.circleId]?.name || 'Unknown',
            circleCode: circleMap[m.circleId]?.code || '',
            circleEmoji: circleMap[m.circleId]?.emoji || '✨',
            createdBy: m.createdBy,
            creatorName: m.creatorName,
            type: m.type,
            content: m.content,
            mediaUrl: m.mediaUrl || '',
            tags: m.tags || [],
            createdAt: m.createdAt,
          }));

          const circlesList = circles.map(c => ({
            code: c.code,
            name: c.name,
            emoji: c.emoji || '✨',
            membersCount: c.members?.length || 1,
          }));

          return NextResponse.json({ success: true, posts, circles: circlesList });
        }
      }
    } catch (dbErr) {
      console.warn('DB error in Feed API, returning demo fallback:', dbErr);
    }

    // Demo Fallback
    return NextResponse.json({
      success: true,
      posts: DEMO_FALLBACK_POSTS,
      circles: DEMO_FALLBACK_CIRCLES,
    });
  } catch (error) {
    console.error('Feed API error:', error);
    return NextResponse.json({ success: true, posts: DEMO_FALLBACK_POSTS, circles: DEMO_FALLBACK_CIRCLES });
  }
}
