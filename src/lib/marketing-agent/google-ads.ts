/**
 * Google Ads Integration Module
 * 
 * Wrapper for Google Ads API to create and manage campaigns.
 * The agent uses these tools to run paid search campaigns.
 */

import type { 
  Campaign, 
  Creative, 
  TargetingConfig, 
  CampaignPerformance,
  Budget,
  GoogleAdsConfig 
} from './types';
import { BUDGET_LIMITS } from './config';

// ============================================================================
// GOOGLE ADS CLIENT
// ============================================================================

export class GoogleAdsClient {
  private config: GoogleAdsConfig;
  private accessToken: string | null = null;
  
  constructor(config: GoogleAdsConfig) {
    this.config = config;
  }
  
  /**
   * Refresh OAuth token
   */
  private async refreshAccessToken(): Promise<string> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.config.refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }
    
    const data = await response.json();
    this.accessToken = data.access_token as string;
    return this.accessToken;
  }
  
  /**
   * Make authenticated API request
   */
  private async apiRequest(endpoint: string, method: string, body?: unknown) {
    if (!this.accessToken) {
      await this.refreshAccessToken();
    }
    
    const response = await fetch(
      `https://googleads.googleapis.com/v15/customers/${this.config.customerId}/${endpoint}`,
      {
        method,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'developer-token': this.config.developerToken,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google Ads API error: ${error}`);
    }
    
    return response.json();
  }
  
  // ============================================================================
  // CAMPAIGN MANAGEMENT
  // ============================================================================
  
  /**
   * Create a new search campaign
   */
  async createCampaign(params: {
    name: string;
    budget: Budget;
    targeting: TargetingConfig;
  }): Promise<{ campaignId: string }> {
    // Enforce budget limits
    if (params.budget.dailyLimit > BUDGET_LIMITS.newCampaignBudget) {
      throw new Error(
        `New campaigns cannot exceed $${BUDGET_LIMITS.newCampaignBudget}/day. ` +
        `Requested: $${params.budget.dailyLimit}`
      );
    }
    
    // Create campaign budget first
    const budgetOperation = {
      create: {
        name: `${params.name} Budget`,
        amountMicros: params.budget.dailyLimit * 1_000_000, // Convert to micros
        deliveryMethod: 'STANDARD',
      },
    };
    
    const budgetResponse = await this.apiRequest(
      'campaignBudgets:mutate',
      'POST',
      { operations: [budgetOperation] }
    );
    
    const budgetResourceName = budgetResponse.results[0].resourceName;
    
    // Create campaign
    const campaignOperation = {
      create: {
        name: params.name,
        status: 'PAUSED', // Start paused for approval
        advertisingChannelType: 'SEARCH',
        campaignBudget: budgetResourceName,
        biddingStrategyType: 'TARGET_CPA',
        targetCpa: {
          targetCpaMicros: 10_000_000, // $10 target CPA to start
        },
        networkSettings: {
          targetGoogleSearch: true,
          targetSearchNetwork: true,
          targetContentNetwork: false,
        },
        geoTargetTypeSetting: {
          positiveGeoTargetType: 'PRESENCE',
        },
      },
    };
    
    const response = await this.apiRequest(
      'campaigns:mutate',
      'POST',
      { operations: [campaignOperation] }
    );
    
    return { campaignId: response.results[0].resourceName };
  }
  
  /**
   * Create an ad group with keywords
   */
  async createAdGroup(params: {
    campaignId: string;
    name: string;
    keywords: string[];
    negativeKeywords?: string[];
  }): Promise<{ adGroupId: string }> {
    // Create ad group
    const adGroupOperation = {
      create: {
        name: params.name,
        campaign: params.campaignId,
        status: 'ENABLED',
        type: 'SEARCH_STANDARD',
        cpcBidMicros: 2_000_000, // $2 CPC bid
      },
    };
    
    const adGroupResponse = await this.apiRequest(
      'adGroups:mutate',
      'POST',
      { operations: [adGroupOperation] }
    );
    
    const adGroupResourceName = adGroupResponse.results[0].resourceName;
    
    // Add keywords
    const keywordOperations = params.keywords.map(keyword => ({
      create: {
        adGroup: adGroupResourceName,
        status: 'ENABLED',
        keywordV2: {
          text: keyword,
          matchType: 'BROAD', // Start with broad for discovery
        },
      },
    }));
    
    await this.apiRequest(
      'adGroupCriteria:mutate',
      'POST',
      { operations: keywordOperations }
    );
    
    // Add negative keywords if provided
    if (params.negativeKeywords?.length) {
      const negativeOperations = params.negativeKeywords.map(keyword => ({
        create: {
          adGroup: adGroupResourceName,
          status: 'ENABLED',
          negative: true,
          keywordV2: {
            text: keyword,
            matchType: 'BROAD',
          },
        },
      }));
      
      await this.apiRequest(
        'adGroupCriteria:mutate',
        'POST',
        { operations: negativeOperations }
      );
    }
    
    return { adGroupId: adGroupResourceName };
  }
  
  /**
   * Create a responsive search ad
   */
  async createResponsiveSearchAd(params: {
    adGroupId: string;
    headlines: string[];
    descriptions: string[];
    finalUrl: string;
  }): Promise<{ adId: string }> {
    // Validate headline/description counts
    if (params.headlines.length < 3 || params.headlines.length > 15) {
      throw new Error('Responsive ads need 3-15 headlines');
    }
    if (params.descriptions.length < 2 || params.descriptions.length > 4) {
      throw new Error('Responsive ads need 2-4 descriptions');
    }
    
    const adOperation = {
      create: {
        adGroup: params.adGroupId,
        status: 'ENABLED',
        ad: {
          responsiveSearchAd: {
            headlines: params.headlines.map(h => ({ text: h })),
            descriptions: params.descriptions.map(d => ({ text: d })),
          },
          finalUrls: [params.finalUrl],
        },
      },
    };
    
    const response = await this.apiRequest(
      'adGroupAds:mutate',
      'POST',
      { operations: [adOperation] }
    );
    
    return { adId: response.results[0].resourceName };
  }
  
  // ============================================================================
  // CAMPAIGN OPERATIONS
  // ============================================================================
  
  /**
   * Enable/pause a campaign
   */
  async setCampaignStatus(campaignId: string, enabled: boolean): Promise<void> {
    await this.apiRequest(
      'campaigns:mutate',
      'POST',
      {
        operations: [{
          update: {
            resourceName: campaignId,
            status: enabled ? 'ENABLED' : 'PAUSED',
          },
          updateMask: 'status',
        }],
      }
    );
  }
  
  /**
   * Update campaign budget
   */
  async updateBudget(budgetId: string, newDailyLimit: number): Promise<void> {
    // Enforce budget limits
    if (newDailyLimit > BUDGET_LIMITS.dailyMax) {
      throw new Error(
        `Cannot exceed daily limit of $${BUDGET_LIMITS.dailyMax}. ` +
        `Requested: $${newDailyLimit}`
      );
    }
    
    await this.apiRequest(
      'campaignBudgets:mutate',
      'POST',
      {
        operations: [{
          update: {
            resourceName: budgetId,
            amountMicros: newDailyLimit * 1_000_000,
          },
          updateMask: 'amountMicros',
        }],
      }
    );
  }
  
  // ============================================================================
  // REPORTING
  // ============================================================================
  
  /**
   * Get campaign performance metrics
   */
  async getCampaignPerformance(
    campaignId: string,
    dateRange: { start: string; end: string }
  ): Promise<CampaignPerformance> {
    const query = `
      SELECT
        campaign.id,
        metrics.impressions,
        metrics.clicks,
        metrics.conversions,
        metrics.cost_micros,
        metrics.ctr,
        metrics.average_cpc,
        metrics.cost_per_conversion
      FROM campaign
      WHERE campaign.resource_name = '${campaignId}'
        AND segments.date BETWEEN '${dateRange.start}' AND '${dateRange.end}'
    `;
    
    const response = await this.apiRequest(
      'googleAds:searchStream',
      'POST',
      { query }
    );
    
    const metrics = response[0]?.results?.[0]?.metrics || {};
    const spend = (metrics.costMicros || 0) / 1_000_000;
    const clicks = metrics.clicks || 0;
    const conversions = metrics.conversions || 0;
    
    return {
      impressions: metrics.impressions || 0,
      clicks,
      conversions,
      spend,
      ctr: metrics.ctr || 0,
      cpc: clicks > 0 ? spend / clicks : 0,
      cpa: conversions > 0 ? spend / conversions : 0,
      roas: 0, // Would need revenue data
      conversionRate: clicks > 0 ? conversions / clicks : 0,
      lastUpdated: new Date(),
    };
  }
  
  /**
   * Get keyword performance for optimization
   */
  async getKeywordPerformance(adGroupId: string): Promise<Array<{
    keyword: string;
    impressions: number;
    clicks: number;
    conversions: number;
    qualityScore: number;
  }>> {
    const query = `
      SELECT
        ad_group_criterion.keyword.text,
        metrics.impressions,
        metrics.clicks,
        metrics.conversions,
        ad_group_criterion.quality_info.quality_score
      FROM keyword_view
      WHERE ad_group_criterion.ad_group = '${adGroupId}'
        AND segments.date DURING LAST_30_DAYS
      ORDER BY metrics.impressions DESC
      LIMIT 50
    `;
    
    const response = await this.apiRequest(
      'googleAds:searchStream',
      'POST',
      { query }
    );
    
    return (response[0]?.results || []).map((r: Record<string, unknown>) => ({
      keyword: (r.adGroupCriterion as Record<string, unknown>)?.keyword?.text || '',
      impressions: (r.metrics as Record<string, number>)?.impressions || 0,
      clicks: (r.metrics as Record<string, number>)?.clicks || 0,
      conversions: (r.metrics as Record<string, number>)?.conversions || 0,
      qualityScore: (r.adGroupCriterion as Record<string, Record<string, number>>)?.qualityInfo?.qualityScore || 0,
    }));
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate responsive search ad copy variations
 */
export function generateAdCopy(theme: 'resolution' | 'general' | 'book'): {
  headlines: string[];
  descriptions: string[];
} {
  const variations = {
    resolution: {
      headlines: [
        'Get AI On Your Side',
        'Struggling With Your Goals?',
        'Finally Stick To Resolutions',
        'Your AI Accountability Partner',
        'Meet Willson - AI Coach',
        'Science-Based Goal Coaching',
        'Stop Failing Your Resolutions',
        "It's Not Willpower You Lack",
        'Build Real Willpower',
        'Get Back On Track Today',
      ],
      descriptions: [
        "February's here and your resolution is slipping. Willson helps you build the willpower to actually follow through.",
        'Not another app that lectures you. An AI coach that understands why you struggle - and helps you overcome it.',
        'Based on the science of willpower and stories of heroes who beat impossible odds. Start free today.',
        'Stop relying on motivation alone. Build principles that guide you even when motivation fades.',
      ],
    },
    general: {
      headlines: [
        'AI Life Coach - Willson',
        'Build Unshakeable Willpower',
        'Achieve Any Goal With AI',
        'Your Personal AI Coach',
        'Science of Willpower',
        'Beyond Habit Trackers',
        'Coaching That Works',
        'AI Meets Psychology',
      ],
      descriptions: [
        'Willson combines AI with the science of willpower to help you achieve goals others give up on.',
        'More than habits. Build the principles and mindset that create lasting change.',
        'Based on research and real stories of people who overcame impossible obstacles.',
      ],
    },
    book: {
      headlines: [
        'The Will of Heroes',
        'Willpower Science + AI',
        'From Book To Action',
        'Stop Just Reading About It',
      ],
      descriptions: [
        "Love self-help books but struggle to apply them? Willson bridges the gap between knowledge and action.",
        'Based on The Will of Heroes - now with AI coaching to help you live the principles.',
      ],
    },
  };
  
  return variations[theme];
}
