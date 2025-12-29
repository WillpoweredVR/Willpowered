import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resend, FROM_EMAIL, REPLY_TO } from "@/lib/resend";
import ProUpgradeEmail from "@/emails/ProUpgradeEmail";

/**
 * Test endpoint to diagnose email sending issues
 * Only accessible to authenticated users
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const userName = profile?.full_name || "there";

    // Check if Resend API key is set
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        success: false,
        error: "RESEND_API_KEY environment variable is not set",
        debug: {
          hasApiKey: false,
          fromEmail: FROM_EMAIL,
          replyTo: REPLY_TO,
          userEmail: user.email,
        }
      });
    }

    // Check for simple mode (plain text, no React)
    const body = await request.json().catch(() => ({}));
    const simpleMode = body.simple === true;

    console.log("Attempting to send test email to:", user.email);
    console.log("From:", FROM_EMAIL);
    console.log("Simple mode:", simpleMode);

    let result;
    
    if (simpleMode) {
      // Send a simple plain text email to rule out React rendering issues
      result = await resend.emails.send({
        from: FROM_EMAIL,
        to: user.email!,
        subject: `Simple Test - ${new Date().toLocaleTimeString()}`,
        text: `Hi ${userName},\n\nThis is a simple test email from Willpowered.\n\nIf you receive this, emails are working!\n\nBest,\nWillson`,
        replyTo: REPLY_TO,
      });
    } else {
      // Send with React template
      result = await resend.emails.send({
        from: FROM_EMAIL,
        to: user.email!,
        subject: `Test Email - ${new Date().toLocaleTimeString()}`,
        react: ProUpgradeEmail({
          userName,
          isTrialing: true,
          trialEndDate: "January 5, 2025",
        }),
        replyTo: REPLY_TO,
      });
    }

    const { data, error } = result;

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({
        success: false,
        error: error.message,
        errorName: error.name,
        errorDetails: JSON.stringify(error),
        debug: {
          hasApiKey: true,
          fromEmail: FROM_EMAIL,
          replyTo: REPLY_TO,
          userEmail: user.email,
          simpleMode,
        }
      });
    }

    console.log("Email sent successfully:", data);

    // Try to get email status from Resend
    let emailStatus = null;
    if (data?.id) {
      try {
        const statusResult = await resend.emails.get(data.id);
        emailStatus = statusResult;
      } catch (e) {
        console.log("Could not fetch email status:", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${user.email}`,
      emailId: data?.id,
      emailStatus,
      debug: {
        hasApiKey: true,
        fromEmail: FROM_EMAIL,
        replyTo: REPLY_TO,
        userEmail: user.email,
        simpleMode,
        tip: "Check resend.com/emails to see delivery status"
      }
    });

  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Use POST to send a test email",
    usage: "POST /api/test-email (requires authentication)",
    checks: {
      resendApiKeySet: !!process.env.RESEND_API_KEY,
      fromEmail: FROM_EMAIL,
      replyTo: REPLY_TO,
    }
  });
}

