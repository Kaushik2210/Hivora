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
  avatarUrl?: string | null;
}): User & { avatarUrl: string | null } {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    emailVerified: u.emailVerified,
    avatarUrl: u.avatarUrl ?? null,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  } as User & { avatarUrl: string | null };
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

// ── GitHub OAuth (direct — no passport dependency) ────────────────────────────

authRouter.get('/github', (req, res) => {
  const { clientId } = config.github
  if (!clientId) {
    res.status(503).json(fail('OAUTH_NOT_CONFIGURED', 'GitHub OAuth is not configured'))
    return
  }
  // Encode the originating client (web | desktop) into the state so the callback
  // knows where to redirect afterwards (web page vs. hivora:// deep link).
  const client = req.query.client === 'desktop' ? 'desktop' : 'web'
  const state = `${randomToken()}.${client}`
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${config.apiBaseUrl}/api/auth/github/callback`,
    scope: 'user:email',
    state,
  })
  res.redirect(`https://github.com/login/oauth/authorize?${params}`)
})

authRouter.get(
  '/github/callback',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { code, error, state } = req.query as { code?: string; error?: string; state?: string }
    const isDesktop = typeof state === 'string' && state.endsWith('.desktop')
    const frontendError = `${config.appUrl}/login?error=github`

    if (error || !code) {
      res.redirect(frontendError)
      return
    }

    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: config.github.clientId,
        client_secret: config.github.clientSecret,
        code,
        redirect_uri: `${config.apiBaseUrl}/api/auth/github/callback`,
      }),
    })
    const tokenData = await tokenRes.json() as { access_token?: string; error?: string }
    if (!tokenData.access_token) { res.redirect(frontendError); return }

    // Get GitHub user profile
    const profileRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'Hivora' },
    })
    const profile = await profileRes.json() as { id: number; name?: string; email?: string; login: string; avatar_url?: string }

    // Get primary email if not public
    let email = profile.email
    if (!email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'Hivora' },
      })
      const emails = await emailsRes.json() as Array<{ email: string; primary: boolean; verified: boolean }>
      email = emails.find(e => e.primary && e.verified)?.email ?? emails[0]?.email
    }
    if (!email) { res.redirect(frontendError); return }

    const githubId = String(profile.id)

    // Upsert user
    let user = await prisma.user.findFirst({ where: { githubId } })
    if (!user) {
      user = await prisma.user.findUnique({ where: { email } })
      if (user) {
        // Link GitHub to existing account
        user = await prisma.user.update({ where: { id: user.id }, data: { githubId, avatarUrl: profile.avatar_url } })
      } else {
        // New user via GitHub
        user = await prisma.user.create({
          data: {
            email,
            name: profile.name ?? profile.login,
            githubId,
            avatarUrl: profile.avatar_url,
            emailVerified: true,
          },
        })
      }
    }

    const tokens = await buildTokens(user.id, { ipAddress: getClientIp(req), userAgent: getUserAgent(req) })
    const params = new URLSearchParams({
      at: tokens.accessToken,
      rt: tokens.refreshToken,
      name: user.name ?? user.email,
      avatar: user.avatarUrl ?? '',
    })
    // Desktop: hand tokens back via the hivora:// deep link; Web: via the callback page
    if (isDesktop) {
      res.redirect(`hivora://auth?${params}`)
    } else {
      res.redirect(`${config.appUrl}/auth/callback?${params}`)
    }
  }),
)
