"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Users,
  TrendingUp,
  Target,
  MessageCircle,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  Calendar,
  Filter,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// These would come from PostHog API in production
// For now, showing the dashboard structure
const mockMetrics = {
  visitors: { value: 1247, change: 12.5, trend: "up" },
  signups: { value: 89, change: 8.3, trend: "up" },
  activated: { value: 34, change: -2.1, trend: "down" },
  proSubscribers: { value: 7, change: 40, trend: "up" },
};

const mockFunnels = {
  acquisition: {
    name: "Acquisition Funnel",
    steps: [
      { name: "Visited Site", count: 1247, rate: 100 },
      { name: "Viewed Pricing", count: 312, rate: 25 },
      { name: "Started Signup", count: 156, rate: 12.5 },
      { name: "Completed Signup", count: 89, rate: 7.1 },
    ],
  },
  activation: {
    name: "Activation Funnel",
    steps: [
      { name: "Signed Up", count: 89, rate: 100 },
      { name: "Started Onboarding", count: 72, rate: 81 },
      { name: "Set Purpose", count: 54, rate: 61 },
      { name: "Set Principles", count: 41, rate: 46 },
      { name: "First Check-in", count: 34, rate: 38 },
    ],
  },
  engagement: {
    name: "Engagement Funnel",
    steps: [
      { name: "Activated Users", count: 34, rate: 100 },
      { name: "Week 1 Return", count: 28, rate: 82 },
      { name: "Week 2 Return", count: 19, rate: 56 },
      { name: "Week 4 Return", count: 12, rate: 35 },
    ],
  },
  monetization: {
    name: "Monetization Funnel",
    steps: [
      { name: "Active Free Users", count: 34, rate: 100 },
      { name: "Hit Usage Limit", count: 12, rate: 35 },
      { name: "Viewed Upgrade", count: 9, rate: 26 },
      { name: "Started Trial", count: 8, rate: 24 },
      { name: "Converted to Pro", count: 7, rate: 21 },
    ],
  },
};

const mockEvents = [
  { event: "signup_completed", count: 89, users: 89 },
  { event: "chat_started", count: 234, users: 67 },
  { event: "checkin_completed", count: 156, users: 34 },
  { event: "article_viewed", count: 412, users: 189 },
  { event: "pricing_viewed", count: 78, users: 65 },
  { event: "checkout_started", count: 12, users: 12 },
];

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState("7d");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your key metrics and funnels
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Date Range Selector */}
            <div className="flex items-center gap-1 bg-white rounded-lg border border-border p-1">
              {["24h", "7d", "30d", "90d"].map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    dateRange === range
                      ? "bg-ember text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>

            <Button asChild size="sm" className="gap-2">
              <Link
                href="https://us.posthog.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4" />
                PostHog
              </Link>
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Visitors"
            value={mockMetrics.visitors.value}
            change={mockMetrics.visitors.change}
            trend={mockMetrics.visitors.trend as "up" | "down"}
            icon={Users}
          />
          <MetricCard
            title="Signups"
            value={mockMetrics.signups.value}
            change={mockMetrics.signups.change}
            trend={mockMetrics.signups.trend as "up" | "down"}
            icon={Target}
            highlight
          />
          <MetricCard
            title="Activated"
            value={mockMetrics.activated.value}
            change={mockMetrics.activated.change}
            trend={mockMetrics.activated.trend as "up" | "down"}
            icon={Zap}
          />
          <MetricCard
            title="Pro Subscribers"
            value={mockMetrics.proSubscribers.value}
            change={mockMetrics.proSubscribers.change}
            trend={mockMetrics.proSubscribers.trend as "up" | "down"}
            icon={CreditCard}
            highlight
          />
        </div>

        {/* Conversion Rates Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <ConversionCard
            title="Signup Rate"
            value="7.1%"
            subtitle="Visitors → Signups"
            target="10%"
          />
          <ConversionCard
            title="Activation Rate"
            value="38%"
            subtitle="Signups → First Check-in"
            target="50%"
            warning
          />
          <ConversionCard
            title="Free → Pro"
            value="21%"
            subtitle="Activated → Pro"
            target="8%"
            success
          />
        </div>

        {/* Funnels Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <FunnelCard funnel={mockFunnels.acquisition} />
          <FunnelCard funnel={mockFunnels.activation} />
          <FunnelCard funnel={mockFunnels.engagement} />
          <FunnelCard funnel={mockFunnels.monetization} />
        </div>

        {/* Top Events Table */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h3 className="font-serif text-xl font-bold text-foreground mb-4">
            Top Events (Last {dateRange})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Event
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Total Count
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Unique Users
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Avg per User
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockEvents.map((event, index) => (
                  <tr
                    key={event.event}
                    className={index !== mockEvents.length - 1 ? "border-b border-border/50" : ""}
                  >
                    <td className="py-3 px-4">
                      <code className="text-sm bg-slate-100 px-2 py-1 rounded">
                        {event.event}
                      </code>
                    </td>
                    <td className="text-right py-3 px-4 font-medium">
                      {event.count.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4 text-muted-foreground">
                      {event.users.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4 text-muted-foreground">
                      {(event.count / event.users).toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 p-6 bg-white rounded-2xl border border-border">
          <h3 className="font-serif text-xl font-bold text-foreground mb-4">
            PostHog Quick Links
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickLink
              title="Live Sessions"
              description="Watch user recordings"
              href="https://us.posthog.com/recordings"
              icon={Activity}
            />
            <QuickLink
              title="Feature Flags"
              description="Manage A/B tests"
              href="https://us.posthog.com/feature_flags"
              icon={Filter}
            />
            <QuickLink
              title="Experiments"
              description="View experiment results"
              href="https://us.posthog.com/experiments"
              icon={BarChart3}
            />
            <QuickLink
              title="Insights"
              description="Custom analytics"
              href="https://us.posthog.com/insights"
              icon={TrendingUp}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Component: Metric Card
function MetricCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  highlight,
}: {
  title: string;
  value: number;
  change: number;
  trend: "up" | "down";
  icon: React.ElementType;
  highlight?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-2xl border ${
        highlight
          ? "bg-gradient-to-br from-ember/5 to-amber-50 border-ember/20"
          : "bg-white border-border"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            highlight ? "bg-ember/10" : "bg-slate-100"
          }`}
        >
          <Icon className={`w-5 h-5 ${highlight ? "text-ember" : "text-slate-600"}`} />
        </div>
        <div
          className={`flex items-center gap-1 text-sm font-medium ${
            trend === "up" ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {trend === "up" ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownRight className="w-4 h-4" />
          )}
          {Math.abs(change)}%
        </div>
      </div>
      <div className="text-3xl font-bold text-foreground">{value.toLocaleString()}</div>
      <div className="text-sm text-muted-foreground mt-1">{title}</div>
    </motion.div>
  );
}

// Component: Conversion Card
function ConversionCard({
  title,
  value,
  subtitle,
  target,
  success,
  warning,
}: {
  title: string;
  value: string;
  subtitle: string;
  target: string;
  success?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{title}</span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            success
              ? "bg-emerald-100 text-emerald-700"
              : warning
              ? "bg-amber-100 text-amber-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          Target: {target}
        </span>
      </div>
      <div
        className={`text-3xl font-bold ${
          success ? "text-emerald-600" : warning ? "text-amber-600" : "text-foreground"
        }`}
      >
        {value}
      </div>
      <div className="text-sm text-muted-foreground mt-1">{subtitle}</div>
    </div>
  );
}

// Component: Funnel Card
function FunnelCard({
  funnel,
}: {
  funnel: { name: string; steps: { name: string; count: number; rate: number }[] };
}) {
  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <h3 className="font-serif text-lg font-bold text-foreground mb-4">
        {funnel.name}
      </h3>
      <div className="space-y-3">
        {funnel.steps.map((step, index) => (
          <div key={step.name}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">{step.name}</span>
              <span className="font-medium text-foreground">
                {step.count.toLocaleString()}{" "}
                <span className="text-muted-foreground">({step.rate}%)</span>
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${step.rate}%` }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`h-full rounded-full ${
                  index === funnel.steps.length - 1
                    ? "bg-emerald-500"
                    : "bg-ember"
                }`}
              />
            </div>
          </div>
        ))}
      </div>
      {/* Drop-off indicator */}
      {funnel.steps.length >= 2 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Overall conversion:{" "}
            <span className="font-medium text-foreground">
              {funnel.steps[funnel.steps.length - 1].rate}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Component: Quick Link
function QuickLink({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 p-4 rounded-xl border border-border hover:border-ember/30 hover:bg-ember/5 transition-colors group"
    >
      <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-ember/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-slate-600 group-hover:text-ember" />
      </div>
      <div>
        <div className="font-medium text-foreground group-hover:text-ember text-sm">
          {title}
        </div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </Link>
  );
}

