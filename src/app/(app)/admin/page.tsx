"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart3,
  Users,
  Settings,
  Shield,
  Loader2,
  ArrowRight,
  Sparkles,
  Mail,
  CreditCard,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Admin emails (client-side check as backup)
const ADMIN_EMAILS = [
  "colin.robertson3@gmail.com",
  "colin@willpowered.com",
];

interface AdminSection {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  color: string;
}

const adminSections: AdminSection[] = [
  {
    title: "Analytics",
    description: "View metrics, funnels, and conversion rates from PostHog",
    href: "/admin/analytics",
    icon: BarChart3,
    color: "bg-blue-500",
  },
  {
    title: "Users",
    description: "View and manage user accounts",
    href: "/admin/users",
    icon: Users,
    color: "bg-emerald-500",
  },
  {
    title: "Conversations",
    description: "Review AI coach conversations",
    href: "/admin/conversations",
    icon: MessageSquare,
    color: "bg-purple-500",
  },
  {
    title: "Subscriptions",
    description: "Manage Stripe subscriptions and billing",
    href: "/admin/subscriptions",
    icon: CreditCard,
    color: "bg-amber-500",
  },
  {
    title: "Email Logs",
    description: "View sent emails and delivery status",
    href: "/admin/emails",
    icon: Mail,
    color: "bg-rose-500",
  },
  {
    title: "Settings",
    description: "Configure app settings and feature flags",
    href: "/admin/settings",
    icon: Settings,
    color: "bg-slate-500",
  },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function checkAdmin() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserEmail(user.email || null);

      // Check database for is_admin flag
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin, email")
        .eq("id", user.id)
        .single();

      // Check either database flag or email whitelist
      const hasAdminAccess = 
        profile?.is_admin === true || 
        ADMIN_EMAILS.includes(user.email || "");

      setIsAdmin(hasAdminAccess);

      if (!hasAdminAccess) {
        router.push("/dashboard");
      }
    }

    checkAdmin();
  }, [router]);

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-ember mx-auto mb-4" />
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Access Denied
          </h2>
          <p className="text-muted-foreground mb-4">
            You don&apos;t have permission to access the admin area.
          </p>
          <Button onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl gradient-ember flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground text-sm">
                Logged in as {userEmail}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">Pro</p>
                <p className="text-sm text-muted-foreground">Account Status</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">Admin</p>
                <p className="text-sm text-muted-foreground">Access Level</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Settings className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">Full</p>
                <p className="text-sm text-muted-foreground">Customization</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Admin Sections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-serif font-bold text-foreground mb-4">
            Admin Tools
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminSections.map((section, index) => (
              <Link
                key={section.href}
                href={section.href}
                className="group bg-white rounded-2xl border border-slate-200 p-6 hover:border-ember/30 hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${section.color} flex items-center justify-center flex-shrink-0`}>
                    <section.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground group-hover:text-ember transition-colors">
                      {section.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {section.description}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-ember group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Back to Dashboard */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-ember transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
