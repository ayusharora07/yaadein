// AI integration layer — Gemma via Ollama (Local) or Groq / Cloud API (Render deployment)
// This module handles all AI interactions for Yaadein with open-source Gemma models

interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
}

/**
 * Generate text using Gemini, Groq, or local Ollama
 */
export async function generateText(prompt: string, options?: {
  temperature?: number;
  maxTokens?: number;
}): Promise<string | null> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

  // Option A: Use Google Gemini API if GEMINI_API_KEY is set (Fastest & best quality on Render)
  if (GEMINI_API_KEY) {
    const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-pro'];
    for (const modelName of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: options?.temperature ?? 0.9,
                maxOutputTokens: options?.maxTokens ?? 1024,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text;
        } else {
          const errText = await response.text().catch(() => '');
          console.warn(`[AI] Gemini ${modelName} HTTP ${response.status}:`, errText.slice(0, 200));
        }
      } catch (err) {
        console.error(`[AI] Gemini ${modelName} fetch error:`, err);
      }
    }
  }

  // Option B: Use Groq API if GROQ_API_KEY is provided
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
          temperature: options?.temperature ?? 0.8,
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

  // Option C: Try local Ollama
  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemma2:2b',
        prompt,
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.8,
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
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

  if (GEMINI_API_KEY || GROQ_API_KEY) return true;
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
  { question: "What's your favorite memory of us?", category: "nostalgic" },
  { question: "What song instantly reminds you of us?", category: "nostalgic" },
  { question: "What's the most hilarious thing we've done together?", category: "fun" },
  { question: "What's a small thing I/we do that always makes you smile?", category: "deep" },
  { question: "If you could relive one day we spent together, which one?", category: "nostalgic" },
  { question: "Describe us in three words", category: "quirky" },
  { question: "What's something you've always wanted us to do together?", category: "deep" },
  { question: "What's the inside joke that will never die?", category: "fun" },
  { question: "What will we be doing 10 years from now?", category: "deep" },
  { question: "If our bond was a movie title, what would it be?", category: "fun" },
];

export function getSlamBookPromptsForGroupSize(memberCount: number = 2) {
  if (memberCount <= 2) {
    return [
      { question: "What's the first thing you noticed about me?", category: 'nostalgic' },
      { question: "What's a small thing I do that makes your whole day better?", category: 'deep' },
      { question: "What song makes you think of us?", category: 'nostalgic' },
      { question: "What's a memory of ours you replay in your head the most?", category: 'nostalgic' },
      { question: "If we could teleport anywhere right now, where would you take us?", category: 'fun' },
      { question: "What's something you've never said out loud to me?", category: 'deep' },
      { question: "Describe our relationship in exactly 3 words", category: 'quirky' },
      { question: "What's the most ridiculous thing we've laughed about?", category: 'fun' },
      { question: "What's one dream you want us to chase together?", category: 'deep' },
      { question: "What's my most adorable habit that I don't even realize?", category: 'quirky' },
    ];
  }
  return DEFAULT_SLAM_BOOK_PROMPTS;
}

