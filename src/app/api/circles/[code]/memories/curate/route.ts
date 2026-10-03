// AI Memory Curator — generates stories from memories
// This is the core AI agent feature, designed for Mastra integration
// Currently uses direct Ollama calls; will be wrapped in Mastra agent orchestration

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { MomentModel, CircleModel, MemoryStoryModel } from '@/lib/models';
import { generateText } from '@/lib/ai';

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

    // Step 1: Find circle
    const circle = await CircleModel.findOne({ code: params.code });
    if (!circle) {
      return NextResponse.json({ success: false, error: 'Circle not found' }, { status: 404 });
    }

    const circleId = circle._id.toString();

    // Step 2: Retrieve relevant memories (Agent: searchMemories tool)
    let memories;
    try {
      memories = await MomentModel.find(
        { circleId, $text: { $search: query } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(30)
        .lean();
    } catch {
      const regex = new RegExp(query.split(/\s+/).join('|'), 'i');
      memories = await MomentModel.find({
        circleId,
        $or: [{ content: regex }, { tags: regex }],
      })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean();
    }

    if (!memories || memories.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          narrative: 'No memories found matching your query. Try adding more moments first!',
          timeline: [],
          query,
        },
      });
    }

    // Step 3: Group and classify memories (Agent: groupByTheme tool)
    const memoryList = memories.map((m: Record<string, unknown>) => ({
      id: (m._id as string).toString(),
      content: m.content as string,
      creator: m.creatorName as string,
      date: new Date(m.createdAt as string).toISOString(),
      type: m.type as string,
    }));

    // Step 4: Generate narrative (Agent: composeStory tool)
    const storyPrompt = `You are a warm, nostalgic storyteller. A group of friends asked you to "${query}".

Here are their shared memories (sorted by date):
${memoryList.map(m => `[${new Date(m.date).toLocaleDateString()}] ${m.creator}: "${m.content}"`).join('\n')}

Write a beautiful, emotionally resonant narrative (200-400 words) that:
1. Weaves these memories into a cohesive story
2. References specific details from the memories
3. Captures the warmth and depth of the friendship
4. Uses a slightly poetic but accessible tone
5. Organizes chronologically where it makes sense

Also generate a timeline of 3-5 key moments from the memories.
Format the response as:

NARRATIVE:
[your narrative here]

TIMELINE:
- [date]: [title] - [one sentence summary]
- [date]: [title] - [one sentence summary]`;

    const aiResponse = await generateText(storyPrompt, { temperature: 0.8, maxTokens: 2048 });

    let narrative = '';
    const timeline: Array<{ date: Date; title: string; summary: string; momentId?: string }> = [];

    if (aiResponse) {
      // Parse narrative
      const narrativeMatch = aiResponse.match(/NARRATIVE:\s*([\s\S]*?)(?=TIMELINE:|$)/);
      narrative = narrativeMatch ? narrativeMatch[1].trim() : aiResponse;

      // Parse timeline
      const timelineMatch = aiResponse.match(/TIMELINE:\s*([\s\S]*)/);
      if (timelineMatch) {
        const lines = timelineMatch[1].split('\n').filter(l => l.trim().startsWith('-'));
        for (const line of lines) {
          const match = line.match(/-\s*\[?(.*?)\]?:\s*(.*?)\s*-\s*(.*)/);
          if (match) {
            timeline.push({
              date: new Date(match[1]) || new Date(),
              title: match[2].trim(),
              summary: match[3].trim(),
            });
          }
        }
      }
    } else {
      // Fallback when AI is unavailable
      narrative = `Here are ${memories.length} memories related to "${query}". ` +
        `They span moments shared by your friend circle, capturing the essence of your time together. ` +
        `While I couldn't generate a full narrative (AI service is currently unavailable), ` +
        `each memory below tells its own part of your story.`;
    }

    // Step 5: Save the story
    const story = await MemoryStoryModel.create({
      circleId,
      query,
      memories: memoryList.map(m => m.id),
      timeline,
      narrative,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: story._id.toString(),
        narrative,
        timeline,
        memoriesUsed: memoryList.length,
        query,
      },
    });
  } catch (error) {
    console.error('[MemoryCurator] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to curate memories' }, { status: 500 });
  }
}
