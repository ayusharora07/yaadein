import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export default function RootPage() {
  const session = getSession();
  if (session) {
    redirect('/feed');
  } else {
    redirect('/login');
  }
}
