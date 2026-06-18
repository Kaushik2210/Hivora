import type { Request, Response, NextFunction } from 'express';
import { prisma } from '@hivora/db';
import { fail } from '../utils/response.js';
import type { UserRole } from '@hivora/shared';

declare module 'express-serve-static-core' {
  interface Request {
    orgId?: string;
    orgRole?: UserRole;
  }
}

const ROLE_RANK: Record<UserRole, number> = { member: 0, admin: 1, owner: 2 };

export function requireOrgRole(minRole: UserRole = 'member') {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json(fail('UNAUTHORIZED', 'Authentication required'));
      return;
    }
    const orgId = (req.params.orgId ?? req.params.id ?? req.headers['x-org-id']) as string | undefined;
    if (!orgId) {
      res.status(400).json(fail('MISSING_ORG', 'Organization id required'));
      return;
    }

    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: req.user.sub,
          organizationId: orgId,
        },
      },
    });

    if (!membership) {
      res.status(403).json(fail('FORBIDDEN', 'You do not have access to this organization'));
      return;
    }

    if (ROLE_RANK[membership.role] < ROLE_RANK[minRole]) {
      res.status(403).json(fail('FORBIDDEN', `Requires ${minRole} role`));
      return;
    }

    req.orgId = orgId;
    req.orgRole = membership.role;
    next();
  };
}

export async function resolveOrgFromProject(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json(fail('UNAUTHORIZED', 'Authentication required'));
    return;
  }
  const projectId = req.params.projectId ?? req.params.id;
  if (!projectId) {
    res.status(400).json(fail('MISSING_PROJECT', 'Project id required'));
    return;
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true },
  });

  if (!project) {
    res.status(404).json(fail('NOT_FOUND', 'Project not found'));
    return;
  }

  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: req.user.sub,
        organizationId: project.organizationId,
      },
    },
  });

  if (!membership) {
    res.status(403).json(fail('FORBIDDEN', 'No access to this project'));
    return;
  }

  req.orgId = project.organizationId;
  req.orgRole = membership.role;
  req.params.orgId = project.organizationId;
  next();
}
