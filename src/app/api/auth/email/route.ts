import { NextRequest, NextResponse } from "next/server";
import { resend, FROM_EMAIL, REPLY_TO } from "@/lib/resend";
import VerificationEmail from "@/emails/VerificationEmail";
import PasswordResetEmail from "@/emails/PasswordResetEmail";
import { render } from "@react-email/components";

/**
 * Supabase Auth Email Hook
 * 
 * This endpoint receives auth email requests from Supabase and sends
 * beautifully branded emails using Resend + React Email.
 * 
 * Configure in Supabase Dashboard:
 * Project Settings → Auth → Email Templates → Use Custom SMTP
 * 
 * Or use the Auth Hook in supabase/config.toml:
 * [auth.hook.send_email]
 * enabled = true
 * uri = "https://willpowered.com/api/auth/email"
 */

// Secret to verify requests come from Supabase
const SUPABASE_AUTH_HOOK_SECRET = process.env.SUPABASE_AUTH_HOOK_SECRET;

interface AuthEmailPayload {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: "signup" | "recovery" | "invite" | "magiclink" | "email_change";
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from Supabase (if secret is configured)
    if (SUPABASE_AUTH_HOOK_SECRET) {
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${SUPABASE_AUTH_HOOK_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const payload: AuthEmailPayload = await request.json();
    const { user, email_data } = payload;

    const userName = user.user_metadata?.full_name || 
                    user.email.split("@")[0] || 
                    "there";

    // Build the action URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://willpowered.com";
    const actionUrl = `${baseUrl}/auth/callback?token=${email_data.token_hash}&type=${email_data.email_action_type}`;

    let subject: string;
    let emailHtml: string;

    switch (email_data.email_action_type) {
      case "signup":
        subject = "Verify your email for Willpowered";
        emailHtml = await render(
          VerificationEmail({ userName, verificationLink: actionUrl })
        );
        break;

      case "recovery":
        subject = "Reset your Willpowered password";
        emailHtml = await render(
          PasswordResetEmail({ userName, resetLink: actionUrl })
        );
        break;

      case "magiclink":
        subject = "Your Willpowered sign-in link";
        emailHtml = await render(
          VerificationEmail({ userName, verificationLink: actionUrl })
        );
        break;

      case "invite":
        subject = "You've been invited to Willpowered";
        emailHtml = await render(
          VerificationEmail({ userName, verificationLink: actionUrl })
        );
        break;

      case "email_change":
        subject = "Confirm your new email for Willpowered";
        emailHtml = await render(
          VerificationEmail({ userName, verificationLink: actionUrl })
        );
        break;

      default:
        return NextResponse.json(
          { error: `Unknown email action type: ${email_data.email_action_type}` },
          { status: 400 }
        );
    }

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject,
      html: emailHtml,
      replyTo: REPLY_TO,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Auth email hook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

