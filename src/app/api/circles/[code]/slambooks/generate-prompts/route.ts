import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getSession } from '@/lib/session';
import { connectDB } from '@/lib/db';
import { CircleModel } from '@/lib/models';
import { generateText } from '@/lib/ai';

// ── Fallback Prompts by Relationship Type ──────────────────
const COUPLE_PROMPTS = [
  { question: "What's the first thing you noticed about me?", category: 'nostalgic' },
  { question: "What's a small thing I do that makes your whole day better?", category: 'deep' },
  { question: "What song makes you think of us?", category: 'nostalgic' },
  { question: "What's a memory of ours you replay in your head the most?", category: 'nostalgic' },
  { question: "If we could teleport anywhere right now, where would you take us?", category: 'fun' },
  { question: "What's something you've never said out loud to me?", category: 'deep' },
  { question: "Describe our relationship in exactly 3 words.", category: 'quirky' },
  { question: "What's the most ridiculous thing we've argued or laughed about?", category: 'fun' },
  { question: "What's one dream you want us to chase together?", category: 'deep' },
  { question: "What's my most adorable habit that I don't even realize?", category: 'quirky' },
  { question: "What was our best date or spontaneous trip ever?", category: 'nostalgic' },
  { question: "What's one thing that always makes us laugh no matter how bad the day is?", category: 'fun' },
  { question: "What is your absolute favorite picture of us?", category: 'nostalgic' },
  { question: "Where do you see us 5 years from now?", category: 'deep' },
];

const FAMILY_PROMPTS = [
  { question: "What's the funniest family memory that still gets brought up at dinner?", category: 'fun' },
  { question: "What's a tradition or recipe in our family you want to keep forever?", category: 'nostalgic' },
  { question: "Who is the biggest trouble-maker in this family?", category: 'quirky' },
  { question: "What song reminds you of family road trips or gatherings?", category: 'nostalgic' },
  { question: "What's one piece of wisdom from our family that stuck with you?", category: 'deep' },
  { question: "If our family was a TV sitcom, what would it be called?", category: 'fun' },
  { question: "What's something you deeply appreciate about this family?", category: 'deep' },
  { question: "Describe each family member in one funny sentence.", category: 'quirky' },
];

const WORK_PROMPTS = [
  { question: "What's the most legendary deadline or project chaos we survived together?", category: 'fun' },
  { question: "What's our unwritten team rule or inside joke?", category: 'quirky' },
  { question: "Who is most likely to send a Slack/Teams message at 2 AM?", category: 'fun' },
  { question: "What's your favorite memory from our team outings or coffee breaks?", category: 'nostalgic' },
  { question: "What's one secret talent of someone on this team that surprised you?", category: 'quirky' },
  { question: "If our team started a company startup, what would we sell?", category: 'fun' },
  { question: "What's something you admire about working with this group?", category: 'deep' },
];

const GROUP_PROMPTS = [
  { question: "What's your favorite memory with this group?", category: 'nostalgic' },
  { question: "What's the most chaotic thing we've done together?", category: 'fun' },
  { question: "What song instantly reminds you of us?", category: 'nostalgic' },
  { question: "What's something you've never told anyone in this group?", category: 'deep' },
  { question: "If you could relive one day we spent together, which one?", category: 'nostalgic' },
  { question: "What's each person's hidden superpower?", category: 'quirky' },
  { question: "Describe each person here in one emoji.", category: 'fun' },
  { question: "What will we all be doing 10 years from now?", category: 'deep' },
  { question: "What's the inside joke that will never die?", category: 'fun' },
  { question: "What's one trip or adventure we absolutely need to take?", category: 'fun' },
];

// Helper to infer relationship context
function detectRelationshipContext(
  circleName: string = '',
  circleDesc: string = '',
  theme: string = '',
  memberCount: number = 2
): { type: string; promptGuide: string; fallbacks: Array<{ question: string; category: string }> } {
  const combinedText = `${circleName} ${circleDesc} ${theme}`.toLowerCase();

  // 1. If 2 members, ALWAYS treat as a couple/pair (never group)
  if (memberCount <= 2) {
    return {
      type: 'couple',
      promptGuide:
        'These TWO people share an intimate bond (a couple, best partners, or duo). Questions MUST be 1-on-1, intimate, cute, and personal. Strictly DO NOT use words like "group", "crew", "everyone", or "friend group". Focus on shared history, cute habits, romance, future dreams, favorite memories together, and funny moments.',
      fallbacks: COUPLE_PROMPTS,
    };
  }

  // 2. Family detection
  const isFamily =
    combinedText.includes('family') ||
    combinedText.includes('parivaar') ||
    combinedText.includes('mom') ||
    combinedText.includes('dad') ||
    combinedText.includes('parents') ||
    combinedText.includes('siblings') ||
    combinedText.includes('cousin') ||
    combinedText.includes('home') ||
    combinedText.includes('ghar');

  if (isFamily) {
    return {
      type: 'family',
      promptGuide:
        'This circle is a family. Questions should focus on warmth, shared household memories, holiday traditions, childhood nostalgia, funny family dynamics, and heartfelt appreciation.',
      fallbacks: FAMILY_PROMPTS,
    };
  }

  // 3. Work / Office detection
  const isWork =
    combinedText.includes('work') ||
    combinedText.includes('office') ||
    combinedText.includes('team') ||
    combinedText.includes('colleague') ||
    combinedText.includes('slack') ||
    combinedText.includes('company') ||
    combinedText.includes('sprint') ||
    combinedText.includes('tech');

  if (isWork) {
    return {
      type: 'work',
      promptGuide:
        'This circle is an office team or workplace colleagues. Questions should be fun, witty, relatable workplace banter, coffee break memories, team outings, and appreciation.',
      fallbacks: WORK_PROMPTS,
    };
  }

  // 4. General group / friends (3+ members)
  return {
    type: 'group',
    promptGuide:
      memberCount <= 5
        ? 'This is a tight-knit circle of friends. Questions should feel personal, warm, witty, and specific — avoiding dry survey questions.'
        : 'This is a large circle of friends/buddies. Questions should cover group memories, chaotic moments, inside jokes, and future predictions.',
    fallbacks: GROUP_PROMPTS,
  };
}

// Creative angle themes for random variation on every generation click
const VARIATION_ANGLES = [
  'Focus on quirky habits, funny mishaps, and hilarious secret confessions.',
  'Focus on nostalgia, favorite music, early memories, and sentimental milestones.',
  'Focus on hypothetical future scenarios, dream trips, and 10-year predictions.',
  'Focus on deep appreciation, emotional gratitude, unwritten rules, and inside jokes.',
  'Focus on lighthearted banter, superlatives (who is most likely to...), and favorite places.',
];

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const session = getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { theme = '', count = 10 } = body;

    // Fetch circle using uppercase code matching
    await connectDB();
    const circle = await CircleModel.findOne({ code: params.code.toUpperCase() }).lean();
    const memberCount = circle?.members?.length ?? 2;
    const circleName = circle?.name || '';
    const circleDesc = circle?.description || '';

    const context = detectRelationshipContext(circleName, circleDesc, theme, memberCount);

    // Pick a random variation angle to guarantee freshness every time user clicks "Generate"
    const randomAngle = VARIATION_ANGLES[Math.floor(Math.random() * VARIATION_ANGLES.length)];
    const randomSeed = Math.floor(Math.random() * 10000);

    const prompt = `Generate ${count} unique slam book questions for a circle named "${circleName}".
Context: ${context.promptGuide}
${theme ? `User Specified Theme: ${theme}` : ''}
Creative Angle for this batch: ${randomAngle} (Variation Seed: #${randomSeed})

RULES:
1. Return ONLY a valid JSON array of objects with "question" and "category" fields.
2. Categories MUST be one of: "fun", "nostalgic", "deep", or "quirky".
3. Questions MUST be unique, highly creative, specific, and emotionally engaging.
4. Never generate generic or repeated standard questions.

Example format:
[{"question":"What's a small thing I do that always makes you smile?","category":"deep"}]`;

    // Try AI generation via Gemini API -> Groq API -> Local Ollama (handled inside generateText)
    const rawAiResponse = await generateText(prompt, {
      temperature: 0.95, // High creativity/variation
      maxTokens: 1200,
    });

    if (rawAiResponse) {
      try {
        const jsonMatch = rawAiResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return NextResponse.json({
              prompts: parsed.slice(0, count).map((p: Record<string, any>) => ({
                id: nanoid(),
                question: p.question || p.Question || "What's a memory you treasure?",
                category: ['fun', 'nostalgic', 'deep', 'quirky'].includes(String(p.category).toLowerCase())
                  ? String(p.category).toLowerCase()
                  : 'fun',
              })),
            });
          }
        }
      } catch (err) {
        console.warn('[AI] Failed to parse JSON array from AI response, using shuffled fallbacks:', err);
      }
    }

    // ── Smart Fallback (Shuffled so it's not identical every click) ──
    const shuffledFallbacks = [...context.fallbacks].sort(() => 0.5 - Math.random());
    const fallbackPrompts = shuffledFallbacks.slice(0, count).map(p => ({
      id: nanoid(),
      ...p,
    }));

    return NextResponse.json({ prompts: fallbackPrompts });
  } catch (error) {
    console.error('Error in generate-prompts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
