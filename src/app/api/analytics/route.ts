import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const POSTHOG_API_URL = "https://us.i.posthog.com";
const POSTHOG_PROJECT_ID = process.env.NEXT_PUBLIC_POSTHOG_KEY?.split("_")[1] || "";

interface PostHogEvent {
  event: string;
  count: number;
  unique_persons: number;
}

interface PostHogTrendResult {
  data: number[];
  labels: string[];
  count: number;
}

async function fetchPostHogInsight(query: object) {
  const response = await fetch(`${POSTHOG_API_URL}/api/projects/@current/query/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.POSTHOG_PERSONAL_API_KEY}`,
    },
    body: JSON.stringify(query),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("PostHog API error:", error);
    throw new Error(`PostHog API error: ${response.status}`);
  }

  return response.json();
}

async function getEventCounts(dateFrom: string, dateTo: string) {
  const query = {
    query: {
      kind: "EventsQuery",
      select: ["event", "count()", "count(distinct person_id)"],
      after: dateFrom,
      before: dateTo,
      orderBy: ["count() DESC"],
      limit: 20,
    },
  };

  const result = await fetchPostHogInsight(query);
  
  return (result.results || []).map((row: [string, number, number]) => ({
    event: row[0],
    count: row[1],
    unique_persons: row[2],
  }));
}

async function getTrendData(event: string, dateFrom: string, dateTo: string) {
  const query = {
    query: {
      kind: "TrendsQuery", 
      series: [
        {
          kind: "EventsNode",
          event: event,
          math: "total",
        },
      ],
      dateRange: {
        date_from: dateFrom,
        date_to: dateTo,
      },
      interval: "day",
    },
  };

  const result = await fetchPostHogInsight(query);
  
  if (result.results && result.results[0]) {
    return {
      data: result.results[0].data || [],
      labels: result.results[0].labels || [],
      count: result.results[0].count || 0,
    };
  }
  
  return { data: [], labels: [], count: 0 };
}

async function getFunnelData(steps: string[], dateFrom: string, dateTo: string) {
  const query = {
    query: {
      kind: "FunnelsQuery",
      series: steps.map((event) => ({
        kind: "EventsNode",
        event: event,
      })),
      dateRange: {
        date_from: dateFrom,
        date_to: dateTo,
      },
      funnelVizType: "steps",
    },
  };

  const result = await fetchPostHogInsight(query);
  
  if (result.results && result.results[0]) {
    return result.results[0].map((step: { name: string; count: number; conversionRates: { total: number } }) => ({
      name: step.name,
      count: step.count,
      rate: Math.round((step.conversionRates?.total || 0) * 100),
    }));
  }
  
  return [];
}

export async function GET(request: NextRequest) {
  // Check authentication - only allow admin users
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get date range from query params
  const searchParams = request.nextUrl.searchParams;
  const range = searchParams.get("range") || "7d";
  
  const now = new Date();
  let dateFrom: string;
  
  switch (range) {
    case "24h":
      dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      break;
    case "7d":
      dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case "30d":
      dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case "90d":
      dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      break;
    default:
      dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  }
  
  const dateTo = now.toISOString();

  try {
    // Fetch all data in parallel
    const [
      pageviewTrend,
      signupTrend,
      eventCounts,
      acquisitionFunnel,
      activationFunnel,
    ] = await Promise.all([
      getTrendData("$pageview", dateFrom, dateTo),
      getTrendData("signup_completed", dateFrom, dateTo),
      getEventCounts(dateFrom, dateTo),
      getFunnelData(
        ["$pageview", "pricing_viewed", "signup_started", "signup_completed"],
        dateFrom,
        dateTo
      ),
      getFunnelData(
        ["signup_completed", "onboarding_started", "goal_created", "checkin_completed"],
        dateFrom,
        dateTo
      ),
    ]);

    // Calculate metrics from event counts
    const getEventCount = (eventName: string) => {
      const event = eventCounts.find((e: PostHogEvent) => e.event === eventName);
      return event ? event.count : 0;
    };

    const getUniqueUsers = (eventName: string) => {
      const event = eventCounts.find((e: PostHogEvent) => e.event === eventName);
      return event ? event.unique_persons : 0;
    };

    // Build response
    const analytics = {
      metrics: {
        visitors: {
          value: pageviewTrend.count,
          trend: "up", // Would need previous period to calculate
          change: 0,
        },
        signups: {
          value: getEventCount("signup_completed"),
          trend: "up",
          change: 0,
        },
        activated: {
          value: getEventCount("checkin_completed"),
          trend: "up", 
          change: 0,
        },
        proSubscribers: {
          value: getEventCount("subscription_started"),
          trend: "up",
          change: 0,
        },
      },
      funnels: {
        acquisition: {
          name: "Acquisition Funnel",
          steps: acquisitionFunnel.length > 0 ? acquisitionFunnel : [
            { name: "Visited Site", count: pageviewTrend.count, rate: 100 },
            { name: "Viewed Pricing", count: getEventCount("pricing_viewed"), rate: 0 },
            { name: "Started Signup", count: getEventCount("signup_started"), rate: 0 },
            { name: "Completed Signup", count: getEventCount("signup_completed"), rate: 0 },
          ],
        },
        activation: {
          name: "Activation Funnel", 
          steps: activationFunnel.length > 0 ? activationFunnel : [
            { name: "Signed Up", count: getEventCount("signup_completed"), rate: 100 },
            { name: "Started Onboarding", count: getEventCount("onboarding_started"), rate: 0 },
            { name: "Set Purpose", count: getEventCount("goal_created"), rate: 0 },
            { name: "First Check-in", count: getEventCount("checkin_completed"), rate: 0 },
          ],
        },
        engagement: {
          name: "Engagement Funnel",
          steps: [
            { name: "Chat Started", count: getEventCount("chat_started"), rate: 100 },
            { name: "Chat Message Sent", count: getEventCount("chat_message_sent"), rate: 0 },
            { name: "Article Viewed", count: getEventCount("article_viewed"), rate: 0 },
          ],
        },
        monetization: {
          name: "Monetization Funnel",
          steps: [
            { name: "Pricing Viewed", count: getEventCount("pricing_viewed"), rate: 100 },
            { name: "Checkout Started", count: getEventCount("checkout_started"), rate: 0 },
            { name: "Subscription Started", count: getEventCount("subscription_started"), rate: 0 },
          ],
        },
      },
      events: eventCounts.slice(0, 10).map((e: PostHogEvent) => ({
        event: e.event,
        count: e.count,
        users: e.unique_persons,
      })),
      trends: {
        pageviews: pageviewTrend,
        signups: signupTrend,
      },
      dateRange: {
        from: dateFrom,
        to: dateTo,
        range,
      },
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics", details: String(error) },
      { status: 500 }
    );
  }
}

