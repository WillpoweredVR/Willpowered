/**
 * Pre-built Campaign Templates
 * 
 * Ready-to-deploy campaign configurations for common marketing goals.
 * The agent can use these as starting points and customize them.
 */

import type { Campaign, Creative, TargetingConfig } from './types';
import { TARGET_AUDIENCES, MESSAGING } from './config';
import { generateAdCopy } from './google-ads';

// ============================================================================
// CAMPAIGN TEMPLATES
// ============================================================================

export const CAMPAIGN_TEMPLATES = {
  /**
   * Resolution Season Campaign
   * Best run: January - March
   * Target: People struggling with New Year's resolutions
   */
  resolutionSeason: {
    name: 'Resolution Season - Get AI On Your Side',
    goal: 'conversions' as const,
    
    targeting: {
      keywords: TARGET_AUDIENCES.resolutionStrugglers.keywords,
      excludeKeywords: TARGET_AUDIENCES.resolutionStrugglers.negativeKeywords,
      demographics: TARGET_AUDIENCES.resolutionStrugglers.demographics,
      locations: ['US', 'CA', 'GB', 'AU'], // English-speaking countries
      devices: ['desktop', 'mobile'] as const,
    },
    
    budget: {
      dailyLimit: 25,
      totalLimit: 750, // 30-day campaign
      currency: 'USD',
    },
    
    creatives: [
      {
        type: 'responsive_ad' as const,
        ...generateAdCopy('resolution'),
        callToAction: 'Get Started Free',
        landingUrl: 'https://willpowered.com/?utm_source=google&utm_medium=cpc&utm_campaign=resolution_2026',
      },
    ],
    
    schedule: {
      // Best timing: February when resolutions start failing
      recommendedStart: new Date('2026-01-15'),
      recommendedEnd: new Date('2026-03-31'),
      dayParting: [
        // Focus on evening hours when people reflect
        { dayOfWeek: 0, startHour: 18, endHour: 23 }, // Sunday evening
        { dayOfWeek: 1, startHour: 6, endHour: 9 },   // Monday morning
        { dayOfWeek: 1, startHour: 18, endHour: 23 }, // Monday evening
        { dayOfWeek: 2, startHour: 18, endHour: 23 },
        { dayOfWeek: 3, startHour: 18, endHour: 23 },
        { dayOfWeek: 4, startHour: 18, endHour: 23 },
        { dayOfWeek: 5, startHour: 18, endHour: 23 },
        { dayOfWeek: 6, startHour: 10, endHour: 23 }, // Weekend
      ],
    },
  },
  
  /**
   * General Self-Improvement Campaign
   * Can run year-round
   */
  selfImprovement: {
    name: 'Self-Improvement - AI Coach',
    goal: 'conversions' as const,
    
    targeting: {
      keywords: TARGET_AUDIENCES.selfImprovement.keywords,
      demographics: {
        ageMin: 25,
        ageMax: 54,
      },
      locations: ['US', 'CA', 'GB', 'AU'],
    },
    
    budget: {
      dailyLimit: 15,
      totalLimit: 450,
      currency: 'USD',
    },
    
    creatives: [
      {
        type: 'responsive_ad' as const,
        ...generateAdCopy('general'),
        callToAction: 'Try Free',
        landingUrl: 'https://willpowered.com/?utm_source=google&utm_medium=cpc&utm_campaign=self_improvement',
      },
    ],
  },
  
  /**
   * Book Readers Campaign
   * Target people who read self-help but struggle to apply
   */
  bookReaders: {
    name: 'Book Readers - From Knowledge to Action',
    goal: 'conversions' as const,
    
    targeting: {
      keywords: TARGET_AUDIENCES.bookReaders.keywords,
      demographics: {
        ageMin: 28,
        ageMax: 50,
      },
    },
    
    budget: {
      dailyLimit: 10,
      totalLimit: 300,
      currency: 'USD',
    },
    
    creatives: [
      {
        type: 'responsive_ad' as const,
        ...generateAdCopy('book'),
        callToAction: 'Start Applying Today',
        landingUrl: 'https://willpowered.com/?utm_source=google&utm_medium=cpc&utm_campaign=book_readers',
      },
    ],
  },
} as const;

// ============================================================================
// EMAIL CAMPAIGN TEMPLATES
// ============================================================================

export const EMAIL_CAMPAIGN_TEMPLATES = {
  /**
   * February Check-In Campaign
   * Send to all users who signed up in January
   */
  februaryCheckIn: {
    name: 'February Resolution Check-In',
    segment: 'january_signups',
    
    emails: [
      {
        sendDelay: 0, // Send immediately
        subject: "It's February. How are your resolutions going?",
        previewText: "80% have already quit. You don't have to.",
        body: `
Hey {{firstName}},

It's February, which means we're at the make-or-break point for New Year's resolutions.

Research shows that 80% of people have already abandoned their goals by now. The gym is emptier. The meditation apps are gathering dust.

But here's what that research doesn't tell you: **the people who succeed aren't more motivated than you.** They just have better systems.

That's where Willson comes in. I'm not going to guilt you about what you haven't done. I'm here to help you figure out why you're stuck - and what to do about it.

Ready to get back on track?

[Chat with Willson →]

Even if you only have 5 minutes, let's talk.

- Willson
Your AI accountability partner
        `,
      },
      {
        sendDelay: 3, // 3 days later
        subject: "The real reason your resolution is failing",
        previewText: "It's not about willpower (and Kobe Bryant proved it)",
        body: `
Hey {{firstName}},

Quick question: what's your "why"?

Not the surface-level answer. The deep one.

When Kobe Bryant was 12 years old, he scored zero points at a summer basketball camp. Zero. He was humiliated.

But instead of quitting, he latched onto something deeper. He'd just learned that Michael Jordan got cut from his high school team and turned that rejection into fuel.

Kobe found his "why" - to prove that work ethic beats talent. And he held onto it through 4 AM practices, through injuries, through championships.

**Your resolution isn't failing because you lack willpower. It's failing because you haven't connected it to a "why" that matters more than comfort.**

That's exactly what I help with. Not just tracking habits - finding the purpose that makes the habits stick.

Got 10 minutes to explore this together?

[Talk to Willson →]

- Willson
        `,
      },
    ],
  },
  
  /**
   * Re-engagement for dormant users
   */
  dormantUserReactivation: {
    name: 'Win Back Dormant Users',
    segment: 'inactive_14_days',
    
    emails: [
      {
        sendDelay: 0,
        subject: "The middle is the hardest part",
        previewText: "Every hero you admire faced this exact moment",
        body: `
Hey {{firstName}},

I noticed you haven't been around for a bit. No judgment - seriously.

But I want to tell you something important: **you're in "the middle."**

The middle is the hardest part of any journey. The excitement of starting has worn off. The finish line isn't visible yet. This is where most people quit.

J.K. Rowling was in the middle when she got her 12th rejection letter. A single mom on welfare, wondering if Harry Potter would ever find a home.

Kobe was in the middle when he airballed four shots in a playoff game and the whole country laughed.

They didn't have more willpower than you. They just understood that the middle is where champions are made.

You started something. Let's finish it.

[Open Willson →]

I'm here when you're ready.

- Willson
        `,
      },
    ],
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the recommended campaign for the current month
 */
export function getRecommendedCampaign(): keyof typeof CAMPAIGN_TEMPLATES {
  const month = new Date().getMonth(); // 0-11
  
  if (month >= 0 && month <= 2) {
    // January - March: Resolution season
    return 'resolutionSeason';
  }
  
  // Rest of year: General self-improvement
  return 'selfImprovement';
}

/**
 * Calculate recommended budget based on performance
 */
export function calculateRecommendedBudget(params: {
  currentCpa: number;
  targetCpa: number;
  currentDailyBudget: number;
  conversionRate: number;
}): number {
  // If CPA is below target, recommend increasing budget
  if (params.currentCpa < params.targetCpa && params.conversionRate > 0.02) {
    return Math.min(
      params.currentDailyBudget * 1.2, // 20% increase
      100 // Hard cap
    );
  }
  
  // If CPA is above target, recommend decreasing
  if (params.currentCpa > params.targetCpa * 1.5) {
    return Math.max(
      params.currentDailyBudget * 0.8, // 20% decrease
      10 // Minimum
    );
  }
  
  return params.currentDailyBudget;
}

/**
 * Generate A/B test variants for headlines
 */
export function generateHeadlineVariants(baseHeadline: string): string[] {
  const templates = [
    // Empathy angle
    `Struggling? ${baseHeadline}`,
    // Question angle
    `What If You Had ${baseHeadline}?`,
    // Direct angle
    `Get ${baseHeadline} Today`,
    // Proof angle
    `Science-Backed: ${baseHeadline}`,
  ];
  
  // Filter to Google Ads headline length limit (30 chars)
  return templates
    .map(h => h.slice(0, 30))
    .filter((h, i, arr) => arr.indexOf(h) === i);
}
