import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@hivora/db';
import { authRequired } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';
import { ok, fail } from '../utils/response.js';

const userRouter = Router();
userRouter.use(authRequired);

const ALLOWED_PROVIDERS = ['anthropic', 'openai', 'cohere'] as const;
type Provider = (typeof ALLOWED_PROVIDERS)[number];

// Cast needed until `prisma migrate dev` runs to generate the UserApiKey model types
const db = prisma as any;

const upsertKeySchema = z.object({
  provider: z.enum(ALLOWED_PROVIDERS),
  key: z.string().min(10, 'API key is too short'),
});

// GET /api/user/api-keys  — list which providers have a saved key (no values returned)
userRouter.get(
  '/api-keys',
  asyncHandler(async (req, res) => {
    try {
      const keys = await db.userApiKey.findMany({
        where: { userId: req.user!.sub },
        select: { provider: true, createdAt: true, updatedAt: true },
      });
      res.json(ok(keys));
    } catch {
      // Table may not exist yet if migration hasn't been run
      res.json(ok([]));
    }
  }),
);

// POST /api/user/api-keys  — save or update a key
userRouter.post(
  '/api-keys',
  asyncHandler(async (req, res) => {
    const body = upsertKeySchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json(fail('VALIDATION_ERROR', body.error.errors[0].message));
      return;
    }
    const { provider, key } = body.data;
    try {
      const record = await db.userApiKey.upsert({
        where: { userId_provider: { userId: req.user!.sub, provider } },
        create: { userId: req.user!.sub, provider, keyValue: key },
        update: { keyValue: key },
        select: { provider: true, createdAt: true, updatedAt: true },
      });
      res.json(ok(record));
    } catch {
      res.status(503).json(fail('DB_ERROR', 'Database migration required. Run: npx prisma migrate dev'));
    }
  }),
);

// DELETE /api/user/api-keys/:provider  — remove a key
userRouter.delete(
  '/api-keys/:provider',
  asyncHandler(async (req, res) => {
    const provider = req.params.provider as Provider;
    if (!ALLOWED_PROVIDERS.includes(provider)) {
      res.status(400).json(fail('INVALID_PROVIDER', 'Unknown provider'));
      return;
    }
    try {
      await db.userApiKey.deleteMany({
        where: { userId: req.user!.sub, provider },
      });
      res.json(ok({ deleted: true }));
    } catch {
      res.status(503).json(fail('DB_ERROR', 'Database migration required'));
    }
  }),
);

export { userRouter };
