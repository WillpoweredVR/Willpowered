import { NextRequest, NextResponse } from "next/server";
import { resend, FROM_EMAIL, REPLY_TO } from "@/lib/resend";
import { createClient } from "@/lib/supabase/server";
import WelcomeEmail from "@/emails/WelcomeEmail";
import CheckinReminderEmail from "@/emails/CheckinReminderEmail";
import WeeklySummaryEmail from "@/emails/WeeklySummaryEmail";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // For admin/system emails, we might not have a user
    const body = await request.json();
    const { type, to, data } = body;

    if (!type || !to) {
      return NextResponse.json(
        { error: "Missing required fields: type, to" },
        { status: 400 }
      );
    }

    let emailContent;
    let subject;

    switch (type) {
      case "welcome":
        subject = "Welcome to Willpowered! 🚀";
        emailContent = WelcomeEmail({ userName: data?.userName || "there" });
        break;

      case "checkin_reminder":
        subject = data?.streakDays 
          ? `🔥 Don't break your ${data.streakDays}-day streak!`
          : "Your daily check-in is waiting";
        emailContent = CheckinReminderEmail({
          userName: data?.userName || "there",
          streakDays: data?.streakDays,
          lastCheckinDate: data?.lastCheckinDate,
        });
        break;

      case "weekly_summary":
        subject = `📊 Your Week ${data?.weekNumber || ""} Summary`;
        emailContent = WeeklySummaryEmail({
          userName: data?.userName || "there",
          weekNumber: data?.weekNumber || 1,
          checkinsCompleted: data?.checkinsCompleted || 0,
          totalDays: data?.totalDays || 7,
          metrics: data?.metrics || [],
          aiInsight: data?.aiInsight,
        });
        break;

      default:
        return NextResponse.json(
          { error: `Unknown email type: ${type}` },
          { status: 400 }
        );
    }

    const { data: sendData, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      react: emailContent,
      replyTo: REPLY_TO,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: sendData?.id });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


