"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CreditCard,
  Loader2,
  ArrowLeft,
  Crown,
  Calendar,
  DollarSign,
  Users,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const ADMIN_EMAILS = ["colin.robertson3@gmail.com", "colin@willpowered.com"];

interface Subscription {
  id: string;
  email: string;
  full_name: string | null;
  subscription_status: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_period_end: string | null;
  subscription_trial_end: string | null;
  created_at: string;
}

export default function AdminSubscriptionsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAdminAndFetch() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const isAdminUser = ADMIN_EMAILS.includes(user.email || "");
      setIsAdmin(isAdminUser);

      if (!isAdminUser) {
        router.push("/dashboard");
        return;
      }

      // Fetch users with subscription info
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, subscription_status, stripe_customer_id, stripe_subscription_id, subscription_period_end, subscription_trial_end, created_at")
        .not("stripe_customer_id", "is", null)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching subscriptions:", error);
      } else {
        setSubscriptions(profiles || []);
      }

      setIsLoading(false);
    }

    checkAdminAndFetch();
  }, [router]);

  if (isAdmin === null || isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-ember mx-auto mb-4" />
          <p className="text-muted-foreground">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  // Stats
  const activeSubscriptions = subscriptions.filter(s => s.subscription_status === "active").length;
  const trialingUsers = subscriptions.filter(s => s.subscription_status === "trialing").length;
  const canceledUsers = subscriptions.filter(s => s.subscription_status === "canceled").length;
  const estimatedMRR = activeSubscriptions * 10; // $10/month per pro user

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "active": return "bg-emerald-100 text-emerald-700";
      case "trialing": return "bg-blue-100 text-blue-700";
      case "canceled": return "bg-slate-100 text-slate-600";
      case "past_due": return "bg-amber-100 text-amber-700";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground">Subscriptions</h1>
              <p className="text-muted-foreground">{subscriptions.length} users with Stripe records</p>
            </div>
          </div>
          <Button asChild variant="outline" className="gap-2">
            <Link href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
              Stripe Dashboard
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Crown className="w-4 h-4 text-emerald-500" />
              Active
            </div>
            <p className="text-2xl font-bold text-emerald-600">{activeSubscriptions}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Calendar className="w-4 h-4 text-blue-500" />
              Trialing
            </div>
            <p className="text-2xl font-bold text-blue-600">{trialingUsers}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <AlertCircle className="w-4 h-4 text-slate-500" />
              Canceled
            </div>
            <p className="text-2xl font-bold text-slate-600">{canceledUsers}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 p-4">
            <div className="flex items-center gap-2 text-emerald-700 text-sm mb-1">
              <DollarSign className="w-4 h-4" />
              Est. MRR
            </div>
            <p className="text-2xl font-bold text-emerald-700">${estimatedMRR}</p>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">User</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Trial Ends</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Period Ends</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub, index) => (
                  <motion.tr
                    key={sub.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">{sub.full_name || "No name"}</p>
                        <p className="text-sm text-muted-foreground">{sub.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sub.subscription_status)}`}>
                        {sub.subscription_status || "none"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {sub.subscription_trial_end 
                        ? new Date(sub.subscription_trial_end).toLocaleDateString()
                        : "-"
                      }
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {sub.subscription_period_end 
                        ? new Date(sub.subscription_period_end).toLocaleDateString()
                        : "-"
                      }
                    </td>
                    <td className="px-4 py-3">
                      {sub.stripe_customer_id && (
                        <Link
                          href={`https://dashboard.stripe.com/customers/${sub.stripe_customer_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-ember hover:underline flex items-center gap-1"
                        >
                          View in Stripe
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {subscriptions.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No subscription records found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
