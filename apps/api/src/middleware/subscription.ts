import { Request, Response, NextFunction } from 'express';
import { db } from '@hivora/db';
import { subscriptionService, SubscriptionLimits } from '../services/subscription.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  organizationId?: string;
}

export const subscriptionCheck = (feature: keyof SubscriptionLimits) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.organizationId) {
        return res.status(401).json({ error: 'Organization ID required' });
      }

      const subscription = await db.subscription.findUniqueOrThrow({
        where: { organizationId: req.organizationId },
        include: { usage: true },
      });

      const limits = subscriptionService.getLimits(subscription.tier);
      const canAccess = subscriptionService.canAccess(
        subscription.tier,
        {
          currentConcurrentAgents: subscription.usage?.currentConcurrentAgents || 0,
          locksUsedToday: subscription.usage?.locksUsedToday || 0,
          projectsInOrg: subscription.usage?.projectsInOrg || 0,
          teamMembers: subscription.usage?.teamMembers || 0,
        },
        feature
      );

      if (!canAccess) {
        const limit = limits[feature];
        return res.status(403).json({
          error: `Limit exceeded for ${feature}: ${limit}`,
          upgradeSuggestion:
            subscription.tier === 'free'
              ? 'Upgrade to Pro to increase limits'
              : 'Contact support for higher limits',
        });
      }

      (req as any).subscription = subscription;
      next();
    } catch (error) {
      res.status(500).json({ error: 'Subscription check failed' });
    }
  };
};
