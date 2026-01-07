"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail,
  Loader2,
  ArrowLeft,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const ADMIN_EMAILS = ["colin.robertson3@gmail.com", "colin@willpowered.com"];

interface EmailLog {
  id: string;
  profile_id: string;
  email_type: string;
  sent_at: string;
  user_email?: string;
  user_name?: string;
}

interface EmailStats {
  totalSent: number;
  sentToday: number;
  sentThisWeek: number;
  byType: { [key: string]: number };
}

export default function AdminEmailsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profiles, setProfiles] = useState<{ id: string; email: string; full_name: string | null; last_daily_email_at: string | null; last_weekly_email_at: string | null; email_preferences: Record<string, unknown> | null }[]>([]);
  const [filterType, setFilterType] = useState<"all" | "daily" | "weekly">("all");

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

      // Fetch profiles with email data
      const { data: profilesData, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, last_daily_email_at, last_weekly_email_at, email_preferences")
        .order("last_daily_email_at", { ascending: false, nullsFirst: false })
        .limit(200);

      if (error) {
        console.error("Error fetching profiles:", error);
      } else {
        setProfiles(profilesData || []);
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
          <p className="text-muted-foreground">Loading email logs...</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const now = new Date();
  const today = now.toDateString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const dailyEmailsSent = profiles.filter(p => p.last_daily_email_at).length;
  const weeklyEmailsSent = profiles.filter(p => p.last_weekly_email_at).length;
  const emailsSentToday = profiles.filter(p => 
    p.last_daily_email_at && new Date(p.last_daily_email_at).toDateString() === today
  ).length;
  const usersWithEmailPrefs = profiles.filter(p => 
    p.email_preferences && (p.email_preferences as Record<string, unknown>).daily_scorecard === true
  ).length;

  // Filter profiles based on selected type
  const filteredProfiles = profiles.filter(p => {
    if (filterType === "daily") return p.last_daily_email_at;
    if (filterType === "weekly") return p.last_weekly_email_at;
    return p.last_daily_email_at || p.last_weekly_email_at;
  });

  const sortedProfiles = [...filteredProfiles].sort((a, b) => {
    const dateA = new Date(a.last_daily_email_at || a.last_weekly_email_at || 0).getTime();
    const dateB = new Date(b.last_daily_email_at || b.last_weekly_email_at || 0).getTime();
    return dateB - dateA;
  });

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
              <h1 className="text-3xl font-serif font-bold text-foreground">Email Logs</h1>
              <p className="text-muted-foreground">Track email delivery and preferences</p>
            </div>
          </div>
          <Button asChild variant="outline" className="gap-2">
            <Link href="https://resend.com/emails" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
              Resend Dashboard
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Mail className="w-4 h-4" />
              Daily Emails Sent
            </div>
            <p className="text-2xl font-bold">{dailyEmailsSent}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Calendar className="w-4 h-4 text-blue-500" />
              Weekly Emails Sent
            </div>
            <p className="text-2xl font-bold">{weeklyEmailsSent}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Clock className="w-4 h-4 text-emerald-500" />
              Sent Today
            </div>
            <p className="text-2xl font-bold">{emailsSentToday}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <CheckCircle className="w-4 h-4 text-amber-500" />
              Email Prefs Enabled
            </div>
            <p className="text-2xl font-bold">{usersWithEmailPrefs}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <div className="flex gap-2">
              {(["all", "daily", "weekly"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    filterType === type
                      ? "bg-ember text-white"
                      : "bg-slate-100 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {type === "all" ? "All Emails" : type === "daily" ? "Daily Scorecard" : "Weekly Principles"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Email Logs Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">User</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Last Daily Email</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Last Weekly Email</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Preferences</th>
                </tr>
              </thead>
              <tbody>
                {sortedProfiles.map((profile, index) => {
                  const prefs = profile.email_preferences as Record<string, unknown> | null;
                  return (
                    <motion.tr
                      key={profile.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{profile.full_name || "No name"}</p>
                          <p className="text-sm text-muted-foreground">{profile.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {profile.last_daily_email_at ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            <span className="text-sm">
                              {new Date(profile.last_daily_email_at).toLocaleDateString()} at{" "}
                              {new Date(profile.last_daily_email_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Never sent</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {profile.last_weekly_email_at ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            <span className="text-sm">
                              {new Date(profile.last_weekly_email_at).toLocaleDateString()} at{" "}
                              {new Date(profile.last_weekly_email_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Never sent</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {prefs?.daily_scorecard ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Daily</span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">No Daily</span>
                          )}
                          {prefs?.weekly_principles ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Weekly</span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">No Weekly</span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {sortedProfiles.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No email logs found.
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Email delivery is tracked via the <code className="bg-blue-100 px-1 rounded">last_daily_email_at</code> and <code className="bg-blue-100 px-1 rounded">last_weekly_email_at</code> columns in the profiles table. 
            For detailed delivery analytics and bounces, check the <Link href="https://resend.com/emails" target="_blank" className="underline">Resend Dashboard</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
