import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getSession } from '@/lib/session';

const DEFAULT_PROMPTS = [
  { question: "What's your favorite memory with this group?", category: 'nostalgic' },
  { question: "If our friend group was a movie, what would it be called?", category: 'fun' },
  { question: "What's the most chaotic thing we've done together?", category: 'fun' },
  { question: "What song reminds you of us?", category: 'nostalgic' },
  { question: "What's one thing you've never told this group?", category: 'deep' },
  { question: "If you could relive one day with us, which one?", category: 'nostalgic' },
  { question: "What's everyone's secret talent in this group?", category: 'quirky' },
  { question: "Describe each person in this group with one emoji", category: 'fun' },
  { question: "What will we be doing 10 years from now?", category: 'deep' },
  { question: "What's the inside joke that will never die?", category: 'fun' }
];

export async function POST(request: Request) {
  try {
    const session = getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { theme = 'general friendship memories', count = 10 } = body;

    try {
      const prompt = `Generate ${count} unique slam book prompts for a group of friends. Theme: ${theme}.
Return ONLY a JSON array of objects with 'question' and 'category' fields.
Categories must be one of: fun, nostalgic, deep, quirky.
Make prompts specific, personal, and emotionally engaging — not generic.`;

      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemma2:2b',
          prompt: prompt,
          stream: false,
          format: 'json'
        }),
        // Add a timeout of 10s
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const data = await response.json();
        let generatedPrompts = [];
        try {
          generatedPrompts = JSON.parse(data.response);
        } catch (e) {
          // Response is already JSON if format='json' was respected, but check anyway
          generatedPrompts = data.response;
        }

        if (Array.isArray(generatedPrompts) && generatedPrompts.length > 0) {
          return NextResponse.json({
            prompts: generatedPrompts.map(p => ({
              id: nanoid(),
              question: p.question || p.Question || "What's a fun memory?",
              category: ['fun', 'nostalgic', 'deep', 'quirky'].includes(p.category?.toLowerCase()) 
                ? p.category.toLowerCase() : 'fun'
            }))
          });
        }
      }
    } catch (error) {
      console.warn('Ollama generate failed, falling back to defaults:', error);
    }

    // Fallback
    const fallbackPrompts = DEFAULT_PROMPTS.slice(0, count).map(p => ({
      id: nanoid(),
      ...p
    }));

    return NextResponse.json({ prompts: fallbackPrompts });
  } catch (error) {
    console.error('Error in generate-prompts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
