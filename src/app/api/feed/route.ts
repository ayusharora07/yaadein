import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { CircleModel, MomentModel, UserModel } from '@/lib/models';
import { getSession } from '@/lib/session';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

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

    if (circles.length === 0) {
      return NextResponse.json({ success: true, posts: [], circles: [] });
    }

    const circleIds = circles.map(c => c._id.toString());
    const circleMap: Record<string, { name: string; code: string; emoji: string }> = {};
    for (const c of circles) {
      circleMap[c._id.toString()] = { name: c.name, code: c.code, emoji: c.emoji || '✨' };
    }

    const moments = await MomentModel.find({ circleId: { $in: circleIds } })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

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
  } catch (error) {
    console.error('Feed API error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch feed' }, { status: 500 });
  }
}
