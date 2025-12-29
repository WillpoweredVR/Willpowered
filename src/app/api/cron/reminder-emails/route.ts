import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resend, FROM_EMAIL, REPLY_TO } from "@/lib/resend";
import DailyScorecardEmail from "@/emails/DailyScorecardEmail";
import WeeklyPrinciplesEmail from "@/emails/WeeklyPrinciplesEmail";
import type { Scorecard, Principle, WeeklyPrincipleReview } from "@/lib/supabase/types";

// This route is called by Vercel Cron every hour
// It checks who should receive daily or weekly emails based on their preferences

const BATCH_SIZE = 20;

interface EmailPreferences {
  daily_scorecard?: boolean;
  daily_scorecard_time?: string;
  weekly_principles?: boolean;
  weekly_principles_day?: number;
}

interface ProfileData {
  id: string;
  full_name: string | null;
  email_preferences: EmailPreferences | null;
  timezone: string;
  purpose_statement: string | null;
  scorecard: Scorecard | null;
  principles: Principle[] | null;
  principle_reviews: WeeklyPrincipleReview[] | null;
}

// Get the current hour in a user's timezone
function getCurrentHourInTimezone(timezone: string): number {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    });
    return parseInt(formatter.format(now), 10);
  } catch {
    return new Date().getUTCHours(); // Fallback to UTC
  }
}

// Get the current day of week (0 = Sunday) in a user's timezone
function getCurrentDayInTimezone(timezone: string): number {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
    });
    const dayName = formatter.format(now);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.indexOf(dayName);
  } catch {
    return new Date().getUTCDay();
  }
}

// Check if we should send daily email to this user right now
function shouldSendDailyEmail(prefs: EmailPreferences | null, timezone: string): boolean {
  if (!prefs?.daily_scorecard) return false;
  
  const preferredTime = prefs.daily_scorecard_time || "18:00";
  const preferredHour = parseInt(preferredTime.split(":")[0], 10);
  const currentHour = getCurrentHourInTimezone(timezone);
  
  // Match if we're within the preferred hour
  return currentHour === preferredHour;
}

// Check if we should send weekly email to this user right now
function shouldSendWeeklyEmail(prefs: EmailPreferences | null, timezone: string): boolean {
  if (!prefs?.weekly_principles) return false;
  
  const preferredDay = prefs.weekly_principles_day ?? 0; // Sunday default
  const currentDay = getCurrentDayInTimezone(timezone);
  const currentHour = getCurrentHourInTimezone(timezone);
  
  // Send at 9 AM on the preferred day
  return currentDay === preferredDay && currentHour === 9;
}

// Calculate weekly metrics progress
function calculateMetricProgress(scorecard: Scorecard | null) {
  if (!scorecard?.categories || !scorecard?.data?.history) {
    return [];
  }

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
  
  return scorecard.categories.flatMap(cat => 
    cat.metrics.map(metric => {
      const history = scorecard.data?.history?.[metric.id] || {};
      let weekTotal = 0;
      let daysWithData = 0;

      // Sum up values for the current week
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        if (date > today) break;
        
        const dateStr = date.toISOString().split('T')[0];
        if (history[dateStr] !== undefined) {
          weekTotal += history[dateStr];
          daysWithData++;
        }
      }

      const current = metric.aggregation === 'average' && daysWithData > 0
        ? Math.round(weekTotal / daysWithData)
        : weekTotal;

      const isOnTrack = metric.direction === 'higher'
        ? current >= metric.target * (today.getDay() / 7)
        : current <= metric.target * (today.getDay() / 7);

      return {
        name: metric.name,
        current,
        target: metric.target,
        unit: metric.unit,
        isOnTrack,
      };
    })
  );
}

// Get principle strength based on review history
function calculatePrincipleStrength(
  principle: Principle,
  reviews: WeeklyPrincipleReview[] | null
): "strong" | "building" | "needs_attention" | undefined {
  if (!reviews || reviews.length === 0) return undefined;

  const entriesForPrinciple = reviews
    .flatMap(r => r.entries)
    .filter(e => e.principleId === principle.id && e.wasTested);

  if (entriesForPrinciple.length === 0) return undefined;

  const heldCount = entriesForPrinciple.filter(e => e.response === 'held').length;
  const total = entriesForPrinciple.length;
  const ratio = heldCount / total;

  if (ratio >= 0.8) return "strong";
  if (ratio >= 0.5) return "building";
  return "needs_attention";
}

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Get all profiles with email preferences set
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email_preferences, timezone, purpose_statement, scorecard, principles, principle_reviews")
      .not("email_preferences", "is", null)
      .limit(BATCH_SIZE);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 });
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ message: "No profiles with preferences", sent: 0 });
    }

    // Get user emails from auth
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    const userEmailMap = new Map(users.users.map(u => [u.id, u.email]));

    let dailySent = 0;
    let weeklySent = 0;
    const errors: string[] = [];

    // Process each profile
    for (const profile of profiles as ProfileData[]) {
      const userEmail = userEmailMap.get(profile.id);
      if (!userEmail) continue;

      const timezone = profile.timezone || "America/New_York";
      const userName = profile.full_name || "there";

      // Check for daily scorecard email
      if (shouldSendDailyEmail(profile.email_preferences, timezone)) {
        try {
          const metrics = calculateMetricProgress(profile.scorecard);
          
          // Pick a "focus metric" - rotate based on day of week
          const dayOfWeek = getCurrentDayInTimezone(timezone);
          const focusMetric = metrics.length > 0 
            ? metrics[dayOfWeek % metrics.length]
            : null;

          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

          // Personalized subject lines
          const subjects = focusMetric ? [
            `How did ${focusMetric.name.toLowerCase()} go today?`,
            `Quick check: ${focusMetric.name}`,
            `${userName}, ${focusMetric.current}/${focusMetric.target} on ${focusMetric.name}`,
            `Your daily progress check`,
          ] : [
            `Time for your daily check-in, ${userName}`,
            `How was today?`,
          ];
          const subject = subjects[dayOfWeek % subjects.length];

          const { error: sendError } = await resend.emails.send({
            from: FROM_EMAIL,
            to: userEmail,
            subject,
            react: DailyScorecardEmail({
              userName,
              focusMetric,
              allMetrics: metrics,
              dayOfWeek: dayNames[dayOfWeek],
              purposeSnippet: profile.purpose_statement?.slice(0, 50),
              streak: 0, // Could calculate from checkins
            }),
            replyTo: REPLY_TO,
          });

          if (sendError) {
            errors.push(`Daily email to ${userEmail}: ${sendError.message}`);
          } else {
            dailySent++;
          }
        } catch (e) {
          errors.push(`Daily email to ${userEmail}: ${e}`);
        }
      }

      // Check for weekly principles email
      if (shouldSendWeeklyEmail(profile.email_preferences, timezone)) {
        try {
          const principles = (profile.principles || []) as Principle[];
          const reviews = (profile.principle_reviews || []) as WeeklyPrincipleReview[];

          // Map principles with strength
          const principlesWithStatus = principles.map(p => ({
            text: p.text,
            strength: calculatePrincipleStrength(p, reviews),
            whenTested: p.whenTested,
            testedThisWeek: false,
          }));

          // Pick a focus principle - prioritize ones needing attention or building
          const focusPrinciple = principlesWithStatus.find(p => 
            p.strength === 'needs_attention' || p.strength === 'building'
          ) || principlesWithStatus[0] || null;

          const strongCount = principlesWithStatus.filter(p => p.strength === 'strong').length;

          // Find last review date
          const lastReview = reviews.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];

          const subjects = focusPrinciple ? [
            `This week: Was "${focusPrinciple.text.slice(0, 25)}..." tested?`,
            `Time for your principles review, ${userName}`,
            `5 minutes to reflect on your week`,
          ] : [
            `Weekly principles check, ${userName}`,
          ];
          const subject = subjects[Math.floor(Math.random() * subjects.length)];

          const { error: sendError } = await resend.emails.send({
            from: FROM_EMAIL,
            to: userEmail,
            subject,
            react: WeeklyPrinciplesEmail({
              userName,
              focusPrinciple,
              allPrinciples: principlesWithStatus,
              lastReviewDate: lastReview?.createdAt,
              totalPrinciplesStrong: strongCount,
            }),
            replyTo: REPLY_TO,
          });

          if (sendError) {
            errors.push(`Weekly email to ${userEmail}: ${sendError.message}`);
          } else {
            weeklySent++;
          }
        } catch (e) {
          errors.push(`Weekly email to ${userEmail}: ${e}`);
        }
      }
    }

    return NextResponse.json({
      message: "Reminder emails processed",
      dailySent,
      weeklySent,
      errors: errors.length > 0 ? errors : undefined,
      profilesChecked: profiles.length,
    });
  } catch (error) {
    console.error("Error in reminder email cron:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}

