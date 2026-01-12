/**
 * Email Marketing Module
 * 
 * Extends existing Resend integration for marketing campaigns.
 * Handles lead nurturing, re-engagement, and promotional emails.
 */

import { resend, FROM_EMAIL, REPLY_TO } from '../resend';
import type { Creative } from './types';

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
    
    // Send in batches to respect rate limits
    const BATCH_SIZE = 50;
    for (let i = 0; i < params.recipients.length; i += BATCH_SIZE) {
      const batch = params.recipients.slice(i, i + BATCH_SIZE);
      
      const promises = batch.map(async (recipient) => {
        try {
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
          
          results.sent++;
          if (response.data?.id) {
            results.messageIds.push(response.data.id);
          }
        } catch (error) {
          console.error(`Failed to send to ${recipient.email}:`, error);
          results.failed++;
        }
      });
      
      await Promise.all(promises);
      
      // Rate limit: wait between batches
      if (i + BATCH_SIZE < params.recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
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
