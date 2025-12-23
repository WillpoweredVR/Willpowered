import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

// Use service role for webhook to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  // Find user by customer ID
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (profile) {
    await supabaseAdmin
      .from("profiles")
      .update({
        stripe_subscription_id: subscriptionId,
        subscription_status: "trialing",
      })
      .eq("id", profile.id);
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
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

  const status = statusMap[subscription.status] || subscription.status;
  // Access period end from the subscription object (property exists but types may vary by API version)
  const periodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end;
  const currentPeriodEnd = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;
  const trialEndTimestamp = (subscription as unknown as { trial_end?: number | null }).trial_end;
  const trialEnd = trialEndTimestamp 
    ? new Date(trialEndTimestamp * 1000).toISOString() 
    : null;

  // Find user by customer ID
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (profile) {
    await supabaseAdmin
      .from("profiles")
      .update({
        stripe_subscription_id: subscription.id,
        subscription_status: status,
        subscription_period_end: currentPeriodEnd,
        subscription_trial_end: trialEnd,
      })
      .eq("id", profile.id);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Find user by customer ID
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (profile) {
    await supabaseAdmin
      .from("profiles")
      .update({
        subscription_status: "canceled",
        stripe_subscription_id: null,
      })
      .eq("id", profile.id);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as unknown as { subscription?: string | null }).subscription;
  if (!subscriptionId) return;
  
  const customerId = invoice.customer as string;

  // Find user by customer ID
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (profile) {
    await supabaseAdmin
      .from("profiles")
      .update({
        subscription_status: "active",
      })
      .eq("id", profile.id);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as unknown as { subscription?: string | null }).subscription;
  if (!subscriptionId) return;
  
  const customerId = invoice.customer as string;

  // Find user by customer ID
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (profile) {
    await supabaseAdmin
      .from("profiles")
      .update({
        subscription_status: "past_due",
      })
      .eq("id", profile.id);
  }
}


