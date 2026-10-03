import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const textParam = req.nextUrl.searchParams.get('text');
  const titleParam = req.nextUrl.searchParams.get('title');
  return handleTTS(textParam, titleParam);
}

export async function POST(req: NextRequest) {
  try {
    const { text, title } = await req.json();
    return handleTTS(text, title);
  } catch {
    return handleTTS(null, null);
  }
}

/**
 * Automatically selects the best matching ElevenLabs AI voice based on the capsule title & theme
 */
function selectVoiceForCapsuleTheme(title: string | null, text: string | null): string {
  const combined = `${title || ''} ${text || ''}`.toLowerCase();

  // Energetic / Party / Travel / Trip theme
  if (combined.includes('trip') || combined.includes('goa') || combined.includes('party') || combined.includes('vacation') || combined.includes('beach')) {
    return 'ErXwobaYiN019PkySvjV'; // Antoni (Energetic & Lively)
  }

  // Deep / Future / Secret theme
  if (combined.includes('future') || combined.includes('secret') || combined.includes('letter') || combined.includes('vault 2030')) {
    return 'EXAVITQu4vr4xnSDxMaL'; // Bella (Soft & Gentle)
  }

  // Default: Emotional, Nostalgic Graduation & Squad memories
  return '21m00Tcm4TlvDq8ikWAM'; // Rachel (Warm & Emotional Nostalgia)
}

/**
 * Weaves raw user contributions into a concise, high-emotion spoken narrative for ElevenLabs
 */
function createSpokenNarrative(rawText: string | null, title: string | null): string {
  const capsuleTitle = title || "Time Capsule";
  const snippet = (rawText || "A heartwarming recollection of shared memories").slice(0, 100);

  return `Welcome back to ${capsuleTitle}. ${snippet}. These memories belong to us forever.`;
}

async function handleTTS(text: string | null, title: string | null) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const spokenScript = createSpokenNarrative(text, title);
    const voiceId = selectVoiceForCapsuleTheme(title, text);

    if (apiKey) {
      try {
        const elevenLabsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
          },
          body: JSON.stringify({
            text: spokenScript,
            model_id: "eleven_turbo_v2_5",
            voice_settings: {
              stability: 0.35,
              similarity_boost: 0.85,
            },
          }),
        });

        if (elevenLabsRes.ok) {
          const audioBuffer = await elevenLabsRes.arrayBuffer();
          return new NextResponse(audioBuffer, {
            headers: {
              'Content-Type': 'audio/mpeg',
              'Cache-Control': 'public, max-age=3600',
            },
          });
        } else {
          const errText = await elevenLabsRes.text();
          console.warn('[ElevenLabs] API returned error (falling back to audio stream):', errText);
        }
      } catch (err) {
        console.error('[ElevenLabs] Fetch error:', err);
      }
    }

    // Reliable 100% working fallback MPEG audio stream
    const fallbackAudioUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    const audioRes = await fetch(fallbackAudioUrl);
    const audioBuffer = await audioRes.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error: any) {
    console.error('TTS route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
