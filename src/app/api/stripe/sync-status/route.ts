import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";
import { resend, FROM_EMAIL, REPLY_TO } from "@/lib/resend";
import ProUpgradeEmail from "@/emails/ProUpgradeEmail";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

/**
 * Sync subscription status from Stripe to our database
 * Called after checkout or when subscription status seems stale
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

    // Check if force sending email is requested
    const body = await request.json().catch(() => ({}));
    const forceSendEmail = body.forceSendEmail === true;

    // Get user's profile with Stripe IDs
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, stripe_subscription_id, subscription_status, full_name, pro_welcome_email_sent")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ 
        synced: false, 
        reason: "No Stripe customer ID",
        status: profile?.subscription_status || "free"
      });
    }

    const previousStatus = profile.subscription_status;

    // Get the customer's active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: "all",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // No subscriptions found - ensure user is on free tier
      if (profile.subscription_status !== "free") {
        await supabase
          .from("profiles")
          .update({ 
            subscription_status: "free",
            stripe_subscription_id: null,
          })
          .eq("id", user.id);
      }
      return NextResponse.json({ 
        synced: true, 
        status: "free" 
      });
    }

    // Get the most recent subscription
    const subscription = subscriptions.data[0];
    
    // Map Stripe status to our status
    const statusMap: Record<string, string> = {
      active: "active",
      trialing: "trialing",
      past_due: "past_due",
      canceled: "canceled",
      unpaid: "unpaid",
      incomplete: "incomplete",
      incomplete_expired: "expired",
      paused: "paused",
    };

    const newStatus = statusMap[subscription.status] || subscription.status;
    const periodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end;
    const currentPeriodEnd = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;
    const trialEndTimestamp = (subscription as unknown as { trial_end?: number | null }).trial_end;
    const trialEnd = trialEndTimestamp 
      ? new Date(trialEndTimestamp * 1000).toISOString() 
      : null;

    // Check if this is a Pro user who hasn't received the welcome email yet
    const isPro = newStatus === "active" || newStatus === "trialing";
    const hasReceivedWelcomeEmail = profile.pro_welcome_email_sent === true;
    const shouldSendEmail = isPro && (!hasReceivedWelcomeEmail || forceSendEmail);

    // Update profile if status changed
    if (profile.subscription_status !== newStatus || 
        profile.stripe_subscription_id !== subscription.id) {
      await supabase
        .from("profiles")
        .update({
          stripe_subscription_id: subscription.id,
          subscription_status: newStatus,
          subscription_period_end: currentPeriodEnd,
          subscription_trial_end: trialEnd,
        })
        .eq("id", user.id);
    }

    // Send upgrade confirmation email
    if (shouldSendEmail && user.email) {
      const userName = profile.full_name || "there";
      const isTrialing = newStatus === "trialing";
      const trialEndDate = trialEnd 
        ? new Date(trialEnd).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })
        : undefined;

      try {
        const { error: emailError } = await resend.emails.send({
          from: FROM_EMAIL,
          to: user.email,
          subject: isTrialing 
            ? `Welcome to Willpowered Pro, ${userName}! Your trial has started.`
            : `Welcome to Willpowered Pro, ${userName}!`,
          react: ProUpgradeEmail({
            userName,
            isTrialing,
            trialEndDate,
          }),
          replyTo: REPLY_TO,
        });

        if (!emailError) {
          // Mark email as sent so we don't send it again
          await supabase
            .from("profiles")
            .update({ pro_welcome_email_sent: true })
            .eq("id", user.id);
        } else {
          console.error("Failed to send Pro upgrade email:", emailError);
        }
      } catch (emailError) {
        console.error("Failed to send Pro upgrade email:", emailError);
        // Don't fail the whole request if email fails
      }
    }

    return NextResponse.json({ 
      synced: true, 
      status: newStatus,
      periodEnd: currentPeriodEnd,
      trialEnd,
      emailSent: shouldSendEmail,
      isPro,
    });
  } catch (error) {
    console.error("Error syncing subscription status:", error);
    return NextResponse.json(
      { error: "Failed to sync subscription status" },
      { status: 500 }
    );
  }
}
