import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/db';
import { CircleModel, MomentModel, UserModel } from '@/lib/models';
import FeedClient from './FeedClient';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export default async function FeedPage() {
  // Auth guard
  const session = getSession();
  if (!session) {
    redirect('/login');
  }

  let posts: any[] = [];
  let circlesList: any[] = [];

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

    // Fetch user's circles strictly by userId/email/name
    const circles = orConditions.length > 0
      ? await CircleModel.find({ $or: orConditions }).lean()
      : [];

    const circleIds = circles.map(c => c._id.toString());
    const circleMap: Record<string, { name: string; code: string; emoji: string }> = {};
    for (const c of circles) {
      circleMap[c._id.toString()] = { name: c.name, code: c.code, emoji: c.emoji || '✨' };
    }

    // Fetch moments from those circles
    const moments = circleIds.length > 0
      ? await MomentModel.find({ circleId: { $in: circleIds } })
          .sort({ createdAt: -1 })
          .limit(100)
          .lean()
      : [];

    posts = moments.map(m => ({
      _id: m._id.toString(),
      circleId: m.circleId,
      circleName: circleMap[m.circleId]?.name || 'Unknown',
      circleCode: circleMap[m.circleId]?.code || '',
      circleEmoji: circleMap[m.circleId]?.emoji || '✨',
      createdBy: m.createdBy,
      creatorName: m.creatorName,
      type: m.type as 'text' | 'photo' | 'voice',
      content: m.content,
      mediaUrl: m.mediaUrl || '',
      tags: m.tags || [],
      createdAt: m.createdAt.toISOString(),
    }));

    circlesList = circles.map(c => ({
      code: c.code,
      name: c.name,
      emoji: c.emoji || '✨',
      membersCount: c.members?.length || 1,
    }));
  } catch (error) {
    console.error('Error loading feed data from MongoDB:', error);
  }

  return (
    <FeedClient
      userName={session.name}
      initialPosts={posts}
      initialCircles={circlesList}
    />
  );
}
