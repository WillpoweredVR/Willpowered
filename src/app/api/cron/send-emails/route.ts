import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resend, FROM_EMAIL, REPLY_TO } from "@/lib/resend";
import Day1ActivationEmail from "@/emails/Day1ActivationEmail";
import Day3EngagementEmail from "@/emails/Day3EngagementEmail";
import Day7MilestoneEmail from "@/emails/Day7MilestoneEmail";

// This route is called by Vercel Cron
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/send-emails", "schedule": "0 * * * *" }] }

const BATCH_SIZE = 10; // Process 10 emails at a time

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Create Supabase client with service role
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Get pending emails that are due
    const { data: pendingEmails, error: fetchError } = await supabase
      .from("scheduled_emails")
      .select("id, user_id, email_type, metadata")
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .order("scheduled_for", { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      console.error("Error fetching pending emails:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch pending emails" },
        { status: 500 }
      );
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return NextResponse.json({ message: "No pending emails", sent: 0 });
    }

    // Get user emails from auth.users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    const userEmailMap = new Map(
      users.users.map((u) => [u.id, u.email])
    );

    // Get profiles for all users in this batch
    const userIds = pendingEmails.map((e) => e.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email_preferences, goal, subscription_status")
      .in("id", userIds);

    const profileMap = new Map(
      (profiles || []).map((p) => [p.id, p])
    );

    // Process each email
    const results = await Promise.allSettled(
      pendingEmails.map(async (scheduledEmail) => {
        const userEmail = userEmailMap.get(scheduledEmail.user_id);
        const profile = profileMap.get(scheduledEmail.user_id) as {
          full_name: string | null;
          email_preferences: Record<string, boolean> | null;
          goal: { purpose?: string } | null;
          subscription_status: string | null;
        } | undefined;

        if (!userEmail) {
          throw new Error(`No email found for user ${scheduledEmail.user_id}`);
        }

        // Check if user has opted out of onboarding emails
        if (profile?.email_preferences?.onboarding_sequence === false) {
          await supabase
            .from("scheduled_emails")
            .update({ status: "cancelled", updated_at: new Date().toISOString() })
            .eq("id", scheduledEmail.id);
          return { id: scheduledEmail.id, status: "cancelled", reason: "opted_out" };
        }

        const userName = profile?.full_name || scheduledEmail.metadata?.user_name || "there";
        const hasSetPurpose = !!profile?.goal?.purpose;
        const isPro = profile?.subscription_status === "active";

        // Get user activity data for personalization
        const { count: checkinCount } = await supabase
          .from("checkins")
          .select("*", { count: "exact", head: true })
          .eq("user_id", scheduledEmail.user_id);

        // Calculate streak (simplified)
        const { data: recentCheckins } = await supabase
          .from("checkins")
          .select("created_at")
          .eq("user_id", scheduledEmail.user_id)
          .order("created_at", { ascending: false })
          .limit(7);

        let streak = 0;
        if (recentCheckins && recentCheckins.length > 0) {
          // Simple streak calculation
          const today = new Date();
          for (let i = 0; i < 7; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);
            const hasCheckin = recentCheckins.some((c) => {
              const checkinDate = new Date(c.created_at);
              return checkinDate.toDateString() === checkDate.toDateString();
            });
            if (hasCheckin) {
              streak++;
            } else if (i > 0) {
              break;
            }
          }
        }

        // Select email template
        let emailComponent;
        let subject;

        switch (scheduledEmail.email_type) {
          case "day_1_activation":
            emailComponent = Day1ActivationEmail({
              userName,
              hasSetPurpose,
            });
            subject = hasSetPurpose
              ? "Great start! Let's build on it 🎯"
              : "The 5-minute start that changes everything";
            break;

          case "day_3_engagement":
            emailComponent = Day3EngagementEmail({
              userName,
              daysActive: checkinCount || 0,
              hasCheckedIn: (checkinCount || 0) > 0,
            });
            subject =
              (checkinCount || 0) > 0
                ? "You're building momentum 💪"
                : "The simple truth about change";
            break;

          case "day_7_milestone":
            emailComponent = Day7MilestoneEmail({
              userName,
              totalCheckins: checkinCount || 0,
              streak,
              isPro,
            });
            subject =
              streak >= 3
                ? "Week 1 complete! 🎉 Here's what you've built"
                : "Week one: an honest look";
            break;

          default:
            throw new Error(`Unknown email type: ${scheduledEmail.email_type}`);
        }

        // Send the email
        const { error: sendError } = await resend.emails.send({
          from: FROM_EMAIL,
          to: userEmail,
          subject,
          react: emailComponent,
          replyTo: REPLY_TO,
        });

        if (sendError) {
          throw sendError;
        }

        // Mark as sent
        await supabase
          .from("scheduled_emails")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", scheduledEmail.id);

        return { id: scheduledEmail.id, status: "sent", email: userEmail };
      })
    );

    // Process results
    const sent = results.filter(
      (r) => r.status === "fulfilled" && (r.value as { status: string }).status === "sent"
    ).length;
    const cancelled = results.filter(
      (r) => r.status === "fulfilled" && (r.value as { status: string }).status === "cancelled"
    ).length;
    const failed = results.filter((r) => r.status === "rejected").length;

    // Log failures
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(
          `Failed to send email ${pendingEmails[index].id}:`,
          result.reason
        );
        // Update status to failed
        supabase
          .from("scheduled_emails")
          .update({
            status: "failed",
            error_message: String(result.reason),
            updated_at: new Date().toISOString(),
          })
          .eq("id", pendingEmails[index].id);
      }
    });

    return NextResponse.json({
      message: "Email processing complete",
      sent,
      cancelled,
      failed,
      total: pendingEmails.length,
    });
  } catch (error) {
    console.error("Error in email cron:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}

