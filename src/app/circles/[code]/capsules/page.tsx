import { connectDB } from '@/lib/db';
import { CircleModel, CapsuleModel } from '@/lib/models';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Lock } from 'lucide-react';
import CapsuleCard from './CapsuleCard';

export default async function CapsulesPage({ params }: { params: { code: string } }) {
  const session = getSession();
  if (!session) {
    redirect('/');
  }

  await connectDB();
  const circle = await CircleModel.findOne({ code: params.code });
  if (!circle) {
    redirect('/');
  }

  const capsules = await CapsuleModel.find({ circleId: circle._id }).sort({ createdAt: -1 });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-sans selection:bg-violet-500/30">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link 
              href={`/circles/${params.code}`}
              className="inline-flex items-center text-slate-400 hover:text-violet-400 transition-colors mb-4 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to {circle.name}
            </Link>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
              Time Capsules
            </h1>
            <p className="text-slate-400 mt-2">Seal memories today, unlock them together tomorrow.</p>
          </div>
          <Link
            href={`/circles/${params.code}/capsules/new`}
            className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-full font-medium transition-all shadow-[0_0_20px_-5px_rgba(124,58,237,0.5)] hover:shadow-[0_0_25px_-5px_rgba(124,58,237,0.6)]"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Capsule
          </Link>
        </header>

        {capsules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center glass-card rounded-3xl border border-white/5 bg-white/5 backdrop-blur-xl">
            <div className="w-20 h-20 bg-violet-500/20 rounded-full flex items-center justify-center mb-6">
              <Lock className="w-10 h-10 text-violet-400" />
            </div>
            <h3 className="text-2xl font-display font-semibold text-white mb-2">No capsules yet</h3>
            <p className="text-slate-400 max-w-md mx-auto mb-8">
              Start your first time capsule to seal memories with friends. Pick a date in the future to open it together!
            </p>
            <Link
              href={`/circles/${params.code}/capsules/new`}
              className="btn-violet px-6 py-3 rounded-full font-medium inline-flex items-center bg-violet-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create your first capsule
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capsules.map((capsule) => (
              <CapsuleCard key={capsule._id.toString()} capsule={JSON.parse(JSON.stringify(capsule))} code={params.code} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
