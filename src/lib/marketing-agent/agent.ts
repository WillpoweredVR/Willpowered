/**
 * Marketing Agent Orchestrator
 * 
 * The AI brain that decides which marketing actions to take.
 * Uses Claude to analyze performance data and make decisions.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { 
  AgentDecision, 
  AgentAction, 
  Campaign, 
  CampaignPerformance 
} from './types';
import { 
  BUDGET_LIMITS, 
  APPROVAL_RULES, 
  TARGET_AUDIENCES, 
  MESSAGING,
  getAgentConfig 
} from './config';
import { GoogleAdsClient, generateAdCopy } from './google-ads';
import { EmailCampaignManager, EMAIL_TEMPLATES } from './email-marketing';
import { CAMPAIGN_TEMPLATES, getRecommendedCampaign } from './campaigns';
import type { SegmentType } from './user-segments';

// ============================================================================
// PENDING DECISIONS STORE (In-memory for now, could be Redis/DB)
// ============================================================================

interface StoredDecision {
  id: string;
  decision: AgentDecision;
  createdAt: Date;
  params: Record<string, unknown>;
}

const pendingDecisions: Map<string, StoredDecision> = new Map();

// ============================================================================
// AGENT TOOLS DEFINITION
// ============================================================================

const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'analyze_campaign_performance',
    description: 'Analyze the performance of active campaigns and identify optimization opportunities',
    input_schema: {
      type: 'object' as const,
      properties: {
        campaignId: {
          type: 'string',
          description: 'The campaign ID to analyze',
        },
        dateRange: {
          type: 'string',
          enum: ['last_7_days', 'last_30_days', 'last_90_days'],
          description: 'The date range for analysis',
        },
      },
      required: ['campaignId', 'dateRange'],
    },
  },
  {
    name: 'create_campaign_draft',
    description: 'Create a new campaign draft based on a template. Requires human approval to activate.',
    input_schema: {
      type: 'object' as const,
      properties: {
        template: {
          type: 'string',
          enum: ['resolutionSeason', 'selfImprovement', 'bookReaders'],
          description: 'The campaign template to use',
        },
        customizations: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            dailyBudget: { type: 'number' },
            additionalKeywords: { type: 'array', items: { type: 'string' } },
          },
        },
      },
      required: ['template'],
    },
  },
  {
    name: 'generate_ad_copy',
    description: 'Generate new ad copy variations for A/B testing',
    input_schema: {
      type: 'object' as const,
      properties: {
        theme: {
          type: 'string',
          enum: ['resolution', 'general', 'book', 'custom'],
          description: 'The messaging theme',
        },
        customPrompt: {
          type: 'string',
          description: 'Custom prompt for generating unique copy',
        },
      },
      required: ['theme'],
    },
  },
  {
    name: 'recommend_budget_change',
    description: 'Recommend a budget adjustment based on performance. Requires human approval.',
    input_schema: {
      type: 'object' as const,
      properties: {
        campaignId: { type: 'string' },
        currentBudget: { type: 'number' },
        recommendedBudget: { type: 'number' },
        reasoning: { type: 'string' },
      },
      required: ['campaignId', 'currentBudget', 'recommendedBudget', 'reasoning'],
    },
  },
  {
    name: 'send_email_campaign',
    description: 'Send or schedule an email campaign to a user segment',
    input_schema: {
      type: 'object' as const,
      properties: {
        template: {
          type: 'string',
          enum: ['februaryCheckIn', 'dormantUserReactivation'],
        },
        segment: {
          type: 'string',
          description: 'The user segment to target',
        },
        scheduleFor: {
          type: 'string',
          description: 'ISO date string to schedule for, or "now" for immediate',
        },
      },
      required: ['template', 'segment'],
    },
  },
  {
    name: 'get_recommendations',
    description: 'Get AI recommendations for what marketing actions to take next',
    input_schema: {
      type: 'object' as const,
      properties: {
        context: {
          type: 'string',
          description: 'Current marketing context and goals',
        },
      },
      required: ['context'],
    },
  },
];

// ============================================================================
// AGENT SYSTEM PROMPT
// ============================================================================

const AGENT_SYSTEM_PROMPT = `You are the Willson Marketing Agent - an AI assistant that helps promote Willson (the AI accountability coach) to people who want to achieve their goals.

## YOUR MISSION
Help sell Willson to people struggling with their New Year's resolutions and self-improvement goals. Your positioning is "Get AI on your side" - emphasizing that Willson is a supportive coach, not a judgmental app.

## KEY MESSAGING
${JSON.stringify(MESSAGING, null, 2)}

## TARGET AUDIENCES
${JSON.stringify(TARGET_AUDIENCES, null, 2)}

## SAFETY RULES (NON-NEGOTIABLE)
1. NEVER exceed budget limits:
   - Daily max: $${BUDGET_LIMITS.dailyMax}
   - Weekly max: $${BUDGET_LIMITS.weeklyMax}
   - Monthly max: $${BUDGET_LIMITS.monthlyMax}
   
2. ALWAYS require human approval for:
   - New campaigns
   - Budget increases
   - Pausing campaigns
   
3. NEVER make claims that aren't true:
   - Willson is an AI coach, not a therapist
   - Results vary by individual
   - No guarantees of specific outcomes

## YOUR APPROACH
1. Analyze data before making recommendations
2. Explain your reasoning clearly
3. Suggest A/B tests rather than big changes
4. Focus on empathetic messaging that acknowledges struggle
5. Optimize for conversions, but maintain brand integrity

## CURRENT CONTEXT
- Today's date: ${new Date().toISOString().split('T')[0]}
- Current month: ${new Date().toLocaleString('default', { month: 'long' })}
- Resolution season: ${new Date().getMonth() <= 2 ? 'YES - peak season!' : 'No - maintain baseline'}

When asked to take action, use the available tools. Always explain what you're doing and why.`;

// ============================================================================
// MARKETING AGENT CLASS
// ============================================================================

export class MarketingAgent {
  private anthropic: Anthropic;
  private googleAds: GoogleAdsClient;
  private emailManager: EmailCampaignManager;
  private conversationHistory: Anthropic.MessageParam[] = [];
  
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    const config = getAgentConfig();
    this.googleAds = new GoogleAdsClient(config.platforms.googleAds!);
    this.emailManager = new EmailCampaignManager();
  }
  
  /**
   * Process a user request and return agent response
   */
  async chat(userMessage: string): Promise<{
    response: string;
    decisions: AgentDecision[];
    requiresApproval: boolean;
  }> {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });
    
    const decisions: AgentDecision[] = [];
    let requiresApproval = false;
    
    // Call Claude with tools
    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: AGENT_SYSTEM_PROMPT,
      tools: AGENT_TOOLS,
      messages: this.conversationHistory,
    });
    
    // Process tool calls if any
    let textResponse = '';
    
    for (const block of response.content) {
      if (block.type === 'text') {
        textResponse += block.text;
      } else if (block.type === 'tool_use') {
        const toolResult = await this.executeTool(block.name, block.input as Record<string, unknown>);
        
        if (toolResult.decision) {
          decisions.push(toolResult.decision);
          if (toolResult.decision.requiresApproval) {
            requiresApproval = true;
          }
        }
        
        // Add tool result to get final response
        this.conversationHistory.push({
          role: 'assistant',
          content: response.content,
        });
        
        this.conversationHistory.push({
          role: 'user',
          content: [{
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(toolResult.result),
          }],
        });
        
        // Get follow-up response
        const followUp = await this.anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          system: AGENT_SYSTEM_PROMPT,
          messages: this.conversationHistory,
        });
        
        for (const followUpBlock of followUp.content) {
          if (followUpBlock.type === 'text') {
            textResponse += followUpBlock.text;
          }
        }
      }
    }
    
    // Add assistant response to history
    this.conversationHistory.push({
      role: 'assistant',
      content: textResponse,
    });
    
    return {
      response: textResponse,
      decisions,
      requiresApproval,
    };
  }
  
  /**
   * Execute a tool call
   */
  private async executeTool(
    toolName: string, 
    input: Record<string, unknown>
  ): Promise<{ result: unknown; decision?: AgentDecision }> {
    switch (toolName) {
      case 'analyze_campaign_performance': {
        // In real implementation, would call Google Ads API
        return {
          result: {
            status: 'analysis_complete',
            metrics: {
              impressions: 12500,
              clicks: 450,
              conversions: 23,
              spend: 187.50,
              ctr: 3.6,
              cpa: 8.15,
            },
            recommendations: [
              'CTR above average - consider increasing budget',
              'Top performing keywords: "accountability partner", "goal tracking"',
              'Consider pausing "free habit tracker" - high cost, low conversion',
            ],
          },
        };
      }
      
      case 'create_campaign_draft': {
        const template = input.template as keyof typeof CAMPAIGN_TEMPLATES;
        const templateConfig = CAMPAIGN_TEMPLATES[template];
        
        return {
          result: {
            status: 'draft_created',
            campaign: {
              name: templateConfig.name,
              template,
              targeting: templateConfig.targeting,
              budget: templateConfig.budget,
              status: 'pending_approval',
            },
          },
          decision: {
            action: 'create_campaign',
            reasoning: `Created draft campaign based on ${template} template. Awaiting approval.`,
            params: { template, ...input },
            requiresApproval: true,
            confidence: 0.85,
          },
        };
      }
      
      case 'generate_ad_copy': {
        const theme = input.theme as 'resolution' | 'general' | 'book';
        const copy = generateAdCopy(theme);
        
        return {
          result: {
            status: 'copy_generated',
            ...copy,
          },
          decision: {
            action: 'create_creative',
            reasoning: `Generated ${copy.headlines.length} headlines and ${copy.descriptions.length} descriptions for ${theme} theme`,
            params: { theme, copy },
            requiresApproval: false,
            confidence: 0.9,
          },
        };
      }
      
      case 'recommend_budget_change': {
        const change = (input.recommendedBudget as number) - (input.currentBudget as number);
        
        return {
          result: {
            status: 'recommendation_created',
            change,
            requiresApproval: Math.abs(change) > BUDGET_LIMITS.approvalThreshold,
          },
          decision: {
            action: 'adjust_budget',
            reasoning: input.reasoning as string,
            params: input,
            requiresApproval: true, // Budget changes always need approval
            confidence: 0.75,
            estimatedImpact: {
              metric: 'daily_spend',
              change,
              direction: change > 0 ? 'increase' : 'decrease',
            },
          },
        };
      }
      
      case 'send_email_campaign': {
        // Preview the segment first
        const segmentPreview = await this.emailManager.previewSegment(
          input.segment as string
        );
        
        // Create a decision ID for tracking
        const decisionId = `email_${Date.now()}`;
        
        const decision: AgentDecision = {
          action: 'send_email',
          reasoning: `Email campaign to ${segmentPreview.segmentSize} users in "${input.segment}" segment`,
          params: { 
            ...input as Record<string, unknown>, 
            decisionId,  // Include decisionId in params for frontend
            segmentSize: segmentPreview.segmentSize,
          },
          requiresApproval: true,
          confidence: 0.85,
        };
        
        // Store the pending decision
        pendingDecisions.set(decisionId, {
          id: decisionId,
          decision,
          createdAt: new Date(),
          params: input as Record<string, unknown>,
        });
        
        return {
          result: {
            status: 'pending_approval',
            decisionId,
            template: input.template,
            segment: input.segment,
            segmentSize: segmentPreview.segmentSize,
            sampleUsers: segmentPreview.sampleUsers,
            message: `Ready to send to ${segmentPreview.segmentSize} users. Approve to send.`,
          },
          decision,
        };
      }
      
      case 'get_recommendations': {
        const recommended = getRecommendedCampaign();
        
        return {
          result: {
            currentMonth: new Date().toLocaleString('default', { month: 'long' }),
            recommendedCampaign: recommended,
            reasoning: new Date().getMonth() <= 2 
              ? "We're in resolution season (Jan-March). This is prime time for the 'Resolution Strugglers' campaign."
              : "Running general self-improvement campaign for steady lead generation.",
            suggestedActions: [
              'Review current campaign performance',
              'Generate fresh ad copy for A/B testing',
              'Consider email re-engagement for dormant users',
            ],
          },
        };
      }
      
      default:
        return { result: { error: `Unknown tool: ${toolName}` } };
    }
  }
  
  /**
   * Approve a pending decision and execute it
   */
  async approveDecision(decisionId: string, notes?: string): Promise<{
    success: boolean;
    result?: unknown;
    error?: string;
  }> {
    const stored = pendingDecisions.get(decisionId);
    
    if (!stored) {
      return { success: false, error: `Decision ${decisionId} not found` };
    }
    
    console.log(`[Agent] Approving decision ${decisionId}:`, stored.decision.action, notes);
    
    try {
      // Execute the action based on type
      switch (stored.decision.action) {
        case 'send_email': {
          const params = stored.params;
          const segment = (params.segment as string) || 'dormant_users';
          
          // Determine template and variant based on segment
          const templateConfig = this.getTemplateForSegment(segment);
          
          const result = await this.emailManager.sendToSegment({
            segment,
            template: templateConfig.template,
            variant: templateConfig.variant,
            maxRecipients: 100, // Safety limit
            dryRun: false,
          });
          
          // Remove from pending
          pendingDecisions.delete(decisionId);
          
          return {
            success: true,
            result: {
              action: 'send_email',
              segmentSize: result.segmentSize,
              sent: result.sent,
              failed: result.failed,
              message: `Successfully sent ${result.sent} emails to "${segment}" segment`,
            },
          };
        }
        
        case 'create_campaign': {
          // Google Ads campaign creation would go here
          pendingDecisions.delete(decisionId);
          return {
            success: true,
            result: {
              action: 'create_campaign',
              message: 'Campaign created (Google Ads integration pending token approval)',
            },
          };
        }
        
        case 'adjust_budget': {
          // Budget adjustment would go here
          pendingDecisions.delete(decisionId);
          return {
            success: true,
            result: {
              action: 'adjust_budget',
              message: 'Budget adjusted (Google Ads integration pending token approval)',
            },
          };
        }
        
        default:
          return { success: false, error: `Unknown action type: ${stored.decision.action}` };
      }
    } catch (error) {
      console.error(`[Agent] Error executing decision ${decisionId}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Get the appropriate template and variant based on segment
   */
  private getTemplateForSegment(segment: string): { template: keyof typeof EMAIL_TEMPLATES; variant: string } {
    // Normalize segment name
    const normalizedSegment = segment.toLowerCase();
    
    // Map segments to template/variant combinations
    if (normalizedSegment.includes('dormant') || normalizedSegment.includes('inactive')) {
      if (normalizedSegment.includes('7')) {
        return { template: 'reEngagement', variant: 'dormant7Days' };
      } else if (normalizedSegment.includes('30')) {
        return { template: 'reEngagement', variant: 'dormant30Days' };
      }
      // Default dormant to 14 days
      return { template: 'reEngagement', variant: 'dormant14Days' };
    }
    
    if (normalizedSegment.includes('january') || normalizedSegment.includes('jan')) {
      return { template: 'resolutionSeason', variant: 'january' };
    }
    
    if (normalizedSegment.includes('february') || normalizedSegment.includes('feb')) {
      return { template: 'resolutionSeason', variant: 'february' };
    }
    
    if (normalizedSegment.includes('abandoned') || normalizedSegment.includes('onboarding')) {
      return { template: 'leadNurture', variant: 'day14' };
    }
    
    // Default fallback
    return { template: 'reEngagement', variant: 'dormant14Days' };
  }
  
  /**
   * Reject a pending decision
   */
  async rejectDecision(decisionId: string, reason: string): Promise<{ success: boolean }> {
    const stored = pendingDecisions.get(decisionId);
    
    if (!stored) {
      console.warn(`[Agent] Decision ${decisionId} not found for rejection`);
      return { success: false };
    }
    
    console.log(`[Agent] Rejected decision ${decisionId}: ${reason}`);
    pendingDecisions.delete(decisionId);
    
    return { success: true };
  }
  
  /**
   * Get all pending approvals
   */
  async getPendingApprovals(): Promise<Array<StoredDecision>> {
    return Array.from(pendingDecisions.values());
  }
  
  /**
   * Reset conversation history
   */
  resetConversation(): void {
    this.conversationHistory = [];
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let agentInstance: MarketingAgent | null = null;

export function getMarketingAgent(): MarketingAgent {
  if (!agentInstance) {
    agentInstance = new MarketingAgent();
  }
  return agentInstance;
}
