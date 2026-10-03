// AI integration layer — Gemma via Ollama (Local) or Groq / Cloud API (Render deployment)
// This module handles all AI interactions for Yaadein with open-source Gemma models

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MODEL = 'gemma2:2b';

interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
}

/**
 * Generate text using Gemma (Ollama locally or Groq/Cloud API for cloud deployment like Render)
 * Falls back gracefully if AI service is unavailable
 */
export async function generateText(prompt: string, options?: {
  temperature?: number;
  maxTokens?: number;
}): Promise<string | null> {
  // Option A: Use Groq API if GROQ_API_KEY is provided (Ideal for Render cloud deployment with open-source Gemma 2)
  if (GROQ_API_KEY) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gemma2-9b-it',
          messages: [{ role: 'user', content: prompt }],
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 1024,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || null;
      }
    } catch (err) {
      console.error('[AI] Groq Cloud API error:', err);
    }
  }

  // Option B: Try local Ollama
  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? 1024,
        },
      }),
    });

    if (response.ok) {
      const data = (await response.json()) as OllamaResponse;
      return data.response;
    }
  } catch (error) {
    console.warn('[AI] Local Ollama unavailable (will use smart fallbacks):', error instanceof Error ? error.message : error);
  }

  return null;
}

/**
 * Generate slam book prompts using Gemma
 */
export async function generateSlamBookPrompts(
  theme?: string,
  count: number = 10
): Promise<Array<{ question: string; category: string }> | null> {
  const prompt = `Generate ${count} unique slam book prompts for a group, circle of loved ones, couples, family, or friends. ${theme ? `Theme: ${theme}.` : 'Theme: shared memories, fun, and deep bonds.'}

Return ONLY a valid JSON array of objects. Each object must have exactly two fields:
- "question": the slam book prompt (make it specific, personal, emotionally engaging — not generic)
- "category": one of "fun", "nostalgic", "deep", or "quirky"

Example format:
[{"question":"What song instantly reminds you of us?","category":"nostalgic"}]

Do NOT include any text outside the JSON array. Return only the JSON array:`;

  const response = await generateText(prompt, { temperature: 0.9 });
  if (!response) return null;

  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p: { question: string; category: string }) => ({
          question: p.question,
          category: ['fun', 'nostalgic', 'deep', 'quirky'].includes(p.category) ? p.category : 'fun',
        }));
      }
    }
    return null;
  } catch {
    console.error('[AI] Failed to parse slam book prompts from response');
    return null;
  }
}

/**
 * Generate a capsule summary/narrative
 */
export async function generateCapsuleSummary(
  title: string,
  contributions: Array<{ userName: string; content: string; type: string }>
): Promise<string | null> {
  const contributionText = contributions
    .map(c => `${c.userName}: "${c.content}"`)
    .join('\n');

  const prompt = `You are a warm, nostalgic storyteller. A circle of loved ones created a time capsule titled "${title}" and sealed these memories inside:

${contributionText}

Write a brief, emotionally resonant summary (under 200 words) that weaves their contributions together into a beautiful narrative about their shared bond and cherished memories. Use a warm, slightly poetic tone. Don't list the contributions — tell their story.`;

  return generateText(prompt, { temperature: 0.8 });
}

/**
 * Generate memory search summary
 */
export async function generateMemorySummary(
  query: string,
  memories: Array<{ content: string; creatorName: string; createdAt: string }>
): Promise<string | null> {
  const memoryText = memories
    .map(m => `[${m.createdAt}] ${m.creatorName}: "${m.content}"`)
    .join('\n');

  const prompt = `A user searched their group memories for: "${query}"

Here are the matching memories:
${memoryText}

Write a brief, warm summary (under 150 words) of what these memories are about, highlighting the emotional thread that connects them. Be specific and reference the actual content.`;

  return generateText(prompt, { temperature: 0.7 });
}

/**
 * Check if Ollama or Cloud Gemma AI is available
 */
export async function isAIAvailable(): Promise<boolean> {
  if (GROQ_API_KEY) return true;
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Default slam book prompts (fallback when AI is unavailable)
export const DEFAULT_SLAM_BOOK_PROMPTS = [
  { question: "What's your favorite memory with this group?", category: "nostalgic" },
  { question: "If our friend group was a movie, what would it be called?", category: "fun" },
  { question: "What's the most chaotic thing we've done together?", category: "fun" },
  { question: "What song reminds you of us?", category: "nostalgic" },
  { question: "What's one thing you've never told this group?", category: "deep" },
  { question: "If you could relive one day with us, which one?", category: "nostalgic" },
  { question: "What's everyone's secret talent in this group?", category: "quirky" },
  { question: "Describe each person in this group with one emoji", category: "fun" },
  { question: "What will we be doing 10 years from now?", category: "deep" },
  { question: "What's the inside joke that will never die?", category: "fun" },
];
