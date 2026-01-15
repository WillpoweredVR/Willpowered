/**
 * Email Marketing Module
 * 
 * Extends existing Resend integration for marketing campaigns.
 * Handles lead nurturing, re-engagement, and promotional emails.
 */

import { resend, FROM_EMAIL, REPLY_TO } from '../resend';
import type { Creative } from './types';
import { getUsersForSegment, type SegmentType, type MarketingUser } from './user-segments';

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

export const EMAIL_TEMPLATES = {
  /**
   * Lead nurture sequence for new signups
   */
  leadNurture: {
    day1: {
      subject: "Welcome to the journey - here's your first step",
      preheader: "Willson is ready to help you build real willpower",
    },
    day3: {
      subject: "The #1 mistake people make with resolutions",
      preheader: "It's not what you think (and Kobe Bryant taught us why)",
    },
    day7: {
      subject: "Are you in 'the middle'? Here's how to push through",
      preheader: "Every hero faced this moment. Here's what they did differently.",
    },
    day14: {
      subject: "Quick check-in: how's it going?",
      preheader: "Willson noticed you haven't been around - everything okay?",
    },
  },
  
  /**
   * Re-engagement for dormant users
   */
  reEngagement: {
    dormant7Days: {
      subject: "Hey - Willson misses you",
      preheader: "Your goals are still waiting. Let's get back on track.",
    },
    dormant14Days: {
      subject: "J.K. Rowling was rejected 12 times. This is your 'middle'.",
      preheader: "The hardest part of any journey isn't the start - it's right now.",
    },
    dormant30Days: {
      subject: "One question before you go",
      preheader: "What would it take to get you back on track?",
    },
  },
  
  /**
   * Resolution season campaigns (Jan-March)
   */
  resolutionSeason: {
    january: {
      subject: "This year will be different. Here's why.",
      preheader: "Get AI on your side in 2026",
    },
    february: {
      subject: "It's February. Still on track?",
      preheader: "80% of resolutions fail by now. You don't have to be one of them.",
    },
    march: {
      subject: "The real resolution season starts now",
      preheader: "When the hype fades, the real work begins. Let's do this together.",
    },
  },
} as const;

// ============================================================================
// EMAIL CAMPAIGN MANAGER
// ============================================================================

export class EmailCampaignManager {
  /**
   * Send a marketing email to a list of recipients
   */
  async sendCampaign(params: {
    recipients: Array<{ email: string; name?: string; userId?: string }>;
    template: keyof typeof EMAIL_TEMPLATES;
    variant: string;
    customContent?: {
      subject?: string;
      body?: string;
    };
  }): Promise<{ sent: number; failed: number; messageIds: string[] }> {
    const templateGroup = EMAIL_TEMPLATES[params.template];
    const templateVariant = templateGroup[params.variant as keyof typeof templateGroup] as 
      { subject: string; preheader: string } | undefined;
    
    if (!templateVariant) {
      throw new Error(`Unknown template variant: ${params.template}.${params.variant}`);
    }
    
    const results = {
      sent: 0,
      failed: 0,
      messageIds: [] as string[],
    };
    
    // Send sequentially to respect rate limits (2 req/sec on free tier)
    for (const recipient of params.recipients) {
      try {
        console.log(`[Email] Sending to ${recipient.email}...`);
        const response = await resend.emails.send({
          from: FROM_EMAIL,
          replyTo: REPLY_TO,
          to: recipient.email,
          subject: params.customContent?.subject || templateVariant.subject,
          html: this.renderEmailHtml({
            ...templateVariant,
            recipientName: recipient.name,
            customBody: params.customContent?.body,
          }),
          headers: {
            'X-Entity-Ref-ID': recipient.userId || recipient.email,
          },
        });
        
        // Check for API errors (mock returns { data: null, error: {...} })
        if (response.error) {
          console.error(`[Email] API error for ${recipient.email}:`, response.error);
          results.failed++;
        } else if (response.data?.id) {
          console.log(`[Email] ✓ Sent to ${recipient.email}, ID: ${response.data.id}`);
          results.sent++;
          results.messageIds.push(response.data.id);
        } else {
          console.warn(`[Email] No message ID returned for ${recipient.email}`);
          results.failed++;
        }
      } catch (error) {
        console.error(`[Email] Failed to send to ${recipient.email}:`, error);
        results.failed++;
      }
      
      // Rate limit: wait 600ms between emails (stay under 2/sec limit)
      await new Promise(resolve => setTimeout(resolve, 600));
    }
    
    return results;
  }
  
  /**
   * Render email HTML from template
   */
  private renderEmailHtml(params: {
    subject: string;
    preheader: string;
    recipientName?: string;
    customBody?: string;
  }): string {
    const greeting = params.recipientName 
      ? `Hey ${params.recipientName},` 
      : 'Hey there,';
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .preheader { display: none; max-height: 0; overflow: hidden; }
    .header { text-align: center; padding: 20px 0; }
    .logo { font-size: 24px; font-weight: bold; color: #8B5CF6; }
    .content { padding: 20px 0; }
    .cta { display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
    .footer { padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="preheader">${params.preheader}</div>
  <div class="container">
    <div class="header">
      <div class="logo">🎯 Willson</div>
    </div>
    <div class="content">
      <p>${greeting}</p>
      ${params.customBody || this.getDefaultBody(params.subject)}
      <p><a href="https://willpowered.com/dashboard" class="cta">Open Willson</a></p>
      <p>Here to help,<br>Willson<br><em>Your AI accountability partner</em></p>
    </div>
    <div class="footer">
      <p>You're receiving this because you signed up for Willpowered.</p>
      <p><a href="{{unsubscribe}}">Unsubscribe</a> | <a href="https://willpowered.com/privacy">Privacy</a></p>
    </div>
  </div>
</body>
</html>`;
  }
  
  /**
   * Get default body content based on subject line
   */
  private getDefaultBody(subject: string): string {
    // Match subject to content
    if (subject.includes('February') || subject.includes('on track')) {
      return `
        <p>Research shows that 80% of New Year's resolutions fail by the second week of February.</p>
        <p>But here's what the research also shows: <strong>the people who succeed aren't more motivated - they have better systems.</strong></p>
        <p>That's exactly what I'm here for. I'm not going to lecture you or guilt you. I'm going to help you understand <em>why</em> you're struggling and give you the tools to push through.</p>
        <p>Ready to get back on track?</p>
      `;
    }
    
    if (subject.includes('middle') || subject.includes('J.K. Rowling')) {
      return `
        <p>J.K. Rowling was rejected by 12 publishers. Kobe Bryant scored zero points at his first basketball camp. Every hero you admire had a moment just like yours - a moment in "the middle" where quitting felt like the only option.</p>
        <p>The difference? They kept going. Not because they were special, but because they had something pushing them forward.</p>
        <p>Let me be that push for you.</p>
      `;
    }
    
    if (subject.includes('misses you') || subject.includes('check-in')) {
      return `
        <p>I noticed you haven't been around lately. No judgment here - life happens.</p>
        <p>But I wanted to check in: what's getting in the way?</p>
        <p>Sometimes all it takes is one conversation to get back on track. I'm here whenever you're ready.</p>
      `;
    }
    
    // Default content
    return `
      <p>I'm Willson - your AI coach built to help you build real willpower.</p>
      <p>Not another app that tracks your habits and makes you feel guilty. An actual coach that understands the science of why we struggle - and how to overcome it.</p>
      <p>Based on the research behind <em>The Will of Heroes</em> and the stories of people who achieved impossible things.</p>
    `;
  }
  
  /**
   * Schedule an email for later sending
   */
  async scheduleEmail(params: {
    recipients: Array<{ email: string; name?: string }>;
    template: keyof typeof EMAIL_TEMPLATES;
    variant: string;
    scheduledFor: Date;
  }): Promise<{ scheduledId: string }> {
    // In a real implementation, this would store in a job queue (e.g., Inngest, Temporal)
    // For now, return a placeholder
    console.log(`Scheduled email ${params.template}.${params.variant} for ${params.scheduledFor}`);
    return { scheduledId: `scheduled_${Date.now()}` };
  }
  
  /**
   * Get email analytics
   */
  async getEmailAnalytics(messageIds: string[]): Promise<{
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    openRate: number;
    clickRate: number;
  }> {
    // Resend provides webhook-based analytics
    // This would aggregate from stored events
    return {
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      openRate: 0,
      clickRate: 0,
    };
  }
  
  /**
   * Send campaign to a user segment
   * This is the main method for marketing automation
   */
  async sendToSegment(params: {
    segment: SegmentType | string;
    template: keyof typeof EMAIL_TEMPLATES;
    variant: string;
    maxRecipients?: number; // Safety limit
    dryRun?: boolean; // Preview without sending
  }): Promise<{
    segmentSize: number;
    sent: number;
    failed: number;
    messageIds: string[];
    dryRun: boolean;
  }> {
    // Safety limit: default to 100 recipients max
    const maxRecipients = params.maxRecipients || 100;
    
    // Get users in this segment
    const users = await getUsersForSegment(params.segment);
    const limitedUsers = users.slice(0, maxRecipients);
    
    console.log(`[Email Campaign] Segment "${params.segment}" has ${users.length} users, sending to ${limitedUsers.length}`);
    
    // If dry run, just return the preview
    if (params.dryRun) {
      return {
        segmentSize: users.length,
        sent: 0,
        failed: 0,
        messageIds: [],
        dryRun: true,
      };
    }
    
    // Convert to recipients format
    const recipients = limitedUsers.map(user => ({
      email: user.email,
      name: user.name || undefined,
      userId: user.id,
    }));
    
    // Send the campaign
    const result = await this.sendCampaign({
      recipients,
      template: params.template,
      variant: params.variant,
    });
    
    console.log(`[Email Campaign] Sent ${result.sent}, failed ${result.failed}`);
    
    return {
      segmentSize: users.length,
      ...result,
      dryRun: false,
    };
  }
  
  /**
   * Preview a segment without sending
   */
  async previewSegment(segment: SegmentType | string): Promise<{
    segmentSize: number;
    sampleUsers: Array<{ email: string; name: string | null; lastActive: Date | null }>;
  }> {
    const users = await getUsersForSegment(segment);
    
    return {
      segmentSize: users.length,
      sampleUsers: users.slice(0, 5).map(u => ({
        email: u.email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email
        name: u.name,
        lastActive: u.lastActive,
      })),
    };
  }
}

// ============================================================================
// SEGMENTATION HELPERS
// ============================================================================

export async function getReEngagementSegment(
  supabase: unknown, // Type properly in real implementation
  daysInactive: number
): Promise<Array<{ email: string; name: string; userId: string }>> {
  // This would query Supabase for users who haven't engaged recently
  // Example query structure:
  /*
  const { data } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .lt('last_activity', new Date(Date.now() - daysInactive * 24 * 60 * 60 * 1000).toISOString())
    .eq('email_opt_in', true);
  */
  return [];
}

export async function getResolutionSeasonSegment(
  supabase: unknown
): Promise<Array<{ email: string; name: string; userId: string }>> {
  // Get users who signed up in December/January (resolution mindset)
  return [];
}
