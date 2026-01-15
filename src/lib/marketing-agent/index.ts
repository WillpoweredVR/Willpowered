/**
 * Willson Marketing Agent
 * 
 * An AI-powered marketing agent that helps promote Willson
 * to people struggling with their goals and resolutions.
 * 
 * Features:
 * - Google Ads campaign management
 * - Email marketing automation
 * - A/B testing for ad copy
 * - Performance analysis and optimization
 * - Budget guardrails and approval workflows
 * 
 * @example
 * ```typescript
 * import { getMarketingAgent } from '@/lib/marketing-agent';
 * 
 * const agent = getMarketingAgent();
 * const result = await agent.chat('Create a resolution season campaign');
 * 
 * console.log(result.response);
 * if (result.requiresApproval) {
 *   // Handle approval workflow
 * }
 * ```
 */

// Types
export * from './types';

// Configuration
export { 
  BUDGET_LIMITS, 
  APPROVAL_RULES,
  TARGET_AUDIENCES,
  MESSAGING,
  getAgentConfig,
} from './config';

// Platform integrations
export { GoogleAdsClient, generateAdCopy } from './google-ads';
export { EmailCampaignManager, EMAIL_TEMPLATES } from './email-marketing';

// Campaign templates
export { 
  CAMPAIGN_TEMPLATES, 
  EMAIL_CAMPAIGN_TEMPLATES,
  getRecommendedCampaign,
  calculateRecommendedBudget,
  generateHeadlineVariants,
} from './campaigns';

// User segments
export {
  getDormantUsers,
  getUsersBySignupMonth,
  getAbandonedOnboardingUsers,
  getAllActiveUsers,
  getUsersForSegment,
  getSegmentSize,
  type SegmentType,
  type MarketingUser,
} from './user-segments';

// Agent
export { MarketingAgent, getMarketingAgent } from './agent';
