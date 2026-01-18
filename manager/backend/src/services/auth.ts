import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '../config.js';
import type { JwtPayload } from '../types/index.js';
import { verifyUserCredentials, updateLastLogin, getTokenVersion, type User } from './users.js';

// Verify credentials using users service
export async function verifyCredentials(
  username: string,
  password: string
): Promise<{ valid: boolean; user?: Omit<User, 'passwordHash'>; role?: string }> {
  const user = await verifyUserCredentials(username, password);
  if (!user) {
    return { valid: false };
  }
  await updateLastLogin(username);
  const { passwordHash, ...userWithoutPassword } = user;
  return { valid: true, user: userWithoutPassword, role: user.roleId };
}

export async function createAccessToken(subject: string): Promise<string> {
  const tokenVersion = await getTokenVersion(subject);
  return jwt.sign(
    { sub: subject, type: 'access', tokenVersion },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn } as SignOptions
  );
}

export function createRefreshToken(subject: string): string {
  return jwt.sign(
    { sub: subject, type: 'refresh' },
    config.jwtSecret,
    { expiresIn: config.refreshExpiresIn } as SignOptions
  );
}

export function verifyToken(token: string, type: 'access' | 'refresh' = 'access'): { username: string; tokenVersion?: number } | null {
  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload & { tokenVersion?: number };
    if (payload.type !== type) {
      return null;
    }
    return { username: payload.sub, tokenVersion: payload.tokenVersion };
  } catch {
    return null;
  }
}
