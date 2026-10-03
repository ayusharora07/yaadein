import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { CircleModel, CapsuleModel } from '@/lib/models';
import { getSession } from '@/lib/session';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string; id: string } }
) {
  try {
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let force = false;
    try {
      const body = await request.json();
      force = body.force === true;
    } catch {
      // Ignored
    }

    await connectDB();
    const circle = await CircleModel.findOne({ code: params.code });
    if (!circle) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    const capsule = await CapsuleModel.findOne({ _id: params.id, circleId: circle._id });
    if (!capsule) {
      return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
    }

    if (capsule.status !== 'sealed' && capsule.status !== 'unlocked') {
      return NextResponse.json({ error: 'Capsule must be sealed before unlocking' }, { status: 400 });
    }

    if (capsule.status === 'unlocked') {
       return NextResponse.json({ capsule }, { status: 200 }); // Already unlocked
    }

    if (!force && new Date() < new Date(capsule.unlockAt)) {
      return NextResponse.json({ error: 'Capsule unlock date has not passed yet' }, { status: 400 });
    }

    capsule.status = 'unlocked';
    capsule.unlockedAt = new Date();

    // Generate AI Summary if there are text contributions
    const textContributions = capsule.contributions.filter((c: { type: string, content?: string }) => c.type === 'text' || c.content);
    
    if (textContributions.length > 0) {
      try {
        const prompt = `You are a warm, nostalgic storyteller. Given these contributions to a time capsule titled "${capsule.title}", write a brief, emotionally resonant summary that weaves them together into a narrative. Keep it under 200 words. Contributions: ${textContributions.map((c: { content?: string }) => c.content).join('\\n---\\n')}`;
        
        const ollamaRes = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gemma3:4b',
            prompt,
            stream: false
          }),
        });

        if (ollamaRes.ok) {
          const data = await ollamaRes.json();
          capsule.aiSummary = data.response;
        } else {
          capsule.aiSummary = "Here's to the memories we've sealed together! This capsule is a testament to the special bond we share. Enjoy looking back on these moments.";
        }
      } catch (error) {
        console.error('Failed to generate AI summary, using fallback:', error);
        capsule.aiSummary = "Here's to the memories we've sealed together! This capsule is a testament to the special bond we share. Enjoy looking back on these moments.";
      }
    } else {
      capsule.aiSummary = "This time capsule is a beautiful collection of your visual memories. Enjoy exploring them!";
    }

    await capsule.save();

    return NextResponse.json({ capsule }, { status: 200 });
  } catch (error) {
    console.error('Error unlocking capsule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
