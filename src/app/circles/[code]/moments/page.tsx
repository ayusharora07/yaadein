import { connectDB } from '@/lib/db';
import { CircleModel, MomentModel } from '@/lib/models';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import MomentFeedClient from './moment-feed';

export default async function MomentsPage({ params }: { params: { code: string } }) {
  const session = getSession();
  if (!session) {
    redirect(`/circles/${params.code}/join`);
  }

  await connectDB();
  const circle = await CircleModel.findOne({ code: params.code }).lean();
  
  if (!circle) {
    redirect('/');
  }

  const moments = await MomentModel.find({ circleId: circle._id })
    .sort({ createdAt: -1 })
    .lean();

  const serializedMoments = moments.map(m => ({
    _id: m._id.toString(),
    circleId: m.circleId.toString(),
    createdBy: m.createdBy,
    creatorName: m.creatorName,
    type: m.type as 'text' | 'photo' | 'voice',
    content: m.content,
    mediaUrl: m.mediaUrl,
    tags: m.tags || [],
    createdAt: m.createdAt.toISOString()
  }));

  return (
    <main className="min-h-screen bg-navy-900 text-white pb-24 relative overflow-hidden">
      {/* Ambient glowing effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-3xl mx-auto px-4 pt-8 relative z-10">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href={`/circles/${params.code}`}
              className="p-2 hover:bg-white/10 rounded-full transition-colors backdrop-blur-sm bg-white/5"
            >
              <ArrowLeft className="w-5 h-5 text-amber-200" />
            </Link>
            <div>
              <h1 className="text-2xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
                {circle.name} Moments
              </h1>
              <p className="text-sm text-white/50">{serializedMoments.length} memories shared</p>
            </div>
          </div>
        </header>

        <MomentFeedClient initialMoments={serializedMoments} circleCode={params.code} />
      </div>
    </main>
  );
}
