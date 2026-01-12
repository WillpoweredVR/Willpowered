/**
 * Willson Marketing Agent - Type Definitions
 * 
 * Types for the AI marketing agent that helps promote Willson
 * to people struggling with their New Year's resolutions.
 */

// ============================================================================
// CAMPAIGN TYPES
// ============================================================================

export type CampaignPlatform = 'google_ads' | 'email' | 'meta_ads' | 'linkedin_ads';
export type CampaignStatus = 'draft' | 'pending_approval' | 'active' | 'paused' | 'completed';
export type CampaignGoal = 'awareness' | 'traffic' | 'leads' | 'conversions';

export interface Campaign {
  id: string;
  name: string;
  platform: CampaignPlatform;
  status: CampaignStatus;
  goal: CampaignGoal;
  budget: Budget;
  targeting: TargetingConfig;
  creatives: Creative[];
  schedule: CampaignSchedule;
  performance?: CampaignPerformance;
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  dailyLimit: number;
  totalLimit: number;
  spent: number;
  currency: string;
}

export interface CampaignSchedule {
  startDate: Date;
  endDate?: Date;
  dayParting?: DayParting[];
}

export interface DayParting {
  dayOfWeek: number; // 0-6
  startHour: number; // 0-23
  endHour: number;
}

// ============================================================================
// TARGETING TYPES
// ============================================================================

export interface TargetingConfig {
  keywords?: string[];
  audiences?: AudienceSegment[];
  demographics?: Demographics;
  locations?: string[];
  devices?: ('desktop' | 'mobile' | 'tablet')[];
  excludeKeywords?: string[];
}

export interface AudienceSegment {
  id: string;
  name: string;
  type: 'interest' | 'behavior' | 'custom' | 'lookalike' | 'retargeting';
  description?: string;
}

export interface Demographics {
  ageMin?: number;
  ageMax?: number;
  genders?: ('male' | 'female' | 'other')[];
  languages?: string[];
}

// ============================================================================
// CREATIVE TYPES
// ============================================================================

export interface Creative {
  id: string;
  type: 'text_ad' | 'image_ad' | 'video_ad' | 'email' | 'responsive_ad';
  headline?: string;
  headlines?: string[]; // For responsive ads
  description?: string;
  descriptions?: string[]; // For responsive ads
  body?: string; // For email
  subject?: string; // For email
  imageUrl?: string;
  videoUrl?: string;
  callToAction: string;
  landingUrl: string;
  variants?: CreativeVariant[];
}

export interface CreativeVariant {
  id: string;
  content: Partial<Creative>;
  performance?: {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    conversionRate: number;
  };
}

// ============================================================================
// PERFORMANCE TYPES
// ============================================================================

export interface CampaignPerformance {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  ctr: number; // Click-through rate
  cpc: number; // Cost per click
  cpa: number; // Cost per acquisition
  roas: number; // Return on ad spend
  conversionRate: number;
  lastUpdated: Date;
}

// ============================================================================
// AGENT TYPES
// ============================================================================

export type AgentAction = 
  | 'create_campaign'
  | 'update_campaign'
  | 'pause_campaign'
  | 'resume_campaign'
  | 'adjust_budget'
  | 'adjust_targeting'
  | 'create_creative'
  | 'run_ab_test'
  | 'send_email'
  | 'analyze_performance'
  | 'generate_report';

export interface AgentDecision {
  action: AgentAction;
  reasoning: string;
  params: Record<string, unknown>;
  requiresApproval: boolean;
  confidence: number; // 0-1
  estimatedImpact?: {
    metric: string;
    change: number;
    direction: 'increase' | 'decrease';
  };
}

export interface AgentConfig {
  approvalThresholds: {
    budgetChange: number; // Changes above this require approval
    newCampaign: boolean; // New campaigns require approval
    creativeChanges: boolean;
  };
  budgetLimits: {
    dailyMax: number;
    weeklyMax: number;
    monthlyMax: number;
  };
  platforms: {
    googleAds?: GoogleAdsConfig;
    email?: EmailConfig;
    metaAds?: MetaAdsConfig;
  };
}

export interface GoogleAdsConfig {
  customerId: string;
  developerToken: string;
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}

export interface EmailConfig {
  provider: 'resend';
  apiKey: string;
  fromEmail: string;
  replyTo: string;
}

export interface MetaAdsConfig {
  accessToken: string;
  adAccountId: string;
  appId: string;
  appSecret: string;
}

// ============================================================================
// APPROVAL WORKFLOW
// ============================================================================

export interface ApprovalRequest {
  id: string;
  decision: AgentDecision;
  campaign?: Campaign;
  creative?: Creative;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  notes?: string;
}
