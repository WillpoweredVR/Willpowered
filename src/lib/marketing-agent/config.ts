/**
 * Marketing Agent Configuration
 * 
 * Central configuration for the Willson marketing agent.
 * Safety guardrails and budget limits are enforced here.
 */

import type { AgentConfig } from './types';

// ============================================================================
// SAFETY GUARDRAILS
// ============================================================================

export const BUDGET_LIMITS = {
  // Hard limits - agent cannot exceed these under any circumstances
  dailyMax: 100,      // $100/day max across all platforms
  weeklyMax: 500,     // $500/week max
  monthlyMax: 1500,   // $1500/month max
  
  // Approval thresholds - changes above these require human approval
  approvalThreshold: 50,     // Budget changes > $50 need approval
  newCampaignBudget: 25,     // New campaigns start with max $25/day
} as const;

export const APPROVAL_RULES = {
  // These actions ALWAYS require human approval
  alwaysRequireApproval: [
    'create_campaign',
    'adjust_budget',      // Any budget change
    'pause_campaign',     // Pausing might miss opportunities
  ],
  
  // These can be auto-approved within limits
  canAutoApprove: [
    'analyze_performance',
    'generate_report',
    'create_creative',    // But not deployment
    'run_ab_test',        // Within existing budget
  ],
  
  // Time-based rules
  quietHours: {
    start: 22,  // 10 PM
    end: 7,     // 7 AM
    timezone: 'America/New_York',
    blockActions: ['create_campaign', 'adjust_budget', 'send_email'],
  },
} as const;

// ============================================================================
// PLATFORM CONFIGURATIONS
// ============================================================================

export const getAgentConfig = (): AgentConfig => ({
  approvalThresholds: {
    budgetChange: BUDGET_LIMITS.approvalThreshold,
    newCampaign: true,  // All new campaigns need approval
    creativeChanges: false, // Creative drafts don't need approval
  },
  
  budgetLimits: {
    dailyMax: BUDGET_LIMITS.dailyMax,
    weeklyMax: BUDGET_LIMITS.weeklyMax,
    monthlyMax: BUDGET_LIMITS.monthlyMax,
  },
  
  platforms: {
    googleAds: {
      customerId: process.env.GOOGLE_ADS_CUSTOMER_ID || '',
      developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
      refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN || '',
      clientId: process.env.GOOGLE_ADS_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET || '',
    },
    
    email: {
      provider: 'resend',
      apiKey: process.env.RESEND_API_KEY || '',
      fromEmail: 'Willson <willson@willpowered.com>',
      replyTo: 'colin@willpowered.com',
    },
    
    metaAds: {
      accessToken: process.env.META_ADS_ACCESS_TOKEN || '',
      adAccountId: process.env.META_ADS_ACCOUNT_ID || '',
      appId: process.env.META_ADS_APP_ID || '',
      appSecret: process.env.META_ADS_APP_SECRET || '',
    },
  },
});

// ============================================================================
// TARGETING PRESETS
// ============================================================================

export const TARGET_AUDIENCES = {
  resolutionStrugglers: {
    name: 'New Year Resolution Strugglers',
    description: 'People who set resolutions but are falling off track',
    keywords: [
      'new year resolution help',
      'failed resolution',
      'cant stick to resolution',
      'motivation to exercise',
      'accountability partner',
      'goal tracking app',
      'habit tracker',
      'willpower tips',
      'how to stay motivated',
      'getting back on track',
      'fell off the wagon',
      'restart my goals',
    ],
    negativeKeywords: [
      'free',
      'cheap',
      'download',
    ],
    demographics: {
      ageMin: 25,
      ageMax: 54,
    },
    bestMonths: [1, 2, 3], // Jan, Feb, March - resolution season
  },
  
  selfImprovement: {
    name: 'Self-Improvement Seekers',
    description: 'People actively searching for personal development',
    keywords: [
      'personal development',
      'self improvement',
      'productivity app',
      'goal setting',
      'life coach',
      'ai coach',
      'accountability',
      'build better habits',
      'change my life',
    ],
  },
  
  bookReaders: {
    name: 'Self-Help Book Readers',
    description: 'People who read self-help but struggle to apply it',
    keywords: [
      'atomic habits alternative',
      'self help books',
      'willpower book',
      'motivation books',
      'personal development books',
    ],
    interests: [
      'Self-help books',
      'Personal development',
      'Productivity',
    ],
  },
} as const;

// ============================================================================
// MESSAGING FRAMEWORK
// ============================================================================

export const MESSAGING = {
  corePositioning: {
    tagline: 'Get AI on your side',
    subheadline: 'Finally, an AI that actually helps you achieve your goals',
    valueProps: [
      'Not another to-do list - an AI coach that understands the science of willpower',
      'Based on real research and the stories of heroes who overcame impossible odds',
      'Helps you build principles, not just habits',
    ],
  },
  
  resolutionCampaign: {
    empathy: "It's February. Your resolution is already slipping.",
    agitation: "You know what you should do. You just can't seem to do it.",
    solution: "What if you had AI on your side? Not to lecture - to coach.",
    cta: "Meet Willson - your AI accountability partner",
  },
  
  tones: {
    empathetic: 'Understanding, warm, non-judgmental',
    motivational: 'Energizing, confident, action-oriented', 
    scientific: 'Evidence-based, credible, trustworthy',
  },
} as const;
