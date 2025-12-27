import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PostHog API - use the app host, not the ingestion host
const POSTHOG_API_URL = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.posthog.com";

interface PostHogEvent {
  event: string;
  count: number;
  unique_persons: number;
}

async function fetchPostHogQuery(hogqlQuery: string) {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  
  if (!apiKey) {
    throw new Error("POSTHOG_PERSONAL_API_KEY is not configured");
  }

  const response = await fetch(`${POSTHOG_API_URL}/api/projects/@current/query/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query: {
        kind: "HogQLQuery",
        query: hogqlQuery,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("PostHog API error:", response.status, errorText);
    throw new Error(`PostHog API error: ${response.status} - ${errorText.substring(0, 200)}`);
  }

  return response.json();
}

async function getEventCounts(dateFrom: string) {
  const query = `
    SELECT 
      event,
      count() as count,
      count(distinct person_id) as unique_persons
    FROM events
    WHERE timestamp >= toDateTime('${dateFrom}')
    GROUP BY event
    ORDER BY count DESC
    LIMIT 20
  `;

  try {
    const result = await fetchPostHogQuery(query);
    return (result.results || []).map((row: [string, number, number]) => ({
      event: row[0],
      count: row[1],
      unique_persons: row[2],
    }));
  } catch (error) {
    console.error("Error fetching event counts:", error);
    return [];
  }
}

async function getEventCount(eventName: string, dateFrom: string): Promise<number> {
  const query = `
    SELECT count() as count
    FROM events
    WHERE event = '${eventName}'
    AND timestamp >= toDateTime('${dateFrom}')
  `;

  try {
    const result = await fetchPostHogQuery(query);
    return result.results?.[0]?.[0] || 0;
  } catch (error) {
    console.error(`Error fetching count for ${eventName}:`, error);
    return 0;
  }
}

async function getUniqueUsers(eventName: string, dateFrom: string): Promise<number> {
  const query = `
    SELECT count(distinct person_id) as unique_users
    FROM events
    WHERE event = '${eventName}'
    AND timestamp >= toDateTime('${dateFrom}')
  `;

  try {
    const result = await fetchPostHogQuery(query);
    return result.results?.[0]?.[0] || 0;
  } catch (error) {
    console.error(`Error fetching unique users for ${eventName}:`, error);
    return 0;
  }
}

export async function GET(request: NextRequest) {
  // Check authentication - only allow logged-in users
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if PostHog API key is configured
  if (!process.env.POSTHOG_PERSONAL_API_KEY) {
    return NextResponse.json(
      { error: "PostHog API key not configured. Add POSTHOG_PERSONAL_API_KEY to environment variables." },
      { status: 500 }
    );
  }

  // Get date range from query params
  const searchParams = request.nextUrl.searchParams;
  const range = searchParams.get("range") || "7d";
  
  const now = new Date();
  let dateFrom: Date;
  
  switch (range) {
    case "24h":
      dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "7d":
      dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  
  const dateFromStr = dateFrom.toISOString().replace('T', ' ').split('.')[0];

  try {
    // Fetch event counts first
    const eventCounts = await getEventCounts(dateFromStr);
    
    // Helper to get count from eventCounts
    const getCount = (eventName: string): number => {
      const event = eventCounts.find((e: PostHogEvent) => e.event === eventName);
      return event?.count || 0;
    };

    const getUnique = (eventName: string): number => {
      const event = eventCounts.find((e: PostHogEvent) => e.event === eventName);
      return event?.unique_persons || 0;
    };

    // Build metrics
    const pageviews = getCount("$pageview");
    const signups = getCount("signup_completed");
    const checkins = getCount("checkin_completed");
    const subscriptions = getCount("subscription_started");

    // Build response
    const analytics = {
      metrics: {
        visitors: {
          value: pageviews,
          trend: "up" as const,
          change: 0,
        },
        signups: {
          value: signups,
          trend: "up" as const,
          change: 0,
        },
        activated: {
          value: checkins,
          trend: "up" as const,
          change: 0,
        },
        proSubscribers: {
          value: subscriptions,
          trend: "up" as const,
          change: 0,
        },
      },
      funnels: {
        acquisition: {
          name: "Acquisition Funnel",
          steps: [
            { name: "Page Views", count: pageviews, rate: 100 },
            { name: "Pricing Viewed", count: getCount("pricing_viewed"), rate: 0 },
            { name: "Signup Started", count: getCount("signup_started"), rate: 0 },
            { name: "Signup Completed", count: signups, rate: 0 },
          ],
        },
        activation: {
          name: "Activation Funnel",
          steps: [
            { name: "Signed Up", count: signups, rate: 100 },
            { name: "Onboarding Started", count: getCount("onboarding_started"), rate: 0 },
            { name: "Goal Created", count: getCount("goal_created"), rate: 0 },
            { name: "First Check-in", count: checkins, rate: 0 },
          ],
        },
        engagement: {
          name: "Engagement Funnel",
          steps: [
            { name: "Dashboard Viewed", count: getCount("dashboard_viewed"), rate: 100 },
            { name: "Chat Started", count: getCount("chat_started"), rate: 0 },
            { name: "Article Viewed", count: getCount("article_viewed"), rate: 0 },
          ],
        },
        monetization: {
          name: "Monetization Funnel",
          steps: [
            { name: "Pricing Viewed", count: getCount("pricing_viewed"), rate: 100 },
            { name: "Checkout Started", count: getCount("checkout_started"), rate: 0 },
            { name: "Subscription Started", count: subscriptions, rate: 0 },
          ],
        },
      },
      events: eventCounts.slice(0, 10).map((e: PostHogEvent) => ({
        event: e.event,
        count: e.count,
        users: e.unique_persons,
      })),
      dateRange: {
        from: dateFromStr,
        to: now.toISOString(),
        range,
      },
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch analytics", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
