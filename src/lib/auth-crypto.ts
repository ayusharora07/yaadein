import crypto from 'crypto';

/**
 * Hash a plain text password using Node's built-in scrypt KDF with a random salt.
 * Returns salt:hash string format.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

/**
 * Verify a plain text password against a stored scrypt hash.
 * Also supports legacy plain-text accounts for seamless migration.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !password) return false;

  // Backwards-compatible check for legacy unhashed plain-text passwords
  if (!storedHash.includes(':')) {
    return password === storedHash;
  }

  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;

  try {
    const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(derivedKey, 'hex'));
  } catch {
    return false;
  }
}
