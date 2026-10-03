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
 * Weaves raw user contributions into a cinematic spoken narrative for ElevenLabs
 */
function createSpokenNarrative(rawText: string | null, title: string | null): string {
  const cleanedText = rawText || "A heartwarming collection of your group's shared memories.";
  const capsuleTitle = title || "Time Capsule";

  return `... Welcome back to ${capsuleTitle}. 

It has been a long time... but today, your locked vault is finally open. 

${cleanedText}

... Look at these photos... read these notes... Remember... no matter where life takes us... these memories belong to us forever.`;
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
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.28, // Expressive human pacing
              similarity_boost: 0.88,
              style: 0.65, // Emotional nostalgic intonation
              use_speaker_boost: true,
            },
          }),
        });

        if (elevenLabsRes.ok) {
          const audioBuffer = await elevenLabsRes.arrayBuffer();
          return new NextResponse(audioBuffer, {
            headers: {
              'Content-Type': 'audio/mpeg',
              'Content-Length': audioBuffer.byteLength.toString(),
              'Cache-Control': 'public, max-age=300',
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
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error: any) {
    console.error('TTS route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
