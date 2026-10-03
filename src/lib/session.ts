import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

export interface UserSession {
  userId: string;
  name: string;
  email: string;
}

const SESSION_COOKIE = 'yaadein_session';

export function getSession(): UserSession | null {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);

  if (!sessionCookie?.value) return null;

  try {
    return JSON.parse(sessionCookie.value) as UserSession;
  } catch {
    return null;
  }
}

export function createSession(name: string, email?: string, persistentUserId?: string): UserSession {
  const session: UserSession = {
    userId: persistentUserId || uuidv4(),
    name,
    email: email ? email.toLowerCase().trim() : '',
  };

  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
  });

  return session;
}

export function clearSession(): void {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE);
}
