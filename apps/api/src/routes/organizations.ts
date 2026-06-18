import { Router } from 'express';
import { prisma } from '@hivora/db';
import { createOrganizationSchema, inviteMemberSchema } from '@hivora/shared';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/error.js';
import { authRequired } from '../middleware/auth.js';
import { requireOrgRole } from '../middleware/orgGuard.js';
import { ok, fail } from '../utils/response.js';
import { randomToken } from '../utils/tokens.js';
import { enqueueEmail } from '../jobs/queue.js';

export const orgRouter = Router();

orgRouter.use(authRequired);

orgRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const memberships = await prisma.membership.findMany({
      where: { userId: req.user!.sub },
      include: { organization: true },
    });
    const orgs = memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      role: m.role,
      createdAt: m.organization.createdAt.toISOString(),
    }));
    res.json(ok(orgs));
  }),
);

orgRouter.post(
  '/',
  validate(createOrganizationSchema),
  asyncHandler(async (req, res) => {
    const { name, slug } = req.body;

    const existingSlug = await prisma.organization.findUnique({ where: { slug } });
    if (existingSlug) {
      res.status(409).json(fail('SLUG_TAKEN', 'This slug is already taken'));
      return;
    }

    const org = await prisma.organization.create({
      data: {
        name,
        slug,
        members: {
          create: {
            userId: req.user!.sub,
            role: 'owner',
          },
        },
        subscriptions: {
          create: {
            tier: 'free',
            status: 'active',
          },
        },
      },
    });

    res.status(201).json(ok({
      id: org.id,
      name: org.name,
      slug: org.slug,
      createdAt: org.createdAt.toISOString(),
    }));
  }),
);

orgRouter.get(
  '/:orgId/members',
  requireOrgRole('member'),
  asyncHandler(async (req, res) => {
    const members = await prisma.membership.findMany({
      where: { organizationId: req.orgId! },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
    res.json(ok(
      members.map((m) => ({
        id: m.id,
        userId: m.userId,
        email: m.user.email,
        name: m.user.name,
        role: m.role,
        createdAt: m.createdAt.toISOString(),
      })),
    ));
  }),
);

orgRouter.post(
  '/:orgId/invite',
  requireOrgRole('admin'),
  validate(inviteMemberSchema),
  asyncHandler(async (req, res) => {
    const { email, role } = req.body;

    const token = randomToken();
    const invitation = await prisma.organizationInvitation.create({
      data: {
        email: email.toLowerCase(),
        organizationId: req.orgId!,
        role,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        invitedById: req.user!.sub,
      },
    });

    await enqueueEmail({
      to: email.toLowerCase(),
      template: 'invite',
      payload: { token, name: '' },
    });

    res.status(201).json(ok({ id: invitation.id, email: invitation.email, role: invitation.role }));
  }),
);
