import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { config } from '../config/index.js';
import { prisma } from '@hivora/db';
import type { AuthTokens } from '@hivora/shared';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  orgId?: string;
  role?: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessTtl,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.jwt.secret) as AccessTokenPayload;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, config.bcrypt.rounds);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function randomToken(): string {
  return nanoid(32);
}

export function tokenFamily(): string {
  return nanoid(16);
}

export async function issueRefreshToken(userId: string, family: string, meta?: { userAgent?: string; ipAddress?: string }): Promise<{ token: string; expiresAt: Date }> {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + config.jwt.refreshTtl * 1000);
  await prisma.refreshToken.create({
    data: {
      userId,
      token,
      family,
      expiresAt,
      userAgent: meta?.userAgent,
      ipAddress: meta?.ipAddress,
    },
  });
  return { token, expiresAt };
}

export async function rotateRefreshToken(oldToken: string, meta?: { userAgent?: string; ipAddress?: string }): Promise<{ tokens: AuthTokens; userId: string } | null> {
  const stored = await prisma.refreshToken.findUnique({
    where: { token: oldToken },
  });

  if (!stored) {
    return null;
  }

  if (stored.revoked) {
    await prisma.refreshToken.updateMany({
      where: { family: stored.family },
      data: { revoked: true },
    });
    return null;
  }

  if (stored.expiresAt < new Date()) {
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });
    return null;
  }

  const newToken = await issueRefreshToken(stored.userId, stored.family, meta);
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revoked: true, replacedBy: newToken.token },
  });

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user) return null;

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
  });

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    orgId: membership?.organizationId,
    role: membership?.role,
  });

  return {
    tokens: {
      accessToken,
      refreshToken: newToken.token,
      expiresIn: config.jwt.accessTtl,
    },
    userId: user.id,
  };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { token, revoked: false },
    data: { revoked: true },
  });
}
