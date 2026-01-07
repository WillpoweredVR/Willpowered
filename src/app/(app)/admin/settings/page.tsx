"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Settings,
  Loader2,
  ArrowLeft,
  Shield,
  Zap,
  Bell,
  Database,
  ExternalLink,
  CheckCircle,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const ADMIN_EMAILS = ["colin.robertson3@gmail.com", "colin@willpowered.com"];

interface EnvVar {
  name: string;
  description: string;
  isSet: boolean;
  link?: string;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [showSecrets, setShowSecrets] = useState(false);

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

      // Check environment configuration via API
      try {
        const response = await fetch("/api/admin/config");
        if (response.ok) {
          const data = await response.json();
          setEnvVars(data.envVars || []);
        }
      } catch (error) {
        console.error("Error fetching config:", error);
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
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  const quickLinks = [
    { title: "Vercel Dashboard", description: "Deployments & Environment Variables", href: "https://vercel.com/dashboard", icon: Zap },
    { title: "Supabase Dashboard", description: "Database & Authentication", href: "https://supabase.com/dashboard", icon: Database },
    { title: "Stripe Dashboard", description: "Payments & Subscriptions", href: "https://dashboard.stripe.com", icon: Shield },
    { title: "Resend Dashboard", description: "Email Delivery", href: "https://resend.com/emails", icon: Bell },
    { title: "PostHog Dashboard", description: "Analytics & A/B Testing", href: "https://us.posthog.com", icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">Application configuration and quick links</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-ember/30 hover:bg-ember/5 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-ember/10 flex items-center justify-center flex-shrink-0">
                  <link.icon className="w-5 h-5 text-slate-600 group-hover:text-ember" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground group-hover:text-ember flex items-center gap-1">
                    {link.title}
                    <ExternalLink className="w-3 h-3" />
                  </div>
                  <div className="text-sm text-muted-foreground">{link.description}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Environment Configuration */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Environment Configuration</h2>
            <button
              onClick={() => setShowSecrets(!showSecrets)}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showSecrets ? "Hide" : "Show"} Status
            </button>
          </div>

          <div className="space-y-3">
            {[
              { name: "NEXT_PUBLIC_SUPABASE_URL", description: "Supabase project URL" },
              { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", description: "Supabase anonymous key" },
              { name: "SUPABASE_SERVICE_ROLE_KEY", description: "Supabase service role key (server-side)" },
              { name: "STRIPE_SECRET_KEY", description: "Stripe secret key" },
              { name: "STRIPE_WEBHOOK_SECRET", description: "Stripe webhook signing secret" },
              { name: "RESEND_API_KEY", description: "Resend email API key" },
              { name: "ANTHROPIC_API_KEY", description: "Claude AI API key" },
              { name: "CRON_SECRET", description: "Cron job authentication secret" },
              { name: "NEXT_PUBLIC_POSTHOG_KEY", description: "PostHog project API key" },
            ].map((envVar) => (
              <div
                key={envVar.name}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
              >
                <div>
                  <code className="text-sm font-mono text-foreground">{envVar.name}</code>
                  <p className="text-xs text-muted-foreground">{envVar.description}</p>
                </div>
                {showSecrets && (
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                    <CheckCircle className="w-3 h-3 inline mr-1" />
                    Configured
                  </span>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Environment variables are managed in Vercel. To update them, visit the{" "}
            <Link href="https://vercel.com/dashboard" target="_blank" className="text-ember hover:underline">
              Vercel Dashboard
            </Link>.
          </p>
        </div>

        {/* Admin Users */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Admin Users</h2>
          <div className="space-y-2">
            {ADMIN_EMAILS.map((email) => (
              <div key={email} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                <Shield className="w-4 h-4 text-ember" />
                <span className="font-medium text-foreground">{email}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-ember/10 text-ember">Admin</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Admin users are whitelisted in both the database (<code className="bg-slate-100 px-1 rounded">is_admin</code> column) and the codebase. 
            To add new admins, update both locations.
          </p>
        </div>

        {/* Cron Jobs */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Scheduled Jobs (Cron)</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <div>
                <p className="font-medium text-foreground">Daily Reminder Emails</p>
                <p className="text-xs text-muted-foreground">/api/cron/reminder-emails</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">Every hour</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <div>
                <p className="font-medium text-foreground">Subscription Sync</p>
                <p className="text-xs text-muted-foreground">/api/webhooks/stripe</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Webhook</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Cron jobs are configured in <code className="bg-slate-100 px-1 rounded">vercel.json</code>. 
            View execution logs in the{" "}
            <Link href="https://vercel.com/dashboard" target="_blank" className="text-ember hover:underline">
              Vercel Dashboard
            </Link>{" "}
            under Functions → Logs.
          </p>
        </div>
      </div>
    </div>
  );
}
