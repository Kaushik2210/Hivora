import { config } from '../config/index.js';

export type SubscriptionTier = 'free' | 'pro' | 'team' | 'enterprise';

export interface SubscriptionLimits {
  maxConcurrentAgents: number;
  maxLocksPerDay: number;
  maxProjectsPerOrg: number;
  maxTeamMembers: number;
}

export interface SubscriptionUsage {
  currentConcurrentAgents: number;
  locksUsedToday: number;
  projectsInOrg: number;
  teamMembers: number;
}

class SubscriptionService {
  private tiers = config.subscription.tiers;

  getLimits(tier: SubscriptionTier): SubscriptionLimits {
    return this.tiers[tier];
  }

  canAccess(tier: SubscriptionTier, usage: SubscriptionUsage, feature: keyof SubscriptionLimits): boolean {
    const limits = this.getLimits(tier);
    const limit = limits[feature];

    if (limit === -1) return true;

    const usageKey = this.featureToUsageKey(feature);
    const currentUsage = usage[usageKey as keyof SubscriptionUsage];

    return currentUsage < limit;
  }

  private featureToUsageKey(feature: keyof SubscriptionLimits): string {
    const map: Record<keyof SubscriptionLimits, keyof SubscriptionUsage> = {
      maxConcurrentAgents: 'currentConcurrentAgents',
      maxLocksPerDay: 'locksUsedToday',
      maxProjectsPerOrg: 'projectsInOrg',
      maxTeamMembers: 'teamMembers',
    };
    return map[feature];
  }

  getUsagePercentage(tier: SubscriptionTier, usage: SubscriptionUsage): Record<string, number> {
    const limits = this.getLimits(tier);
    const result: Record<string, number> = {};

    for (const [key, limit] of Object.entries(limits)) {
      if (limit === -1) {
        result[key] = 0;
        continue;
      }
      const usageKey = this.featureToUsageKey(key as keyof SubscriptionLimits);
      const currentUsage = usage[usageKey as keyof SubscriptionUsage];
      result[key] = Math.round((currentUsage / limit) * 100);
    }

    return result;
  }

  shouldUpgrade(tier: SubscriptionTier, usage: SubscriptionUsage): boolean {
    if (tier === 'enterprise') return false;

    const limits = this.getLimits(tier);
    const features: (keyof SubscriptionLimits)[] = [
      'maxConcurrentAgents',
      'maxLocksPerDay',
      'maxProjectsPerOrg',
      'maxTeamMembers',
    ];

    for (const feature of features) {
      const limit = limits[feature];
      if (limit === -1) continue;

      const usagePercentage = this.getUsagePercentage(tier, usage)[feature];
      if (usagePercentage >= 80) return true;
    }

    return false;
  }
}

export const subscriptionService = new SubscriptionService();
