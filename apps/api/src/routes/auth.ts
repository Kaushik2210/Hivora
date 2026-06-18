import { Router, type Response } from 'express';
import { prisma } from '@hivora/db';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  emailVerificationSchema,
} from '@hivora/shared';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/error.js';
import { authRequired } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { ok, fail, getClientIp, getUserAgent } from '../utils/response.js';
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  randomToken,
  tokenFamily,
} from '../utils/tokens.js';
import { enqueueEmail } from '../jobs/queue.js';
import { config } from '../config/index.js';
import type { AuthTokens, User } from '@hivora/shared';

export const authRouter = Router();

function setRefreshCookie(res: Response, token: string) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: config.isProd,
    sameSite: 'lax',
    domain: config.cookieDomain,
    path: '/api/auth',
    maxAge: config.jwt.refreshTtl * 1000,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: config.isProd,
    sameSite: 'lax',
    domain: config.cookieDomain,
    path: '/api/auth',
  });
}

function publicUser(u: {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}): User {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    emailVerified: u.emailVerified,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  };
}

async function buildTokens(userId: string, meta?: { userAgent?: string; ipAddress?: string }): Promise<AuthTokens> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  const membership = await prisma.membership.findFirst({ where: { userId: user.id } });
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    orgId: membership?.organizationId,
    role: membership?.role,
  });
  const { token: refreshToken } = await issueRefreshToken(user.id, tokenFamily(), meta);
  return { accessToken, refreshToken, expiresIn: config.jwt.accessTtl };
}

authRouter.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { email, password, name } = req.body;

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      res.status(409).json(fail('EMAIL_TAKEN', 'An account with this email already exists'));
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
      },
    });

    const verifyToken = randomToken();
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: verifyToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await enqueueEmail({
      to: user.email,
      template: 'verify-email',
      payload: { token: verifyToken, name: name ?? '' },
    });

    const tokens = await buildTokens(user.id, {
      userAgent: getUserAgent(req),
      ipAddress: getClientIp(req),
    });
    setRefreshCookie(res, tokens.refreshToken);

    res.status(201).json(ok({ user: publicUser(user), tokens }));
  }),
);

authRouter.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      res.status(401).json(fail('INVALID_CREDENTIALS', 'Invalid email or password'));
      return;
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json(fail('INVALID_CREDENTIALS', 'Invalid email or password'));
      return;
    }

    const tokens = await buildTokens(user.id, {
      userAgent: getUserAgent(req),
      ipAddress: getClientIp(req),
    });
    setRefreshCookie(res, tokens.refreshToken);

    res.json(ok({ user: publicUser(user), tokens }));
  }),
);

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const bodyToken = (req.body as { refreshToken?: string })?.refreshToken;
    const cookieToken = req.cookies?.refreshToken as string | undefined;
    const refreshToken = bodyToken ?? cookieToken;

    if (!refreshToken) {
      res.status(401).json(fail('NO_REFRESH_TOKEN', 'Refresh token required'));
      return;
    }

    const result = await rotateRefreshToken(refreshToken, {
      userAgent: getUserAgent(req),
      ipAddress: getClientIp(req),
    });

    if (!result) {
      clearRefreshCookie(res);
      res.status(401).json(fail('INVALID_REFRESH_TOKEN', 'Refresh token invalid or expired'));
      return;
    }

    setRefreshCookie(res, result.tokens.refreshToken);
    res.json(ok(result.tokens));
  }),
);

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const bodyToken = (req.body as { refreshToken?: string })?.refreshToken;
    const cookieToken = req.cookies?.refreshToken as string | undefined;
    const refreshToken = bodyToken ?? cookieToken;
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }
    clearRefreshCookie(res);
    res.json(ok({ success: true }));
  }),
);

authRouter.get(
  '/me',
  authRequired,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) {
      res.status(404).json(fail('NOT_FOUND', 'User not found'));
      return;
    }
    res.json(ok(publicUser(user)));
  }),
);

authRouter.get(
  '/verify-email',
  validate(emailVerificationSchema),
  asyncHandler(async (req, res) => {
    const { token } = req.query as { token: string };

    const stored = await prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!stored || stored.expiresAt < new Date()) {
      res.status(400).json(fail('INVALID_TOKEN', 'Verification token invalid or expired'));
      return;
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: stored.userId },
        data: { emailVerified: true },
      }),
      prisma.emailVerificationToken.delete({ where: { id: stored.id } }),
    ]);

    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    res.json(ok(publicUser(user!)));
  }),
);

authRouter.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (user) {
      const token = randomToken();
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
      await enqueueEmail({
        to: user.email,
        template: 'password-reset',
        payload: { token, name: user.name ?? '' },
      });
    }

    res.json(ok({ success: true }));
  }),
);

authRouter.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const { token, password } = req.body;

    const stored = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!stored || stored.used || stored.expiresAt < new Date()) {
      res.status(400).json(fail('INVALID_TOKEN', 'Reset token invalid or expired'));
      return;
    }

    const passwordHash = await hashPassword(password);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: stored.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: stored.id },
        data: { used: true },
      }),
      prisma.refreshToken.updateMany({
        where: { userId: stored.userId },
        data: { revoked: true },
      }),
    ]);

    res.json(ok({ success: true }));
  }),
);
