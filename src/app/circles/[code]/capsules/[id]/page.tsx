import { connectDB } from '@/lib/db';
import { CircleModel, CapsuleModel } from '@/lib/models';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import CapsuleDetailClient from './CapsuleDetailClient';

export default async function CapsuleDetailPage({ params }: { params: { code: string; id: string } }) {
  const session = getSession();
  if (!session) {
    redirect('/');
  }

  await connectDB();
  const circle = await CircleModel.findOne({ code: params.code });
  if (!circle) {
    redirect('/');
  }

  const capsule = await CapsuleModel.findOne({ _id: params.id, circleId: circle._id });
  if (!capsule) {
    redirect(`/circles/${params.code}/capsules`);
  }

  return (
    <CapsuleDetailClient 
      initialCapsule={JSON.parse(JSON.stringify(capsule))} 
      code={params.code} 
      currentUser={session}
    />
  );
}
