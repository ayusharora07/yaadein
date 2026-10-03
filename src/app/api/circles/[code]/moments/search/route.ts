// AI-powered memory search API
// Uses MongoDB text search (upgradeable to Atlas Vector Search in production)

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { MomentModel, CircleModel } from '@/lib/models';
import { generateMemorySummary } from '@/lib/ai';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    await connectDB();

    const { query } = await request.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ success: false, error: 'Query is required' }, { status: 400 });
    }

    // Find circle
    const circle = await CircleModel.findOne({ code: params.code });
    if (!circle) {
      return NextResponse.json({ success: false, error: 'Circle not found' }, { status: 404 });
    }

    // Text search in MongoDB (production would use Atlas Vector Search)
    let moments;
    try {
      moments = await MomentModel.find(
        {
          circleId: circle._id.toString(),
          $text: { $search: query },
        },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(20)
        .lean();
    } catch {
      // Fallback to regex search if text index isn't ready
      const regex = new RegExp(query.split(/\s+/).join('|'), 'i');
      moments = await MomentModel.find({
        circleId: circle._id.toString(),
        $or: [
          { content: regex },
          { tags: regex },
          { transcript: regex },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
    }

    // Generate AI summary of search results
    let aiSummary = null;
    if (moments.length > 0) {
      aiSummary = await generateMemorySummary(
        query,
        moments.map((m: Record<string, unknown>) => ({
          content: m.content as string,
          creatorName: m.creatorName as string,
          createdAt: new Date(m.createdAt as string).toLocaleDateString(),
        }))
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        moments: JSON.parse(JSON.stringify(moments)),
        aiSummary,
        count: moments.length,
      },
    });
  } catch (error) {
    console.error('[Search] Error:', error);
    return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 });
  }
}
