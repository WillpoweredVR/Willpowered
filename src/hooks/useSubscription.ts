"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { SubscriptionStatus } from "@/lib/supabase/types";

export interface SubscriptionState {
  status: SubscriptionStatus;
  isLoading: boolean;
  isPro: boolean;
  isTrialing: boolean;
  trialEndsAt: Date | null;
  periodEndsAt: Date | null;
  customerId: string | null;
}

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>({
    status: "free",
    isLoading: true,
    isPro: false,
    isTrialing: false,
    trialEndsAt: null,
    periodEndsAt: null,
    customerId: null,
  });

  useEffect(() => {
    async function fetchSubscription() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status, subscription_trial_end, subscription_period_end, stripe_customer_id")
        .eq("id", user.id)
        .single();

      if (profile) {
        const status = (profile.subscription_status || "free") as SubscriptionStatus;
        const isPro = ["active", "trialing"].includes(status);
        const isTrialing = status === "trialing";

        setState({
          status,
          isLoading: false,
          isPro,
          isTrialing,
          trialEndsAt: profile.subscription_trial_end ? new Date(profile.subscription_trial_end) : null,
          periodEndsAt: profile.subscription_period_end ? new Date(profile.subscription_period_end) : null,
          customerId: profile.stripe_customer_id,
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    }

    fetchSubscription();
  }, []);

  const startCheckout = async () => {
    // Redirect to the embedded checkout page
    window.location.href = "/checkout";
  };

  const openPortal = async () => {
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create portal session");
      }
    } catch (error) {
      console.error("Portal error:", error);
      throw error;
    }
  };

  return {
    ...state,
    startCheckout,
    openPortal,
  };
}

