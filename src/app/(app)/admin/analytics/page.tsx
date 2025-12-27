"use client";

import { useState, useEffect } from "react";
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
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Metric {
  value: number;
  change: number;
  trend: "up" | "down";
}

interface FunnelStep {
  name: string;
  count: number;
  rate: number;
}

interface Funnel {
  name: string;
  steps: FunnelStep[];
}

interface EventData {
  event: string;
  count: number;
  users: number;
}

interface AnalyticsData {
  metrics: {
    visitors: Metric;
    signups: Metric;
    activated: Metric;
    proSubscribers: Metric;
  };
  funnels: {
    acquisition: Funnel;
    activation: Funnel;
    engagement: Funnel;
    monetization: Funnel;
  };
  events: EventData[];
  dateRange: {
    from: string;
    to: string;
    range: string;
  };
}

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState("7d");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);

  const fetchAnalytics = async (range: string, showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await fetch(`/api/analytics?range=${range}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch analytics");
      }
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(dateRange);
  }, [dateRange]);

  const handleRefresh = () => {
    fetchAnalytics(dateRange, true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-ember mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Failed to load analytics
          </h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => fetchAnalytics(dateRange)}>Try Again</Button>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    visitors: { value: 0, change: 0, trend: "up" as const },
    signups: { value: 0, change: 0, trend: "up" as const },
    activated: { value: 0, change: 0, trend: "up" as const },
    proSubscribers: { value: 0, change: 0, trend: "up" as const },
  };

  const funnels = data?.funnels || {
    acquisition: { name: "Acquisition Funnel", steps: [] },
    activation: { name: "Activation Funnel", steps: [] },
    engagement: { name: "Engagement Funnel", steps: [] },
    monetization: { name: "Monetization Funnel", steps: [] },
  };

  const events = data?.events || [];

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
              Live data from PostHog
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
              disabled={isRefreshing}
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
            title="Page Views"
            value={metrics.visitors.value}
            change={metrics.visitors.change}
            trend={metrics.visitors.trend}
            icon={Users}
          />
          <MetricCard
            title="Signups"
            value={metrics.signups.value}
            change={metrics.signups.change}
            trend={metrics.signups.trend}
            icon={Target}
            highlight
          />
          <MetricCard
            title="Check-ins"
            value={metrics.activated.value}
            change={metrics.activated.change}
            trend={metrics.activated.trend}
            icon={Zap}
          />
          <MetricCard
            title="Pro Subscribers"
            value={metrics.proSubscribers.value}
            change={metrics.proSubscribers.change}
            trend={metrics.proSubscribers.trend}
            icon={CreditCard}
            highlight
          />
        </div>

        {/* Conversion Rates Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <ConversionCard
            title="Signup Rate"
            value={
              metrics.visitors.value > 0
                ? `${((metrics.signups.value / metrics.visitors.value) * 100).toFixed(1)}%`
                : "0%"
            }
            subtitle="Page Views → Signups"
            target="3%"
            success={
              metrics.visitors.value > 0 &&
              (metrics.signups.value / metrics.visitors.value) * 100 >= 3
            }
          />
          <ConversionCard
            title="Activation Rate"
            value={
              metrics.signups.value > 0
                ? `${((metrics.activated.value / metrics.signups.value) * 100).toFixed(1)}%`
                : "0%"
            }
            subtitle="Signups → First Check-in"
            target="40%"
            warning={
              metrics.signups.value > 0 &&
              (metrics.activated.value / metrics.signups.value) * 100 < 40
            }
          />
          <ConversionCard
            title="Pro Conversion"
            value={
              metrics.signups.value > 0
                ? `${((metrics.proSubscribers.value / metrics.signups.value) * 100).toFixed(1)}%`
                : "0%"
            }
            subtitle="Signups → Pro"
            target="5%"
            success={
              metrics.signups.value > 0 &&
              (metrics.proSubscribers.value / metrics.signups.value) * 100 >= 5
            }
          />
        </div>

        {/* Funnels Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <FunnelCard funnel={funnels.acquisition} />
          <FunnelCard funnel={funnels.activation} />
          <FunnelCard funnel={funnels.engagement} />
          <FunnelCard funnel={funnels.monetization} />
        </div>

        {/* Top Events Table */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h3 className="font-serif text-xl font-bold text-foreground mb-4">
            Top Events (Last {dateRange})
          </h3>
          {events.length > 0 ? (
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
                  {events.map((event, index) => (
                    <tr
                      key={event.event}
                      className={
                        index !== events.length - 1
                          ? "border-b border-border/50"
                          : ""
                      }
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
                        {event.users > 0
                          ? (event.count / event.users).toFixed(1)
                          : "0"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No events recorded yet. Events will appear as users interact with
              your site.
            </p>
          )}
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
              href="https://us.posthog.com/replay/recent"
              icon={Activity}
            />
            <QuickLink
              title="Feature Flags"
              description="Manage A/B tests"
              href="https://us.posthog.com/feature_flags"
              icon={Filter}
            />
            <QuickLink
              title="Funnels"
              description="Detailed conversion funnels"
              href="https://us.posthog.com/insights?insight=FUNNELS"
              icon={BarChart3}
            />
            <QuickLink
              title="Events"
              description="All tracked events"
              href="https://us.posthog.com/events"
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
          <Icon
            className={`w-5 h-5 ${highlight ? "text-ember" : "text-slate-600"}`}
          />
        </div>
        {change !== 0 && (
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
        )}
      </div>
      <div className="text-3xl font-bold text-foreground">
        {value.toLocaleString()}
      </div>
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
          success
            ? "text-emerald-600"
            : warning
            ? "text-amber-600"
            : "text-foreground"
        }`}
      >
        {value}
      </div>
      <div className="text-sm text-muted-foreground mt-1">{subtitle}</div>
    </div>
  );
}

// Component: Funnel Card
function FunnelCard({ funnel }: { funnel: Funnel }) {
  const hasData = funnel.steps.length > 0 && funnel.steps.some((s) => s.count > 0);

  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <h3 className="font-serif text-lg font-bold text-foreground mb-4">
        {funnel.name}
      </h3>
      {hasData ? (
        <>
          <div className="space-y-3">
            {funnel.steps.map((step, index) => {
              // Calculate rate relative to first step
              const firstStepCount = funnel.steps[0]?.count || 1;
              const rate =
                index === 0
                  ? 100
                  : Math.round((step.count / firstStepCount) * 100);

              return (
                <div key={step.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{step.name}</span>
                    <span className="font-medium text-foreground">
                      {step.count.toLocaleString()}{" "}
                      <span className="text-muted-foreground">({rate}%)</span>
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${rate}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className={`h-full rounded-full ${
                        index === funnel.steps.length - 1
                          ? "bg-emerald-500"
                          : "bg-ember"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {/* Drop-off indicator */}
          {funnel.steps.length >= 2 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Overall conversion:{" "}
                <span className="font-medium text-foreground">
                  {funnel.steps[0]?.count > 0
                    ? Math.round(
                        (funnel.steps[funnel.steps.length - 1].count /
                          funnel.steps[0].count) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-muted-foreground text-center py-8 text-sm">
          No data yet. Events will appear as users progress through this funnel.
        </p>
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
