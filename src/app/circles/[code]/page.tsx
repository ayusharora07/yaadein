import { connectDB } from '@/lib/db';
import { CircleModel } from '@/lib/models';
import DashboardClient from './DashboardClient';
import { notFound } from 'next/navigation';

export default async function CircleDashboardPage({ params }: { params: { code: string } }) {
  await connectDB();
  
  const circle = await CircleModel.findOne({ code: params.code.toUpperCase() }).lean();
  
  if (!circle) {
    notFound();
  }
  
  // Serialize ObjectId to string for Client Component
  const serializedCircle = JSON.parse(JSON.stringify(circle));

  return <DashboardClient circle={serializedCircle} />;
}
