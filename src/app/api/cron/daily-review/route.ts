/**
 * Daily Marketing Review Cron Job
 * 
 * Runs automatically each morning to:
 * 1. Review campaign performance from PostHog
 * 2. Analyze user engagement trends
 * 3. Check conversion funnels and A/B tests
 * 4. Generate AI-powered recommendations
 * 5. Email a comprehensive summary to the admin
 * 
 * Triggered by Vercel Cron: 0 14 * * * (9 AM Eastern daily)
 */

import { NextResponse } from 'next/server';
import { resend } from '@/lib/resend';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'colin@willpowered.com';
const POSTHOG_API_URL = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.posthog.com';

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron or has valid secret
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    // Allow in development without secret
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  console.log('[Daily Review] Starting automated marketing review...');

  try {
    // Gather all the data in parallel
    const [userMetrics, posthogMetrics, recentActivity] = await Promise.all([
      getUserMetrics(),
      getPostHogMetrics(),
      getRecentActivity(),
    ]);

    // Generate AI insights with all data
    const insights = await generateInsights({
      userMetrics,
      posthogMetrics,
      recentActivity,
    });

    // Send summary email
    await sendSummaryEmail({
      userMetrics,
      posthogMetrics,
      recentActivity,
      insights,
    });

    console.log('[Daily Review] Completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Daily review completed',
      summary: {
        totalUsers: userMetrics.totalUsers,
        activeUsers: userMetrics.activeUsers,
        dormantUsers: userMetrics.dormantUsers,
        pageviews7d: posthogMetrics.pageviews,
        signups7d: posthogMetrics.signups,
        conversionRate: posthogMetrics.signupRate,
        insightsGenerated: insights.recommendations.length,
      },
    });
  } catch (error) {
    console.error('[Daily Review] Error:', error);
    return NextResponse.json(
      { error: 'Failed to complete daily review', details: String(error) },
      { status: 500 }
    );
  }
}

// ============================================================================
// DATA GATHERING FUNCTIONS
// ============================================================================

interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  dormantUsers: number;
  newUsersThisWeek: number;
  completedOnboarding: number;
  abandonedOnboarding: number;
}

async function getUserMetrics(): Promise<UserMetrics> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Total users
  const { count: totalUsers } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // Active users (active in last 7 days)
  const { count: activeUsers } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('updated_at', sevenDaysAgo.toISOString());

  // Dormant users (no activity in 14+ days)
  const { count: dormantUsers } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .lt('updated_at', fourteenDaysAgo.toISOString());

  // New users this week
  const { count: newUsersThisWeek } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgo.toISOString());

  // Onboarding stats
  const { count: completedOnboarding } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('onboarding_completed', true);

  const { count: abandonedOnboarding } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('onboarding_completed', false)
    .lt('created_at', sevenDaysAgo.toISOString());

  return {
    totalUsers: totalUsers || 0,
    activeUsers: activeUsers || 0,
    dormantUsers: dormantUsers || 0,
    newUsersThisWeek: newUsersThisWeek || 0,
    completedOnboarding: completedOnboarding || 0,
    abandonedOnboarding: abandonedOnboarding || 0,
  };
}

// ============================================================================
// POSTHOG ANALYTICS
// ============================================================================

interface PostHogMetrics {
  // Traffic & Acquisition
  pageviews: number;
  uniqueVisitors: number;
  signups: number;
  signupRate: string;
  
  // Activation & Engagement
  checkins: number;
  activationRate: string;
  chatSessions: number;
  articlesViewed: number;
  
  // Monetization
  pricingViewed: number;
  checkoutsStarted: number;
  subscriptions: number;
  conversionRate: string;
  
  // Funnels
  funnels: {
    acquisition: FunnelData;
    activation: FunnelData;
    monetization: FunnelData;
  };
  
  // A/B Tests
  experiments: ExperimentData[];
  
  // Top Events
  topEvents: Array<{ event: string; count: number; users: number }>;
}

interface FunnelData {
  name: string;
  steps: Array<{ name: string; count: number; rate: number }>;
  overallConversion: string;
}

interface ExperimentData {
  name: string;
  variants: Array<{ name: string; users: number; percentage: string }>;
  leadingVariant: string | null;
}

async function fetchPostHogQuery(hogqlQuery: string) {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  
  if (!apiKey) {
    console.warn('[Daily Review] POSTHOG_PERSONAL_API_KEY not configured');
    return null;
  }

  try {
    const response = await fetch(`${POSTHOG_API_URL}/api/projects/@current/query/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: {
          kind: 'HogQLQuery',
          query: hogqlQuery,
        },
      }),
    });

    if (!response.ok) {
      console.error('[Daily Review] PostHog API error:', response.status);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('[Daily Review] PostHog fetch error:', error);
    return null;
  }
}

async function getPostHogMetrics(): Promise<PostHogMetrics> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const dateFromStr = sevenDaysAgo.toISOString().replace('T', ' ').split('.')[0];

  // Fetch event counts
  const eventQuery = `
    SELECT 
      event,
      count() as count,
      count(distinct person_id) as unique_persons
    FROM events
    WHERE timestamp >= toDateTime('${dateFromStr}')
    GROUP BY event
    ORDER BY count DESC
    LIMIT 30
  `;

  // Fetch experiment data
  const experimentQuery = `
    SELECT 
      properties.$feature_flag as flag_name,
      properties.$feature_flag_response as variant,
      count(distinct person_id) as unique_users
    FROM events
    WHERE event = '$feature_flag_called'
    AND timestamp >= toDateTime('${dateFromStr}')
    GROUP BY flag_name, variant
    ORDER BY flag_name, unique_users DESC
  `;

  const [eventResult, experimentResult] = await Promise.all([
    fetchPostHogQuery(eventQuery),
    fetchPostHogQuery(experimentQuery),
  ]);

  // Parse event counts
  const eventCounts: Record<string, { count: number; users: number }> = {};
  if (eventResult?.results) {
    for (const row of eventResult.results) {
      eventCounts[row[0]] = { count: row[1], users: row[2] };
    }
  }

  const getCount = (event: string) => eventCounts[event]?.count || 0;
  const getUsers = (event: string) => eventCounts[event]?.users || 0;

  // Calculate metrics
  const pageviews = getCount('$pageview');
  const signups = getCount('signup_completed');
  const checkins = getCount('checkin_completed');
  const subscriptions = getCount('subscription_started');
  const pricingViewed = getCount('pricing_viewed');
  const checkoutsStarted = getCount('checkout_started');
  const chatSessions = getCount('chat_started');
  const articlesViewed = getCount('article_viewed');
  const onboardingStarted = getCount('onboarding_started');
  const goalCreated = getCount('goal_created');
  const signupStarted = getCount('signup_started');

  // Build funnels
  const acquisitionFunnel: FunnelData = {
    name: 'Acquisition Funnel',
    steps: [
      { name: 'Page Views', count: pageviews, rate: 100 },
      { name: 'Pricing Viewed', count: pricingViewed, rate: pageviews > 0 ? Math.round((pricingViewed / pageviews) * 100) : 0 },
      { name: 'Signup Started', count: signupStarted, rate: pageviews > 0 ? Math.round((signupStarted / pageviews) * 100) : 0 },
      { name: 'Signup Completed', count: signups, rate: pageviews > 0 ? Math.round((signups / pageviews) * 100) : 0 },
    ],
    overallConversion: pageviews > 0 ? `${((signups / pageviews) * 100).toFixed(1)}%` : '0%',
  };

  const activationFunnel: FunnelData = {
    name: 'Activation Funnel',
    steps: [
      { name: 'Signed Up', count: signups, rate: 100 },
      { name: 'Onboarding Started', count: onboardingStarted, rate: signups > 0 ? Math.round((onboardingStarted / signups) * 100) : 0 },
      { name: 'Goal Created', count: goalCreated, rate: signups > 0 ? Math.round((goalCreated / signups) * 100) : 0 },
      { name: 'First Check-in', count: checkins, rate: signups > 0 ? Math.round((checkins / signups) * 100) : 0 },
    ],
    overallConversion: signups > 0 ? `${((checkins / signups) * 100).toFixed(1)}%` : '0%',
  };

  const monetizationFunnel: FunnelData = {
    name: 'Monetization Funnel',
    steps: [
      { name: 'Pricing Viewed', count: pricingViewed, rate: 100 },
      { name: 'Checkout Started', count: checkoutsStarted, rate: pricingViewed > 0 ? Math.round((checkoutsStarted / pricingViewed) * 100) : 0 },
      { name: 'Subscription Started', count: subscriptions, rate: pricingViewed > 0 ? Math.round((subscriptions / pricingViewed) * 100) : 0 },
    ],
    overallConversion: pricingViewed > 0 ? `${((subscriptions / pricingViewed) * 100).toFixed(1)}%` : '0%',
  };

  // Parse experiments
  const experiments: ExperimentData[] = [];
  if (experimentResult?.results) {
    const grouped: Record<string, Array<{ name: string; users: number }>> = {};
    for (const row of experimentResult.results) {
      const flagName = row[0];
      if (!flagName) continue;
      if (!grouped[flagName]) grouped[flagName] = [];
      grouped[flagName].push({ name: row[1] || 'control', users: row[2] });
    }
    
    for (const [name, variants] of Object.entries(grouped)) {
      const totalUsers = variants.reduce((sum, v) => sum + v.users, 0);
      const sortedVariants = variants.sort((a, b) => b.users - a.users);
      experiments.push({
        name,
        variants: variants.map(v => ({
          name: v.name,
          users: v.users,
          percentage: totalUsers > 0 ? `${((v.users / totalUsers) * 100).toFixed(1)}%` : '0%',
        })),
        leadingVariant: totalUsers > 10 ? sortedVariants[0]?.name || null : null,
      });
    }
  }

  // Top events (excluding internal PostHog events)
  const topEvents = Object.entries(eventCounts)
    .filter(([event]) => !event.startsWith('$'))
    .slice(0, 10)
    .map(([event, data]) => ({ event, count: data.count, users: data.users }));

  return {
    pageviews,
    uniqueVisitors: getUsers('$pageview'),
    signups,
    signupRate: pageviews > 0 ? `${((signups / pageviews) * 100).toFixed(2)}%` : '0%',
    checkins,
    activationRate: signups > 0 ? `${((checkins / signups) * 100).toFixed(1)}%` : '0%',
    chatSessions,
    articlesViewed,
    pricingViewed,
    checkoutsStarted,
    subscriptions,
    conversionRate: signups > 0 ? `${((subscriptions / signups) * 100).toFixed(1)}%` : '0%',
    funnels: {
      acquisition: acquisitionFunnel,
      activation: activationFunnel,
      monetization: monetizationFunnel,
    },
    experiments,
    topEvents,
  };
}

interface RecentActivity {
  lastCampaignSent: string | null;
  pendingActions: string[];
  alerts: string[];
}

async function getRecentActivity(): Promise<RecentActivity> {
  const alerts: string[] = [];

  // Check for concerning patterns
  const { count: dormantCount } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .lt('updated_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString());

  if ((dormantCount || 0) > 5) {
    alerts.push(`${dormantCount} users haven't engaged in 14+ days - consider re-engagement campaign`);
  }

  const { count: abandonedCount } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('onboarding_completed', false)
    .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if ((abandonedCount || 0) > 0) {
    alerts.push(`${abandonedCount} users abandoned onboarding - opportunity to re-engage`);
  }

  return {
    lastCampaignSent: null,
    pendingActions: [],
    alerts,
  };
}

// ============================================================================
// AI INSIGHTS GENERATION
// ============================================================================

interface Insights {
  summary: string;
  recommendations: string[];
  urgentActions: string[];
  opportunities: string[];
  experimentInsights: string[];
}

async function generateInsights(data: {
  userMetrics: UserMetrics;
  posthogMetrics: PostHogMetrics;
  recentActivity: RecentActivity;
}): Promise<Insights> {
  const anthropic = new Anthropic();

  const prompt = `You are a marketing analyst for Willpowered, an AI accountability coach app called "Willson" that helps people achieve their goals.

Analyze this comprehensive data and provide actionable insights:

## User Database Metrics (Supabase)
- Total Users: ${data.userMetrics.totalUsers}
- Active Users (7 days): ${data.userMetrics.activeUsers}
- Dormant Users (14+ days inactive): ${data.userMetrics.dormantUsers}
- New Users This Week: ${data.userMetrics.newUsersThisWeek}
- Completed Onboarding: ${data.userMetrics.completedOnboarding}
- Abandoned Onboarding: ${data.userMetrics.abandonedOnboarding}

## Traffic & Conversion (PostHog - Last 7 Days)
- Page Views: ${data.posthogMetrics.pageviews}
- Unique Visitors: ${data.posthogMetrics.uniqueVisitors}
- Signups: ${data.posthogMetrics.signups}
- Signup Rate: ${data.posthogMetrics.signupRate}

## Activation & Engagement
- Check-ins Completed: ${data.posthogMetrics.checkins}
- Activation Rate (signup → check-in): ${data.posthogMetrics.activationRate}
- Chat Sessions Started: ${data.posthogMetrics.chatSessions}
- Articles Viewed: ${data.posthogMetrics.articlesViewed}

## Monetization
- Pricing Page Views: ${data.posthogMetrics.pricingViewed}
- Checkouts Started: ${data.posthogMetrics.checkoutsStarted}
- New Subscriptions: ${data.posthogMetrics.subscriptions}
- Conversion Rate (signup → paid): ${data.posthogMetrics.conversionRate}

## Funnel Performance
- Acquisition Funnel: ${data.posthogMetrics.funnels.acquisition.overallConversion} overall conversion
- Activation Funnel: ${data.posthogMetrics.funnels.activation.overallConversion} overall conversion  
- Monetization Funnel: ${data.posthogMetrics.funnels.monetization.overallConversion} overall conversion

## A/B Tests Running
${data.posthogMetrics.experiments.length > 0 
  ? data.posthogMetrics.experiments.map(exp => 
      `- ${exp.name}: ${exp.variants.map(v => `${v.name} (${v.percentage})`).join(' vs ')}${exp.leadingVariant ? ` - Leading: ${exp.leadingVariant}` : ''}`
    ).join('\n')
  : 'No active experiments'}

## Top Events (Last 7 Days)
${data.posthogMetrics.topEvents.slice(0, 5).map(e => `- ${e.event}: ${e.count} times (${e.users} users)`).join('\n')}

## Alerts
${data.recentActivity.alerts.length > 0 ? data.recentActivity.alerts.join('\n') : 'No alerts'}

## Context
- It's January 2026, peak New Year's resolution season
- Our positioning is "Get AI on your side"
- Target audience: people who want to achieve goals but struggle with consistency
- Industry benchmarks: 2-3% signup rate, 40% activation rate, 5% paid conversion

Provide a JSON response with:
{
  "summary": "1-2 sentence overview focusing on the most important metrics and trends",
  "recommendations": ["Top 3 specific, actionable recommendations based on the data"],
  "urgentActions": ["Any time-sensitive actions (empty if none)"],
  "opportunities": ["Growth opportunities you've identified"],
  "experimentInsights": ["Insights about A/B tests if any are running (empty if none)"]
}

Be specific with numbers. Compare to benchmarks. Prioritize by impact.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      // Extract JSON from response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
  } catch (error) {
    console.error('[Daily Review] AI insights error:', error);
  }

  // Fallback insights if AI fails
  return {
    summary: `${data.posthogMetrics.pageviews} page views with ${data.posthogMetrics.signupRate} signup rate. ${data.userMetrics.dormantUsers} users need re-engagement.`,
    recommendations: [
      parseFloat(data.posthogMetrics.signupRate) < 2 
        ? 'Signup rate is below 2% benchmark - test new CTAs or landing page copy'
        : 'Signup rate is healthy',
      parseFloat(data.posthogMetrics.activationRate) < 40
        ? 'Activation rate needs improvement - review onboarding flow'
        : 'Activation funnel is performing well',
      data.userMetrics.dormantUsers > 0 
        ? `Send re-engagement email to ${data.userMetrics.dormantUsers} dormant users`
        : 'User engagement is healthy',
    ],
    urgentActions: data.recentActivity.alerts,
    opportunities: ['Resolution season is peak time for user acquisition'],
    experimentInsights: data.posthogMetrics.experiments.length > 0 
      ? [`${data.posthogMetrics.experiments.length} experiments running`]
      : [],
  };
}

// ============================================================================
// EMAIL SUMMARY
// ============================================================================

async function sendSummaryEmail(data: {
  userMetrics: UserMetrics;
  posthogMetrics: PostHogMetrics;
  recentActivity: RecentActivity;
  insights: Insights;
}) {
  const { userMetrics, posthogMetrics, insights } = data;

  // Helper to determine color based on benchmark
  const getMetricColor = (value: number, benchmark: number, higherIsBetter = true) => {
    const ratio = value / benchmark;
    if (higherIsBetter) {
      return ratio >= 1 ? '#10B981' : ratio >= 0.7 ? '#F59E0B' : '#EF4444';
    }
    return ratio <= 1 ? '#10B981' : ratio <= 1.3 ? '#F59E0B' : '#EF4444';
  };

  const signupRateNum = parseFloat(posthogMetrics.signupRate) || 0;
  const activationRateNum = parseFloat(posthogMetrics.activationRate) || 0;
  const conversionRateNum = parseFloat(posthogMetrics.conversionRate) || 0;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 650px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
    .container { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: white; padding: 24px; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 5px 0 0; opacity: 0.9; font-size: 14px; }
    .content { padding: 24px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6B7280; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
    .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .metric-card { background: #F9FAFB; border-radius: 8px; padding: 12px; text-align: center; }
    .metric-value { font-size: 24px; font-weight: bold; color: #1F2937; }
    .metric-label { font-size: 11px; color: #6B7280; margin-top: 2px; }
    .metric-benchmark { font-size: 10px; color: #9CA3AF; margin-top: 4px; }
    .funnel-row { display: flex; align-items: center; margin-bottom: 8px; }
    .funnel-label { width: 120px; font-size: 13px; color: #4B5563; }
    .funnel-bar { flex: 1; height: 24px; background: #E5E7EB; border-radius: 4px; overflow: hidden; position: relative; }
    .funnel-fill { height: 100%; background: #8B5CF6; border-radius: 4px; transition: width 0.3s; }
    .funnel-value { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-size: 12px; font-weight: 500; color: #374151; }
    .summary-box { background: #EEF2FF; border-left: 4px solid #8B5CF6; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px; }
    .summary-box p { margin: 0; font-size: 14px; }
    .card { background: #F9FAFB; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
    .card-title { font-weight: 600; font-size: 14px; color: #1F2937; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
    .list { margin: 0; padding-left: 20px; }
    .list li { margin-bottom: 6px; font-size: 14px; color: #4B5563; }
    .urgent { background: #FEF2F2; border-left: 4px solid #EF4444; }
    .opportunity { background: #F0FDF4; border-left: 4px solid #22C55E; }
    .experiment { background: #FEF3C7; border-left: 4px solid #F59E0B; }
    .cta-button { display: inline-block; background: #8B5CF6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 500; margin-top: 8px; }
    .cta-secondary { display: inline-block; background: white; color: #8B5CF6; border: 2px solid #8B5CF6; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500; margin-left: 12px; }
    .footer { padding: 20px 24px; background: #F9FAFB; border-top: 1px solid #E5E7EB; font-size: 12px; color: #9CA3AF; }
    .top-events { display: grid; grid-template-columns: 1fr auto auto; gap: 8px; font-size: 13px; }
    .top-events-header { font-weight: 600; color: #6B7280; padding-bottom: 8px; border-bottom: 1px solid #E5E7EB; }
    .event-name { color: #4B5563; }
    .event-count { color: #1F2937; font-weight: 500; text-align: right; }
    .rate-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Daily Marketing Review</h1>
      <p>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>

    <div class="content">
      <!-- AI Summary -->
      <div class="summary-box">
        <p><strong>🤖 AI Summary:</strong> ${insights.summary}</p>
      </div>

      <!-- Traffic & Acquisition -->
      <div class="section">
        <div class="section-title">🌐 Traffic & Acquisition (Last 7 Days)</div>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">${posthogMetrics.pageviews.toLocaleString()}</div>
            <div class="metric-label">Page Views</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${posthogMetrics.uniqueVisitors.toLocaleString()}</div>
            <div class="metric-label">Unique Visitors</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${posthogMetrics.signups}</div>
            <div class="metric-label">Signups</div>
          </div>
          <div class="metric-card">
            <div class="metric-value" style="color: ${getMetricColor(signupRateNum, 2)}">${posthogMetrics.signupRate}</div>
            <div class="metric-label">Signup Rate</div>
            <div class="metric-benchmark">Benchmark: 2-3%</div>
          </div>
        </div>
      </div>

      <!-- Engagement -->
      <div class="section">
        <div class="section-title">⚡ Activation & Engagement</div>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">${posthogMetrics.checkins}</div>
            <div class="metric-label">Check-ins</div>
          </div>
          <div class="metric-card">
            <div class="metric-value" style="color: ${getMetricColor(activationRateNum, 40)}">${posthogMetrics.activationRate}</div>
            <div class="metric-label">Activation Rate</div>
            <div class="metric-benchmark">Benchmark: 40%</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${posthogMetrics.chatSessions}</div>
            <div class="metric-label">Chat Sessions</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${posthogMetrics.articlesViewed}</div>
            <div class="metric-label">Articles Read</div>
          </div>
        </div>
      </div>

      <!-- Monetization -->
      <div class="section">
        <div class="section-title">💰 Monetization</div>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">${posthogMetrics.pricingViewed}</div>
            <div class="metric-label">Pricing Views</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${posthogMetrics.checkoutsStarted}</div>
            <div class="metric-label">Checkouts</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${posthogMetrics.subscriptions}</div>
            <div class="metric-label">New Subs</div>
          </div>
          <div class="metric-card">
            <div class="metric-value" style="color: ${getMetricColor(conversionRateNum, 5)}">${posthogMetrics.conversionRate}</div>
            <div class="metric-label">Conversion</div>
            <div class="metric-benchmark">Benchmark: 5%</div>
          </div>
        </div>
      </div>

      <!-- User Database -->
      <div class="section">
        <div class="section-title">👥 User Database (Supabase)</div>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">${userMetrics.totalUsers}</div>
            <div class="metric-label">Total Users</div>
          </div>
          <div class="metric-card">
            <div class="metric-value" style="color: #10B981">${userMetrics.activeUsers}</div>
            <div class="metric-label">Active (7d)</div>
          </div>
          <div class="metric-card">
            <div class="metric-value" style="color: ${userMetrics.dormantUsers > 5 ? '#EF4444' : '#F59E0B'}">${userMetrics.dormantUsers}</div>
            <div class="metric-label">Dormant (14d+)</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${userMetrics.newUsersThisWeek}</div>
            <div class="metric-label">New This Week</div>
          </div>
        </div>
      </div>

      <!-- Funnel Overview -->
      <div class="section">
        <div class="section-title">📈 Funnel Performance</div>
        <div class="card">
          <div class="funnel-row">
            <div class="funnel-label">Acquisition</div>
            <div class="funnel-bar">
              <div class="funnel-fill" style="width: ${Math.min(parseFloat(posthogMetrics.funnels.acquisition.overallConversion) * 10, 100)}%"></div>
              <span class="funnel-value">${posthogMetrics.funnels.acquisition.overallConversion}</span>
            </div>
          </div>
          <div class="funnel-row">
            <div class="funnel-label">Activation</div>
            <div class="funnel-bar">
              <div class="funnel-fill" style="width: ${Math.min(parseFloat(posthogMetrics.funnels.activation.overallConversion), 100)}%; background: #10B981"></div>
              <span class="funnel-value">${posthogMetrics.funnels.activation.overallConversion}</span>
            </div>
          </div>
          <div class="funnel-row">
            <div class="funnel-label">Monetization</div>
            <div class="funnel-bar">
              <div class="funnel-fill" style="width: ${Math.min(parseFloat(posthogMetrics.funnels.monetization.overallConversion) * 5, 100)}%; background: #F59E0B"></div>
              <span class="funnel-value">${posthogMetrics.funnels.monetization.overallConversion}</span>
            </div>
          </div>
        </div>
      </div>

      ${insights.urgentActions.length > 0 ? `
      <!-- Urgent Actions -->
      <div class="card urgent">
        <div class="card-title">🚨 Urgent Actions</div>
        <ul class="list">
          ${insights.urgentActions.map(action => `<li>${action}</li>`).join('')}
        </ul>
      </div>
      ` : ''}

      <!-- Recommendations -->
      <div class="card">
        <div class="card-title">💡 AI Recommendations</div>
        <ul class="list">
          ${insights.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
      </div>

      ${insights.opportunities.length > 0 ? `
      <!-- Opportunities -->
      <div class="card opportunity">
        <div class="card-title">🎯 Opportunities</div>
        <ul class="list">
          ${insights.opportunities.map(opp => `<li>${opp}</li>`).join('')}
        </ul>
      </div>
      ` : ''}

      ${posthogMetrics.experiments.length > 0 ? `
      <!-- A/B Tests -->
      <div class="card experiment">
        <div class="card-title">🧪 A/B Test Updates</div>
        <ul class="list">
          ${posthogMetrics.experiments.map(exp => 
            `<li><strong>${exp.name.replace(/_/g, ' ')}</strong>: ${exp.variants.map(v => `${v.name} (${v.percentage})`).join(' vs ')}${exp.leadingVariant ? ` → <em>${exp.leadingVariant} leading</em>` : ''}</li>`
          ).join('')}
        </ul>
        ${insights.experimentInsights.length > 0 ? `
        <p style="margin-top: 12px; font-size: 13px; color: #92400E;">
          <strong>AI Insight:</strong> ${insights.experimentInsights[0]}
        </p>
        ` : ''}
      </div>
      ` : ''}

      ${posthogMetrics.topEvents.length > 0 ? `
      <!-- Top Events -->
      <div class="section">
        <div class="section-title">🔥 Top Events (7 Days)</div>
        <div class="card">
          <div class="top-events">
            <div class="top-events-header">Event</div>
            <div class="top-events-header">Count</div>
            <div class="top-events-header">Users</div>
            ${posthogMetrics.topEvents.slice(0, 5).map(e => `
              <div class="event-name">${e.event.replace(/_/g, ' ')}</div>
              <div class="event-count">${e.count.toLocaleString()}</div>
              <div class="event-count">${e.users.toLocaleString()}</div>
            `).join('')}
          </div>
        </div>
      </div>
      ` : ''}

      <!-- CTAs -->
      <div style="text-align: center; padding: 16px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://willpowered.com'}/admin/marketing" class="cta-button">
          Open Marketing Agent →
        </a>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://willpowered.com'}/admin/analytics" class="cta-secondary">
          View Full Analytics
        </a>
      </div>
    </div>

    <div class="footer">
      <p>This automated daily review is powered by your Willpowered Marketing Agent.</p>
      <p>Data sources: PostHog (behavior analytics) + Supabase (user database)</p>
      <p style="margin-top: 8px;">Reply to this email or open the dashboard to take action.</p>
    </div>
  </div>
</body>
</html>
`;

  await resend.emails.send({
    from: 'Willson Marketing <willson@willpowered.com>',
    to: ADMIN_EMAIL,
    subject: `📊 Daily Review: ${posthogMetrics.signupRate} signup rate, ${posthogMetrics.signups} new signups, ${insights.recommendations.length} recommendations`,
    html,
  });

  console.log(`[Daily Review] Summary email sent to ${ADMIN_EMAIL}`);
}
