import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { resend, FROM_EMAIL, REPLY_TO } from "@/lib/resend";
import DailyScorecardEmail from "@/emails/DailyScorecardEmail";
import type { Scorecard } from "@/lib/supabase/types";

/**
 * Debug endpoint to diagnose daily check-in email issues
 * GET: See diagnostic info
 * POST: Force send the daily check-in email to yourself
 */

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
    return new Date().getUTCHours();
  }
}

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

function calculateMetricProgress(scorecard: Scorecard | null) {
  if (!scorecard?.categories || !scorecard?.data?.history) {
    return [];
  }

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  return scorecard.categories.flatMap(cat =>
    cat.metrics.map(metric => {
      const history = scorecard.data?.history?.[metric.id] || {};
      let weekTotal = 0;
      let daysWithData = 0;

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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { 
          error: "Unauthorized - please login first",
          authError: authError?.message,
          hint: "Make sure you're logged in and cookies are being sent"
        },
        { status: 401 }
      );
    }

    // Get profile with email preferences
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    
    // Debug: Check if profile exists and what data it has
    const profileDebug = {
      profileExists: !!profile,
      profileError: profileError?.message,
      profileErrorCode: profileError?.code,
      columnsReturned: profile ? Object.keys(profile) : [],
      rawProfileData: profile,
    };

    const timezone = profile?.timezone || "America/New_York";
    const currentHour = getCurrentHourInTimezone(timezone);
    const currentDay = getCurrentDayInTimezone(timezone);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const prefs = profile?.email_preferences;
    const preferredTime = prefs?.daily_scorecard_time || "18:00";
    const preferredHour = parseInt(preferredTime.split(":")[0], 10);

    const wouldSendNow = prefs?.daily_scorecard && currentHour === preferredHour;

    return NextResponse.json({
      status: "diagnostic",
      user: {
        id: user.id,
        email: user.email,
        name: profile?.full_name || "Not set",
        timezone,
      },
      currentTime: {
        hour: currentHour,
        day: dayNames[currentDay],
        utcTime: new Date().toISOString(),
        localTime: new Date().toLocaleString('en-US', { timeZone: timezone }),
      },
      emailPreferences: {
        daily_scorecard: prefs?.daily_scorecard ?? "NOT SET",
        daily_scorecard_time: preferredTime,
        preferredHour,
        raw: prefs,
      },
      analysis: {
        cronWouldSendNow: wouldSendNow,
        reason: !prefs?.daily_scorecard 
          ? "daily_scorecard is not enabled in email preferences"
          : currentHour !== preferredHour
          ? `Current hour (${currentHour}) doesn't match preferred hour (${preferredHour})`
          : "Email SHOULD be sent now!",
        hourMatch: currentHour === preferredHour,
      },
      scorecard: {
        hasScorecard: !!profile?.scorecard,
        hasScorecardCategories: !!(profile?.scorecard as Scorecard)?.categories?.length,
        metrics: calculateMetricProgress(profile?.scorecard || null),
      },
      profileDebug,
      environment: {
        hasCronSecret: !!process.env.CRON_SECRET,
        hasResendKey: !!process.env.RESEND_API_KEY,
        fromEmail: FROM_EMAIL,
      },
      howToFix: [
        "1. Make sure daily_scorecard is enabled in Settings → Email Reminders",
        "2. Check if CRON_SECRET is set in Vercel environment variables",
        "3. Check Vercel dashboard for cron job execution logs",
        "4. POST to this endpoint to force-send a test email",
      ],
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - please login first" },
        { status: 401 }
      );
    }

    // Get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, timezone, purpose_statement, scorecard")
      .eq("id", user.id)
      .single();

    const timezone = profile?.timezone || "America/New_York";
    const userName = profile?.full_name || "there";
    const dayOfWeek = getCurrentDayInTimezone(timezone);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const metrics = calculateMetricProgress(profile?.scorecard || null);
    const focusMetric = metrics.length > 0
      ? metrics[dayOfWeek % metrics.length]
      : null;

    const subjects = focusMetric ? [
      `How did ${focusMetric.name.toLowerCase()} go today?`,
      `Quick check: ${focusMetric.name}`,
      `${userName}, ${focusMetric.current}/${focusMetric.target} on ${focusMetric.name}`,
      `Your daily progress check`,
    ] : [
      `Time for your daily check-in, ${userName}`,
      `How was today?`,
    ];
    const subject = `[TEST] ${subjects[dayOfWeek % subjects.length]}`;

    console.log("Sending test daily email to:", user.email);

    const { data, error: sendError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email!,
      subject,
      react: DailyScorecardEmail({
        userName,
        focusMetric,
        allMetrics: metrics,
        dayOfWeek: dayNames[dayOfWeek],
        purposeSnippet: profile?.purpose_statement?.slice(0, 50),
        streak: 0,
      }),
      replyTo: REPLY_TO,
    });

    if (sendError) {
      console.error("Send error:", sendError);
      return NextResponse.json({
        success: false,
        error: sendError.message,
        details: sendError,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Daily check-in email sent to ${user.email}`,
      emailId: data?.id,
      subject,
      metricsIncluded: metrics.length,
      checkResend: "Visit resend.com/emails to verify delivery status",
    });
  } catch (error) {
    console.error("Test daily email error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
