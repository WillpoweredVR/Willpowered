// Subscription tier limits and utilities

export const TIER_LIMITS = {
  free: {
    monthlyConversations: 20,
    maxPrinciples: 5,
    maxScorecardMetrics: 5,
  },
  pro: {
    monthlyConversations: Infinity,
    maxPrinciples: Infinity,
    maxScorecardMetrics: Infinity,
  },
} as const;

export type SubscriptionTier = 'free' | 'pro';

export interface UsageStatus {
  tier: SubscriptionTier;
  conversationsUsed: number;
  conversationsLimit: number;
  conversationsRemaining: number;
  isAtLimit: boolean;
  resetDate: Date | null;
  daysUntilReset: number | null;
}

/**
 * Check if the monthly conversation count should be reset
 */
export function shouldResetConversations(resetDate: string | null): boolean {
  if (!resetDate) return true;
  
  const lastReset = new Date(resetDate);
  const now = new Date();
  
  // Reset if we're in a different month
  return (
    lastReset.getMonth() !== now.getMonth() ||
    lastReset.getFullYear() !== now.getFullYear()
  );
}

/**
 * Get the next reset date (first of next month)
 */
export function getNextResetDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

/**
 * Calculate days until reset
 */
export function getDaysUntilReset(): number {
  const now = new Date();
  const nextReset = getNextResetDate();
  const diffTime = nextReset.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Determine the user's subscription tier based on status
 */
export function getTierFromStatus(subscriptionStatus: string | null): SubscriptionTier {
  const proStatuses = ['active', 'trialing'];
  return proStatuses.includes(subscriptionStatus || '') ? 'pro' : 'free';
}

/**
 * Get usage status for a user
 */
export function getUsageStatus(
  subscriptionStatus: string | null,
  monthlyConversations: number,
  conversationResetDate: string | null
): UsageStatus {
  const tier = getTierFromStatus(subscriptionStatus);
  const limits = TIER_LIMITS[tier];
  
  // Check if we should reset (for free users)
  const needsReset = tier === 'free' && shouldResetConversations(conversationResetDate);
  const actualConversations = needsReset ? 0 : monthlyConversations;
  
  const conversationsRemaining = Math.max(0, limits.monthlyConversations - actualConversations);
  const isAtLimit = tier === 'free' && actualConversations >= limits.monthlyConversations;
  
  return {
    tier,
    conversationsUsed: actualConversations,
    conversationsLimit: limits.monthlyConversations,
    conversationsRemaining: tier === 'pro' ? Infinity : conversationsRemaining,
    isAtLimit,
    resetDate: tier === 'free' ? getNextResetDate() : null,
    daysUntilReset: tier === 'free' ? getDaysUntilReset() : null,
  };
}


