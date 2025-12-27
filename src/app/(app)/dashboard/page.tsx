"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Target,
  CheckCircle,
  Plus,
  LogOut,
  Settings,
  User,
  Compass,
  Pencil,
  Trash2,
  ChevronRight,
  MessageCircle,
  Shield,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Check,
  X,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { ChatModal } from "@/components/ChatModal";
import { EditModal } from "@/components/EditModal";
import { MetricEditModal } from "@/components/MetricEditModal";
import { DailyCheckinModal } from "@/components/DailyCheckinModal";
import { UsageIndicator } from "@/components/UsageIndicator";
import type { 
  Profile, 
  Goal, 
  Principle,
  Scorecard,
  ScorecardCategory,
  ScorecardMetric,
  ScorecardData,
} from "@/lib/supabase/types";

// Helper to get today's date in ISO format
function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

// Helper to get the last 7 days including today
function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(date.toISOString().split('T')[0]);
  }
  return days;
}

// Empty scorecard categories - users create their own
const EMPTY_SCORECARD_CATEGORIES: ScorecardCategory[] = [];

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [principles, setPrinciples] = useState<Principle[]>([]);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    type: "goal" | "why" | "purpose";
    value: string;
  }>({ isOpen: false, type: "goal", value: "" });
  const [newPrincipleInput, setNewPrincipleInput] = useState("");
  const [isAddingPrinciple, setIsAddingPrinciple] = useState(false);
  const [editingPrinciple, setEditingPrinciple] = useState<string | null>(null);
  const [coachContext, setCoachContext] = useState<{ message: string; title: string } | null>(null);
  
  // Metric editing state
  const [editingMetric, setEditingMetric] = useState<{
    metricId: string;
    date: string;
    currentValue: number | null;
  } | null>(null);
  const [metricInputValue, setMetricInputValue] = useState("");
  
  // Metric config editing
  const [metricEditModal, setMetricEditModal] = useState<{
    isOpen: boolean;
    metric: ScorecardMetric | null;
    categoryId: string;
    isNew: boolean;
  }>({ isOpen: false, metric: null, categoryId: "", isNew: false });
  
  // Daily check-in modal
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);

  const today = getToday();
  const last7Days = useMemo(() => getLast7Days(), []);

  const dayOfWeek = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const formattedDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      if (profileData.principles) {
        setPrinciples(profileData.principles as Principle[]);
      }
      if (profileData.scorecard) {
        setScorecard(profileData.scorecard as Scorecard);
      } else {
        // Initialize with empty scorecard - users create their own metrics
        const emptyScorecard: Scorecard = {
          categories: EMPTY_SCORECARD_CATEGORIES,
          data: { history: {} }
        };
        setScorecard(emptyScorecard);
      }
    }

    const { data: goalData } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_primary", true)
      .eq("status", "active")
      .single();

    if (goalData) setGoal(goalData);

    setIsLoading(false);
  };

  // Get daily value for a metric
  const getDailyValue = (metricId: string, date: string): number | null => {
    const value = scorecard?.data?.history?.[metricId]?.[date];
    return value !== undefined ? value : null;
  };

  // Calculate 7-day aggregated value for a metric
  const getAggregatedValue = (metric: ScorecardMetric): { value: number; daysWithData: number } => {
    const values: number[] = [];
    
    for (const date of last7Days) {
      const val = getDailyValue(metric.id, date);
      if (val !== null) {
        values.push(val);
      }
    }

    if (values.length === 0) {
      return { value: 0, daysWithData: 0 };
    }

    let result: number;
    switch (metric.aggregation) {
      case 'average':
        result = values.reduce((a, b) => a + b, 0) / values.length;
        break;
      case 'sum':
        result = values.reduce((a, b) => a + b, 0);
        break;
      case 'count':
        result = values.filter(v => v > 0).length;
        break;
      default:
        result = values.reduce((a, b) => a + b, 0);
    }

    return { 
      value: Math.round(result * 10) / 10, // Round to 1 decimal
      daysWithData: values.length 
    };
  };

  // Set a daily value for a metric
  const setDailyValue = async (metricId: string, date: string, value: number) => {
    if (!scorecard) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const updatedScorecard = { ...scorecard };
    if (!updatedScorecard.data) {
      updatedScorecard.data = { history: {} };
    }
    if (!updatedScorecard.data.history) {
      updatedScorecard.data.history = {};
    }
    if (!updatedScorecard.data.history[metricId]) {
      updatedScorecard.data.history[metricId] = {};
    }
    
    updatedScorecard.data.history[metricId][date] = value;
    setScorecard(updatedScorecard);

    await supabase
      .from("profiles")
      .update({ scorecard: updatedScorecard })
      .eq("id", user.id);
  };

  // Save metric configuration (update or add new)
  const saveMetricConfig = async (categoryId: string, updatedMetric: ScorecardMetric) => {
    if (!scorecard) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const updatedScorecard = { ...scorecard };
    const category = updatedScorecard.categories.find(c => c.id === categoryId);
    
    if (!category) return;

    const existingIndex = category.metrics.findIndex(m => m.id === updatedMetric.id);
    if (existingIndex >= 0) {
      // Update existing
      category.metrics[existingIndex] = updatedMetric;
    } else {
      // Add new
      category.metrics.push(updatedMetric);
    }
    
    setScorecard(updatedScorecard);

    await supabase
      .from("profiles")
      .update({ scorecard: updatedScorecard })
      .eq("id", user.id);
  };

  // Delete a metric
  const deleteMetric = async (categoryId: string, metricId: string) => {
    if (!scorecard) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const updatedScorecard = { ...scorecard };
    const category = updatedScorecard.categories.find(c => c.id === categoryId);
    
    if (!category) return;

    category.metrics = category.metrics.filter(m => m.id !== metricId);
    
    // Also remove history data for this metric
    if (updatedScorecard.data?.history?.[metricId]) {
      delete updatedScorecard.data.history[metricId];
    }
    
    setScorecard(updatedScorecard);

    await supabase
      .from("profiles")
      .update({ scorecard: updatedScorecard })
      .eq("id", user.id);
  };

  // Handle scorecard updates from Willson
  interface WillsonScorecardUpdate {
    action: 'add' | 'update' | 'remove';
    category: string;
    metricId?: string;
    name: string;
    description: string;
    target: number;
    unit: string;
    direction: 'higher' | 'lower';
    calculation: 'average' | 'sum' | 'count';
  }

  const handleScorecardUpdates = async (updates: WillsonScorecardUpdate[]) => {
    if (!scorecard || updates.length === 0) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const updatedScorecard = { ...scorecard };

    for (const update of updates) {
      // Find or create category
      let category = updatedScorecard.categories.find(
        c => c.id === update.category || c.name.toLowerCase() === update.category.toLowerCase()
      );

      if (!category && update.action === 'add') {
        // Create new category
        category = {
          id: update.category.toLowerCase().replace(/\s+/g, '-'),
          name: update.category.charAt(0).toUpperCase() + update.category.slice(1),
          icon: 'star',
          metrics: [],
        };
        updatedScorecard.categories.push(category);
      }

      if (!category) continue;

      switch (update.action) {
        case 'add': {
          // Check if metric already exists
          const exists = category.metrics.some(m => 
            m.name.toLowerCase() === update.name.toLowerCase()
          );
          if (!exists) {
            const newMetric: ScorecardMetric = {
              id: update.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
              name: update.name,
              description: update.description,
              target: update.target,
              unit: update.unit,
              direction: update.direction,
              aggregation: update.calculation,
            };
            category.metrics.push(newMetric);
          }
          break;
        }
        case 'update': {
          // Find by id or name
          const metricIndex = category.metrics.findIndex(m => 
            m.id === update.metricId || m.name.toLowerCase() === update.name.toLowerCase()
          );
          if (metricIndex >= 0) {
            category.metrics[metricIndex] = {
              ...category.metrics[metricIndex],
              name: update.name,
              description: update.description,
              target: update.target,
              unit: update.unit,
              direction: update.direction,
              aggregation: update.calculation,
            };
          }
          break;
        }
        case 'remove': {
          const metricIndex = category.metrics.findIndex(m => 
            m.id === update.metricId || m.name.toLowerCase() === update.name.toLowerCase()
          );
          if (metricIndex >= 0) {
            const metricId = category.metrics[metricIndex].id;
            category.metrics.splice(metricIndex, 1);
            // Also remove history
            if (updatedScorecard.data?.history?.[metricId]) {
              delete updatedScorecard.data.history[metricId];
            }
          }
          break;
        }
      }
    }

    // Remove empty categories
    updatedScorecard.categories = updatedScorecard.categories.filter(c => c.metrics.length > 0);

    setScorecard(updatedScorecard);

    await supabase
      .from("profiles")
      .update({ scorecard: updatedScorecard })
      .eq("id", user.id);
  };

  // Handle metric value save
  const handleMetricSave = () => {
    if (!editingMetric) return;
    const value = parseFloat(metricInputValue);
    if (!isNaN(value)) {
      setDailyValue(editingMetric.metricId, editingMetric.date, value);
    }
    setEditingMetric(null);
    setMetricInputValue("");
  };

  // Get saved summary for today
  const getTodaySummary = () => {
    return scorecard?.data?.savedSummaries?.[today] || null;
  };

  // Save summary for today
  const saveTodaySummary = async (summary: {
    commentary: { dayHighlight: string; weekInsight: string; encouragement: string; tomorrowTip: string };
    achievement: { id: string; name: string; emoji: string } | null;
    heroQuote: { hero: string; quote: string; context: string };
    stats: { onTrack: number; total: number; percentage: number };
  }) => {
    if (!scorecard) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const updatedScorecard = { ...scorecard };
    if (!updatedScorecard.data) {
      updatedScorecard.data = { history: {} };
    }
    if (!updatedScorecard.data.savedSummaries) {
      updatedScorecard.data.savedSummaries = {};
    }
    
    updatedScorecard.data.savedSummaries[today] = {
      date: today,
      ...summary
    };
    
    setScorecard(updatedScorecard);

    await supabase
      .from("profiles")
      .update({ scorecard: updatedScorecard })
      .eq("id", user.id);
  };

  // Find a metric by ID
  const findMetric = (metricId: string): ScorecardMetric | undefined => {
    for (const category of (scorecard?.categories || [])) {
      const metric = category.metrics.find(m => m.id === metricId);
      if (metric) return metric;
    }
    return undefined;
  };

  // Principles functions
  const addPrinciple = async () => {
    if (!newPrincipleInput.trim()) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newPrinciple: Principle = {
      id: `principle-${Date.now()}`,
      text: newPrincipleInput.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedPrinciples = [...principles, newPrinciple];
    setPrinciples(updatedPrinciples);
    setNewPrincipleInput("");
    setIsAddingPrinciple(false);

    await supabase
      .from("profiles")
      .update({ principles: updatedPrinciples })
      .eq("id", user.id);
  };

  const updatePrinciple = async (id: string, newText: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const updatedPrinciples = principles.map(p =>
      p.id === id ? { ...p, text: newText } : p
    );
    setPrinciples(updatedPrinciples);
    setEditingPrinciple(null);

    await supabase
      .from("profiles")
      .update({ principles: updatedPrinciples })
      .eq("id", user.id);
  };

  const removePrinciple = async (id: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const updatedPrinciples = principles.filter(p => p.id !== id);
    setPrinciples(updatedPrinciples);

    await supabase
      .from("profiles")
      .update({ principles: updatedPrinciples })
      .eq("id", user.id);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const firstName = profile?.full_name?.split(" ")[0] || "Hero";
  const daysOnJourney = goal
    ? Math.floor((Date.now() - new Date(goal.started_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Journey progress
  const hasPurpose = !!profile?.purpose_statement && !!goal;
  const hasPrinciples = principles.length >= 3;
  const hasScorecard = scorecard && scorecard.categories.some(c => c.metrics.length > 0);
  
  const journeySteps = [
    { key: "purpose", label: "Purpose", complete: hasPurpose },
    { key: "principles", label: "Principles", complete: hasPrinciples },
    { key: "scorecard", label: "Scorecard", complete: hasScorecard },
  ];
  const completedSteps = journeySteps.filter(s => s.complete).length;

  // Calculate overall scorecard progress
  const weekProgress = useMemo(() => {
    if (!scorecard) return { onTrack: 0, total: 0, percentage: 0 };
    
    let onTrackCount = 0;
    let totalMetrics = 0;
    
    for (const category of scorecard.categories) {
      for (const metric of category.metrics) {
        totalMetrics++;
        const { value, daysWithData } = getAggregatedValue(metric);
        
        if (daysWithData === 0) continue; // Don't count if no data
        
        const isLowerBetter = metric.direction === 'lower';
        const isOnTrack = isLowerBetter 
          ? value <= metric.target 
          : value >= metric.target;
        
        if (isOnTrack) onTrackCount++;
      }
    }
    
    return {
      onTrack: onTrackCount,
      total: totalMetrics,
      percentage: totalMetrics > 0 ? Math.round((onTrackCount / totalMetrics) * 100) : 0
    };
  }, [scorecard, last7Days]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ember" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-ember flex items-center justify-center">
                <span className="font-serif font-bold text-white">W</span>
              </div>
              <span className="font-serif text-lg font-semibold hidden sm:block">
                Willpowered
              </span>
            </Link>

            <div className="flex items-center gap-3">
              {/* Usage Indicator */}
              <UsageIndicator variant="compact" />
              
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => {
                  setCoachContext(null);
                  setIsChatOpen(true);
                }}
              >
                <Sparkles className="w-4 h-4 mr-2 text-ember" />
                Willson
              </Button>

              <div className="relative group">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-600" />
                  </div>
                </Button>
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-slate-50"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-slate-50 w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-3xl">
        {/* Greeting & Journey Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-serif text-3xl font-bold text-foreground mb-1">
            {dayOfWeek}, {formattedDate}
          </h1>
          <p className="text-muted-foreground mb-4">
            Day {daysOnJourney + 1} of your journey, {firstName}
          </p>

          {/* Journey Steps Progress */}
          <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl">
            {journeySteps.map((step, i) => (
              <div key={step.key} className="flex items-center">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  step.complete 
                    ? "bg-emerald-100 text-emerald-700" 
                    : i === completedSteps
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-500"
                }`}>
                  {step.complete ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="w-4 h-4 flex items-center justify-center text-xs font-medium">
                      {i + 1}
                    </span>
                  )}
                  <span className="text-sm font-medium">{step.label}</span>
                </div>
                {i < journeySteps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-slate-300 mx-1" />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* === STEP 1: PURPOSE === */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-ember-light" />
              <span className="text-sm text-slate-400 uppercase tracking-wide font-medium">
                Step 1 · Purpose
              </span>
              <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full font-medium">
                Your Why
              </span>
            </div>
            {!hasPurpose && (
              <Button
                size="sm"
                variant="outline"
                className="text-white border-white/30 hover:bg-white/10"
                onClick={() => {
                  setCoachContext({
                    message: "Help me discover my purpose. What questions should I be asking myself?",
                    title: "Discover Purpose"
                  });
                  setIsChatOpen(true);
                }}
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Define with Willson
              </Button>
            )}
          </div>

          {goal ? (
            <>
              <div className="flex items-start gap-2 group mb-2">
                <h2 className="font-serif text-2xl font-bold">{goal.title}</h2>
                <button
                  onClick={() => setEditModal({ isOpen: true, type: "goal", value: goal.title })}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white p-1 transition-opacity mt-1"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>

              {goal.why_statement && (
                <div className="flex items-start gap-2 group mb-4">
                  <p className="text-slate-400 italic">&ldquo;{goal.why_statement}&rdquo;</p>
                  <button
                    onClick={() => setEditModal({ isOpen: true, type: "why", value: goal.why_statement || "" })}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-white p-1 transition-opacity flex-shrink-0"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              )}

              {profile?.purpose_statement && (
                <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3 group">
                  <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Compass className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400">My Purpose</p>
                    <p className="text-sm text-white">{profile.purpose_statement}</p>
                  </div>
                  <button
                    onClick={() => setEditModal({ isOpen: true, type: "purpose", value: profile.purpose_statement || "" })}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white p-2 transition-opacity"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-slate-400 mb-3">
                What do you want to achieve? What&apos;s your mission?
              </p>
              <Button
                onClick={() => {
                  setCoachContext({
                    message: "I want to define my purpose and set a meaningful goal. Can you help me think through this?",
                    title: "Define Purpose"
                  });
                  setIsChatOpen(true);
                }}
                className="gradient-ember"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Discover with Willson
              </Button>
            </div>
          )}
        </motion.div>

        {/* === STEP 2: PRINCIPLES === */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-slate-200 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              <span className="text-sm text-muted-foreground uppercase tracking-wide font-medium">
                Step 2 · Principles
              </span>
              <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">
                Your How
              </span>
            </div>
            <div className="flex items-center gap-2">
              {principles.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {principles.length} principle{principles.length !== 1 ? "s" : ""}
                </span>
              )}
              <button
                onClick={() => setIsAddingPrinciple(true)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          <p className="text-muted-foreground text-sm mb-4">
            These are the rules you live by—the standards that guide your decisions when no one&apos;s watching. They turn your purpose into daily behavior.
          </p>

          {principles.length > 0 ? (
            <div className="space-y-3">
              {principles.map((principle, index) => (
                <div
                  key={principle.id}
                  className="p-4 bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-xl border border-slate-100 group hover:border-indigo-200 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingPrinciple === principle.id ? (
                        <input
                          type="text"
                          defaultValue={principle.text}
                          onBlur={(e) => updatePrinciple(principle.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") updatePrinciple(principle.id, e.currentTarget.value);
                            if (e.key === "Escape") setEditingPrinciple(null);
                          }}
                          className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-1.5 outline-none focus:border-indigo-400 font-medium"
                          autoFocus
                        />
                      ) : (
                        <>
                          <p className="font-medium text-foreground">{principle.text}</p>
                          {principle.description && (
                            <p className="text-sm text-muted-foreground mt-1">{principle.description}</p>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingPrinciple(principle.id)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-white"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removePrinciple(principle.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-white"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Refine with Willson button when there are already principles */}
              <button
                onClick={() => {
                  setCoachContext({
                    message: "Help me refine my principles. I want to make sure each one is actionable and connected to my purpose. Here are my current principles and I'd like to add context to them or refine them.",
                    title: "Refine Principles"
                  });
                  setIsChatOpen(true);
                }}
                className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Refine with Willson
              </button>
            </div>
          ) : (
            <div className="text-center py-6 bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-xl border border-dashed border-slate-200">
              <Shield className="w-10 h-10 text-indigo-300 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm mb-4 max-w-sm mx-auto">
                Principles are the &quot;how&quot; behind your purpose. They&apos;re the rules that make hard decisions easier.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setCoachContext({
                    message: "Help me discover my personal principles. Based on my purpose, what rules should guide my decisions? I want principles that are specific and actionable—not generic values, but standards I can actually live by.",
                    title: "Discover Principles"
                  });
                  setIsChatOpen(true);
                }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Discover with Willson
              </Button>
            </div>
          )}

          {/* Add principle input */}
          {isAddingPrinciple && (
            <div className="mt-3 p-3 bg-slate-50 rounded-xl border">
              <input
                type="text"
                value={newPrincipleInput}
                onChange={(e) => setNewPrincipleInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPrinciple()}
                placeholder="e.g., Consistency conquers intensity"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400 mb-2"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setIsAddingPrinciple(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={addPrinciple} disabled={!newPrincipleInput.trim()}>
                  Add Principle
                </Button>
              </div>
            </div>
          )}
        </motion.div>

        {/* === STEP 3: SCORECARD === */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-slate-200 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <span className="text-sm text-muted-foreground uppercase tracking-wide font-medium">
                Step 3 · Scorecard
              </span>
              <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                Your What
              </span>
            </div>
            {weekProgress.total > 0 && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Last 7 days</span>
                <span className={`text-sm font-medium ml-2 ${
                  weekProgress.percentage >= 70 ? "text-emerald-600" : 
                  weekProgress.percentage >= 40 ? "text-amber-600" : "text-red-600"
                }`}>
                  {weekProgress.onTrack}/{weekProgress.total} on track
                </span>
              </div>
            )}
          </div>

          {/* Empty Scorecard State */}
          {(!scorecard?.categories || scorecard.categories.length === 0 || 
            !scorecard.categories.some(c => c.metrics.length > 0)) && (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <BarChart3 className="w-8 h-8 text-slate-400" />
              </div>
              <h4 className="font-semibold text-lg text-foreground mb-2">
                Your Scorecard is Empty
              </h4>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Your scorecard tracks the metrics that matter most to you. Work with Willson to discover which activities—if done consistently—would make the biggest difference in your life.
              </p>
              <Button
                onClick={() => {
                  setCoachContext({
                    message: "I'd like to create my personal scorecard. Can you help me identify the key metrics I should track based on my purpose and principles?",
                    title: "Create Scorecard"
                  });
                  setIsChatOpen(true);
                }}
                className="gradient-ember text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Create with Willson
              </Button>
            </div>
          )}

          {/* Daily Check-in CTA - only show if there are metrics */}
          {scorecard?.categories && scorecard.categories.some(c => c.metrics.length > 0) && (() => {
            const total = scorecard?.categories.reduce((acc, c) => acc + c.metrics.length, 0) || 0;
            const logged = scorecard?.categories.reduce((acc, c) => 
              acc + c.metrics.filter(m => getDailyValue(m.id, today) !== null).length, 0) || 0;
            const allLogged = logged === total && total > 0;
            const someLogged = logged > 0 && logged < total;
            
            let buttonText = "Start Check-in";
            if (allLogged) buttonText = "View Summary";
            else if (someLogged) buttonText = "Continue Check-in";
            
            return (
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-4 mb-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Daily Check-in</h4>
                      <p className="text-sm text-white/80">
                        {allLogged 
                          ? "✓ All logged for today!" 
                          : `${logged}/${total} metrics logged today`}
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setIsCheckinOpen(true)}
                    className="bg-white text-emerald-600 hover:bg-white/90"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {buttonText}
                  </Button>
                </div>
              </div>
            );
          })()}

          {/* Categories - only show if there are metrics */}
          {scorecard?.categories && scorecard.categories.some(c => c.metrics.length > 0) && (
            <>
              <p className="text-muted-foreground text-sm mb-4">
                Click any metric below to log individual values.
              </p>
              <div className="space-y-6">
            {scorecard?.categories.filter(c => c.metrics.length > 0).map((category) => (
              <div key={category.id}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-foreground">{category.name}</h4>
                  <button
                    onClick={() => setMetricEditModal({
                      isOpen: true,
                      metric: null,
                      categoryId: category.id,
                      isNew: true
                    })}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {category.metrics.map((metric) => {
                    const { value: aggregatedValue, daysWithData } = getAggregatedValue(metric);
                    const todayValue = getDailyValue(metric.id, today);
                    const isLowerBetter = metric.direction === 'lower';
                    
                    const isOnTrack = daysWithData > 0 && (isLowerBetter 
                      ? aggregatedValue <= metric.target 
                      : aggregatedValue >= metric.target);
                    
                    // Progress bar calculation
                    let progress: number;
                    if (daysWithData === 0) {
                      progress = 0;
                    } else if (isLowerBetter) {
                      // For "lower is better": full bar when at 0, empty when at 2x target
                      progress = Math.max(0, Math.min(100, 100 - (aggregatedValue / (metric.target * 2)) * 100));
                    } else {
                      progress = Math.min((aggregatedValue / metric.target) * 100, 100);
                    }

                    const isEditing = editingMetric?.metricId === metric.id;

                    // Display format based on aggregation
                    const displayLabel = metric.aggregation === 'average' 
                      ? 'avg' 
                      : metric.aggregation === 'sum' 
                        ? 'total' 
                        : 'days';
                    
                    const targetLabel = isLowerBetter ? '≤' : '≥';

                    return (
                      <div
                        key={metric.id}
                        className={`p-3 rounded-xl border transition-colors group ${
                          daysWithData === 0
                            ? "bg-slate-50 border-slate-200"
                            : isOnTrack 
                              ? "bg-emerald-50 border-emerald-200" 
                              : "bg-red-50 border-red-200"
                        }`}
                      >
                        {/* Header row */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setMetricEditModal({
                                  isOpen: true,
                                  metric,
                                  categoryId: category.id,
                                  isNew: false
                                })}
                                className="text-sm font-medium hover:text-emerald-600 hover:underline text-left"
                              >
                                {metric.name}
                              </button>
                              {isLowerBetter ? (
                                <TrendingDown className="w-3 h-3 text-blue-500" />
                              ) : (
                                <TrendingUp className="w-3 h-3 text-emerald-500" />
                              )}
                              <button
                                onClick={() => setMetricEditModal({
                                  isOpen: true,
                                  metric,
                                  categoryId: category.id,
                                  isNew: false
                                })}
                                className="p-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 rounded transition-opacity"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            </div>
                            {metric.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{metric.description}</p>
                            )}
                          </div>
                          
                          {/* Score display */}
                          <div className="text-right">
                            <div className={`text-lg font-semibold ${
                              daysWithData === 0 ? "text-slate-300" :
                              isOnTrack ? "text-emerald-600" : "text-red-600"
                            }`}>
                              {daysWithData > 0 ? aggregatedValue : "—"}
                              {daysWithData > 0 && (
                                <span className="text-xs font-normal text-muted-foreground ml-1">
                                  {displayLabel}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              target: {targetLabel}{metric.target} {metric.unit}
                            </div>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-3">
                          <div
                            className={`h-full rounded-full transition-all ${
                              daysWithData === 0 ? "bg-slate-300" :
                              isOnTrack ? "bg-emerald-500" : "bg-red-400"
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        {/* Today's entry */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {daysWithData}/7 days logged
                          </span>
                          
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={metricInputValue}
                                onChange={(e) => setMetricInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleMetricSave();
                                  if (e.key === "Escape") setEditingMetric(null);
                                }}
                                placeholder="Enter value"
                                className="w-20 px-2 py-1 text-sm border border-slate-300 rounded outline-none focus:border-emerald-400"
                                autoFocus
                              />
                              <button
                                onClick={handleMetricSave}
                                className="p-1 text-emerald-600 hover:bg-emerald-100 rounded"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingMetric(null)}
                                className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingMetric({
                                  metricId: metric.id,
                                  date: today,
                                  currentValue: todayValue
                                });
                                setMetricInputValue(todayValue !== null ? String(todayValue) : "");
                              }}
                              className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                                todayValue !== null
                                  ? "bg-emerald-100 border-emerald-200 text-emerald-700"
                                  : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50"
                              }`}
                            >
                              {todayValue !== null ? `Today: ${todayValue}` : "+ Log Today"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {category.metrics.length === 0 && (
                    <div className="text-center py-4 text-sm text-muted-foreground bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No metrics yet. Click &quot;Add&quot; to create one.
                    </div>
                  )}
                </div>
              </div>
            ))}
              </div>
            </>
          )}

          {/* Customize Scorecard CTA - only show if there are metrics */}
          {scorecard?.categories && scorecard.categories.some(c => c.metrics.length > 0) && (
          <div className="mt-6 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                setCoachContext({
                  message: "Help me customize my scorecard. Based on my purpose and principles, what metrics should I be tracking weekly to stay on course?",
                  title: "Customize Scorecard"
                });
                setIsChatOpen(true);
              }}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Customize with Willson
            </Button>
          </div>
          )}
        </motion.div>

        {/* === WILLSON CTA === */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-ember/10 to-amber-50 border border-ember/20 rounded-2xl p-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-ember flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">
                Need guidance?
              </h3>
              <p className="text-muted-foreground text-sm">
                Willson can help you think through tough decisions, push through setbacks, or refine your approach.
              </p>
            </div>
            <Button
              className="gradient-ember text-white flex-shrink-0"
              onClick={() => {
                setCoachContext(null);
                setIsChatOpen(true);
              }}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat
            </Button>
          </div>
        </motion.div>
      </main>

      <ChatModal
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setCoachContext(null);
        }}
        initialMessage={coachContext?.message}
        conversationTitle={coachContext?.title}
        startFresh={!!coachContext}
        onScorecardUpdates={handleScorecardUpdates}
      />

      <EditModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ ...editModal, isOpen: false })}
        onSave={fetchData}
        type={editModal.type}
        currentValue={editModal.value}
        goalId={goal?.id}
      />

      <MetricEditModal
        isOpen={metricEditModal.isOpen}
        onClose={() => setMetricEditModal({ ...metricEditModal, isOpen: false })}
        metric={metricEditModal.metric}
        isNew={metricEditModal.isNew}
        onSave={(updatedMetric) => saveMetricConfig(metricEditModal.categoryId, updatedMetric)}
        onDelete={(metricId) => deleteMetric(metricEditModal.categoryId, metricId)}
      />

      <DailyCheckinModal
        isOpen={isCheckinOpen}
        onClose={() => setIsCheckinOpen(false)}
        scorecard={scorecard}
        onLogValue={(metricId, value) => setDailyValue(metricId, today, value)}
        getTodayValue={(metricId) => getDailyValue(metricId, today)}
        getWeekAverage={getAggregatedValue}
        savedSummary={getTodaySummary()}
        onSaveSummary={saveTodaySummary}
      />
    </div>
  );
}
