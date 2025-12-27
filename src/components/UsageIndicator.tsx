"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Crown, Sparkles } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getUsageStatus, UsageStatus } from "@/lib/subscription-limits";

interface UsageIndicatorProps {
  variant?: "compact" | "full";
  className?: string;
}

export function UsageIndicator({ variant = "compact", className = "" }: UsageIndicatorProps) {
  const [usage, setUsage] = useState<UsageStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUsage() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status, monthly_conversations, conversation_reset_date")
        .eq("id", user.id)
        .single();

      if (profile) {
        const usageStatus = getUsageStatus(
          profile.subscription_status,
          profile.monthly_conversations || 0,
          profile.conversation_reset_date
        );
        setUsage(usageStatus);
      }
      setIsLoading(false);
    }

    fetchUsage();
  }, []);

  if (isLoading || !usage) return null;

  // Pro users see a simple badge
  if (usage.tier === "pro") {
    if (variant === "compact") {
      return (
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-ember/10 text-ember text-xs font-medium ${className}`}>
          <Crown className="w-3 h-3" />
          Pro
        </div>
      );
    }
    
    return (
      <div className={`flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-ember/10 to-amber-500/10 border border-ember/20 ${className}`}>
        <div className="w-8 h-8 rounded-lg bg-ember/20 flex items-center justify-center">
          <Crown className="w-4 h-4 text-ember" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Willpowered Pro</p>
          <p className="text-xs text-muted-foreground">Unlimited conversations</p>
        </div>
      </div>
    );
  }

  // Free users see their usage
  const percentUsed = (usage.conversationsUsed / usage.conversationsLimit) * 100;
  const isNearLimit = percentUsed >= 80;
  const isAtLimit = usage.isAtLimit;

  if (variant === "compact") {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
        isAtLimit ? "bg-red-100 text-red-700" : 
        isNearLimit ? "bg-amber-100 text-amber-700" : 
        "bg-slate-100 text-slate-600"
      } ${className}`}>
        <MessageCircle className="w-3 h-3" />
        {usage.conversationsUsed}/{usage.conversationsLimit}
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl border ${
      isAtLimit ? "bg-red-50 border-red-200" : 
      isNearLimit ? "bg-amber-50 border-amber-200" : 
      "bg-slate-50 border-slate-200"
    } ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MessageCircle className={`w-4 h-4 ${
            isAtLimit ? "text-red-600" : 
            isNearLimit ? "text-amber-600" : 
            "text-slate-600"
          }`} />
          <span className="text-sm font-medium text-foreground">
            Conversations this month
          </span>
        </div>
        <span className={`text-sm font-bold ${
          isAtLimit ? "text-red-600" : 
          isNearLimit ? "text-amber-600" : 
          "text-slate-900"
        }`}>
          {usage.conversationsUsed}/{usage.conversationsLimit}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
        <div 
          className={`h-full transition-all duration-500 ${
            isAtLimit ? "bg-red-500" : 
            isNearLimit ? "bg-amber-500" : 
            "bg-emerald-500"
          }`}
          style={{ width: `${Math.min(percentUsed, 100)}%` }}
        />
      </div>

      {isAtLimit ? (
        <div className="flex items-center justify-between">
          <p className="text-xs text-red-600">
            Limit reached. Resets in {usage.daysUntilReset} day{usage.daysUntilReset !== 1 ? 's' : ''}.
          </p>
          <Link 
            href="/checkout" 
            className="text-xs font-medium text-ember hover:underline flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            Upgrade
          </Link>
        </div>
      ) : isNearLimit ? (
        <div className="flex items-center justify-between">
          <p className="text-xs text-amber-600">
            {usage.conversationsRemaining} conversation{usage.conversationsRemaining !== 1 ? 's' : ''} remaining
          </p>
          <Link 
            href="/pricing" 
            className="text-xs font-medium text-ember hover:underline"
          >
            Go unlimited →
          </Link>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Resets in {usage.daysUntilReset} day{usage.daysUntilReset !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}



