import Link from 'next/link';
import { BookOpen, Plus, MessagesSquare, Lock, Globe, ArrowLeft } from 'lucide-react';
import { connectDB } from '@/lib/db';
import { SlamBookModel, CircleModel } from '@/lib/models';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function SlamBookListPage({ params }: { params: { code: string } }) {
  const session = getSession();
  if (!session) redirect('/');

  await connectDB();
  const circle = await CircleModel.findOne({ code: params.code.toUpperCase() });
  if (!circle) redirect('/feed');

  const slambooks = await SlamBookModel.find({ circleId: circle._id }).sort({ createdAt: -1 });

  return (
    <div className="min-h-screen bg-navy-900 text-white font-sans p-4 md:p-12">
      <div className="max-w-xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link href={`/circles/${params.code}`} className="text-amber-400 hover:text-amber-300 text-xs font-semibold mb-2 flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Circle
            </Link>
            <h1 className="text-3xl font-display font-bold text-white flex items-center gap-2.5">
              <BookOpen className="w-8 h-8 text-rose-500" />
              Slam Books
            </h1>
            <p className="text-gray-400 mt-1 text-xs">Answer fun prompts about each other.</p>
          </div>
          <Link
            href={`/circles/${params.code}/slambook/new`}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-rose-500/20 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            + New Slam Book
          </Link>
        </div>

        {/* List */}
        {slambooks.length === 0 ? (
          <div className="bg-navy-800 border border-white/10 rounded-3xl p-10 text-center shadow-xl">
            <div className="bg-rose-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="text-xl font-display font-bold text-white mb-2">No Slam Books Yet</h3>
            <p className="text-gray-400 text-xs mb-6 max-w-sm mx-auto">Create a slam book for your circle and invite friends to fill out answers!</p>
            <Link
              href={`/circles/${params.code}/slambook/new`}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-rose-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Create One Now
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {slambooks.map(book => (
              <Link
                key={book._id.toString()}
                href={`/circles/${params.code}/slambook/${book._id}`}
                className="group bg-white/[0.04] border border-white/10 hover:border-rose-500/40 rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between block"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-400 group-hover:scale-110 transition-transform">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    {book.isPrivate ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 py-1 px-2.5 rounded-lg flex items-center gap-1 border border-amber-500/30">
                        <Lock className="w-3 h-3" /> Private (Only Me)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 py-1 px-2.5 rounded-lg flex items-center gap-1 border border-emerald-500/30">
                        <Globe className="w-3 h-3" /> Public to Circle
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-display font-bold text-white mb-1 group-hover:text-rose-300 transition-colors">{book.title}</h3>
                  {book.description && (
                    <p className="text-gray-400 text-xs line-clamp-2 mb-3">{book.description}</p>
                  )}
                </div>

                <div className="pt-3 border-t border-white/5 mt-2 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <MessagesSquare className="w-3.5 h-3.5 text-rose-400" />
                    <span>{book.prompts?.length || 0} prompts</span>
                  </div>
                  <div className="font-semibold px-2.5 py-1 bg-white/5 rounded-lg text-gray-300">
                    {book.entries?.length || 0} entries filled
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
