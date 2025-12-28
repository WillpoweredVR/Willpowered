"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Sparkles, 
  Check, 
  TrendingUp, 
  TrendingDown,
  SkipForward,
  Quote,
  Lightbulb,
  Calendar,
  Target,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Scorecard, ScorecardMetric, ScorecardCategory } from "@/lib/supabase/types";

interface WillsonCommentary {
  dayHighlight: string;
  weekInsight: string;
  encouragement: string;
  tomorrowTip: string;
}

interface Achievement {
  id: string;
  name: string;
  emoji: string;
}

interface HeroQuote {
  hero: string;
  quote: string;
  context: string;
}

interface SummaryData {
  commentary: WillsonCommentary;
  achievement: Achievement | null;
  heroQuote: HeroQuote;
  stats: { onTrack: number; total: number; percentage: number };
}

interface DailyCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  scorecard: Scorecard | null;
  onLogValue: (metricId: string, value: number) => void;
  getTodayValue: (metricId: string) => number | null;
  getWeekAverage: (metric: ScorecardMetric) => { value: number; daysWithData: number };
  savedSummary: SummaryData | null;
  onSaveSummary: (summary: SummaryData) => void;
}

// Willson's encouraging prompts for different categories
const WILLSON_PROMPTS: Record<string, string[]> = {
  health: [
    "Let's check in on your body today! 💪",
    "How's your health tracking? Your body will thank you! 🌟",
    "Quick health check - you've got this! 💚",
  ],
  productivity: [
    "Time to celebrate your wins! What did you accomplish? 🎯",
    "Let's see how productive you were today! 🚀",
    "Ready to log your progress? Every step counts! ⭐",
  ],
  growth: [
    "Learning something new? Let's track your growth! 📚",
    "Personal development time! What did you learn today? 🌱",
    "Growth happens daily - let's capture it! ✨",
  ],
  distractions: [
    "How well did you stay focused today? Be honest! 🎯",
    "Let's check those distractions - awareness is power! 💪",
    "Staying disciplined? Let's see how you did! 🔒",
  ],
  default: [
    "Let's log this one! You're doing great! 🌟",
    "Quick check-in time! 📝",
    "How did today go? Let's capture it! ✨",
  ],
};

// Quick-select presets for different metric types
const getQuickPresets = (metric: ScorecardMetric): number[] => {
  const { target, direction, aggregation } = metric;
  
  if (aggregation === 'count') {
    return [0, 1]; // Did it or didn't
  }
  
  if (metric.name.toLowerCase().includes('pain')) {
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  }
  
  if (metric.name.toLowerCase().includes('sleep') || metric.name.toLowerCase().includes('quality')) {
    return [60, 70, 75, 80, 85, 90, 95, 100];
  }
  
  if (metric.name.toLowerCase().includes('check')) {
    return [0, 1, 2, 3, 4, 5, 10];
  }
  
  if (metric.name.toLowerCase().includes('hour') || metric.name.toLowerCase().includes('deep work')) {
    return [0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6];
  }
  
  // Default based on target
  if (direction === 'lower') {
    return [0, Math.round(target * 0.5), target, Math.round(target * 1.5), target * 2];
  }
  
  return [0, Math.round(target * 0.25), Math.round(target * 0.5), Math.round(target * 0.75), target];
};

// Celebration messages based on performance
const getCelebration = (onTrackCount: number, totalCount: number): { emoji: string; message: string } => {
  const percentage = totalCount > 0 ? (onTrackCount / totalCount) * 100 : 0;
  
  if (percentage >= 90) {
    return { emoji: "🏆", message: "Incredible! You're crushing it today!" };
  } else if (percentage >= 70) {
    return { emoji: "🔥", message: "Great day! You're on fire!" };
  } else if (percentage >= 50) {
    return { emoji: "💪", message: "Solid progress! Keep building momentum!" };
  } else if (percentage >= 30) {
    return { emoji: "🌱", message: "Every day is a chance to grow. Tomorrow's a new opportunity!" };
  } else {
    return { emoji: "💙", message: "Tough day? That's okay. Showing up to track is already a win!" };
  }
};

export function DailyCheckinModal({
  isOpen,
  onClose,
  scorecard,
  onLogValue,
  getTodayValue,
  getWeekAverage,
  savedSummary,
  onSaveSummary,
}: DailyCheckinModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [loggedMetrics, setLoggedMetrics] = useState<Set<string>>(new Set());
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // Flatten all metrics into a checklist
  const allMetrics = useMemo(() => {
    if (!scorecard) return [];
    
    const metrics: { metric: ScorecardMetric; category: ScorecardCategory }[] = [];
    for (const category of scorecard.categories) {
      for (const metric of category.metrics) {
        metrics.push({ metric, category });
      }
    }
    return metrics;
  }, [scorecard]);

  // Count already logged today
  const alreadyLoggedCount = useMemo(() => {
    return allMetrics.filter(({ metric }) => getTodayValue(metric.id) !== null).length;
  }, [allMetrics, getTodayValue]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Check if all metrics are already logged
      const unloggedMetrics = allMetrics.filter(
        ({ metric }) => getTodayValue(metric.id) === null
      );
      
      if (unloggedMetrics.length === 0 && allMetrics.length > 0) {
        // All already logged - go straight to summary
        setCurrentStep(0);
        setShowSummary(true);
        // Use saved summary if available
        if (savedSummary) {
          setSummaryData(savedSummary);
        }
      } else {
        // Find first unlogged metric
        const firstUnloggedIndex = allMetrics.findIndex(
          ({ metric }) => getTodayValue(metric.id) === null
        );
        setCurrentStep(firstUnloggedIndex >= 0 ? firstUnloggedIndex : 0);
        setShowSummary(false);
        setSummaryData(null);
      }
      
      setInputValue("");
      setLoggedMetrics(new Set());
      setIsLoadingSummary(false);
    }
  }, [isOpen, allMetrics, getTodayValue, savedSummary]);

  // Fetch personalized summary from Willson
  const fetchSummary = async () => {
    // If we already have a saved summary for today, use it
    if (savedSummary) {
      setSummaryData(savedSummary);
      return;
    }
    
    setIsLoadingSummary(true);
    
    try {
      const metricsData = allMetrics.map(({ metric, category }) => {
        const todayValue = getTodayValue(metric.id);
        const weekData = getWeekAverage(metric);
        const isLowerBetter = metric.direction === 'lower';
        const isOnTrack = todayValue !== null && (isLowerBetter 
          ? todayValue <= metric.target 
          : todayValue >= metric.target);

        return {
          name: metric.name,
          todayValue: todayValue ?? 0,
          weekAverage: weekData.value,
          target: metric.target,
          direction: metric.direction,
          isOnTrack,
          aggregation: metric.aggregation,
          category: category.name,
        };
      });

      const onTrackCount = metricsData.filter(m => m.isOnTrack).length;
      const totalCount = metricsData.filter(m => m.todayValue !== null || m.todayValue === 0).length;

      const response = await fetch('/api/checkin-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: metricsData,
          onTrackCount,
          totalCount,
        }),
      });

      const data = await response.json();
      setSummaryData(data);
      
      // Save the summary for today so we don't regenerate
      onSaveSummary(data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
      // Set fallback data
      const fallbackData: SummaryData = {
        commentary: {
          dayHighlight: "You showed up and tracked today - that's what matters!",
          weekInsight: "Consistency builds momentum. Keep going.",
          encouragement: "The fact that you're tracking means you're committed to growth.",
          tomorrowTip: "Pick one metric to focus on improving tomorrow."
        },
        achievement: null,
        heroQuote: { hero: "Kobe Bryant", quote: "The moment you give up is the moment you let someone else win.", context: "pushing through" },
        stats: { onTrack: 0, total: 0, percentage: 0 }
      };
      setSummaryData(fallbackData);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // Trigger summary fetch when showing summary
  useEffect(() => {
    if (showSummary && !summaryData && !isLoadingSummary) {
      fetchSummary();
    }
  }, [showSummary, savedSummary]);

  const currentItem = allMetrics[currentStep];
  const isLastStep = currentStep >= allMetrics.length - 1;
  const totalSteps = allMetrics.length;

  // Get Willson's prompt for current category
  const willsonPrompt = useMemo(() => {
    if (!currentItem) return "";
    const prompts = WILLSON_PROMPTS[currentItem.category.id] || WILLSON_PROMPTS.default;
    return prompts[Math.floor(Math.random() * prompts.length)];
  }, [currentItem?.category.id, currentStep]);

  const handleLogValue = (value: number) => {
    if (!currentItem) return;
    
    onLogValue(currentItem.metric.id, value);
    setLoggedMetrics(prev => new Set(prev).add(currentItem.metric.id));
    setInputValue("");
    
    if (isLastStep) {
      setShowSummary(true);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    if (isLastStep) {
      setShowSummary(true);
    } else {
      setCurrentStep(prev => prev + 1);
    }
    setInputValue("");
  };

  const handleCustomSubmit = () => {
    const value = parseFloat(inputValue);
    if (!isNaN(value)) {
      handleLogValue(value);
    }
  };

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    let onTrack = 0;
    let total = 0;
    
    for (const { metric } of allMetrics) {
      const todayVal = getTodayValue(metric.id);
      if (todayVal === null) continue;
      
      total++;
      const isLowerBetter = metric.direction === 'lower';
      const isOnTrack = isLowerBetter 
        ? todayVal <= metric.target 
        : todayVal >= metric.target;
      
      if (isOnTrack) onTrack++;
    }
    
    return { onTrack, total, ...getCelebration(onTrack, total) };
  }, [allMetrics, getTodayValue]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Fixed */}
          <div className="relative bg-gradient-to-r from-emerald-500 to-teal-500 p-4 text-white flex-shrink-0">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold">Daily Check-in with Willson</h2>
                <p className="text-sm text-white/80">
                  {showSummary 
                    ? "Here's your summary!" 
                    : `${currentStep + 1} of ${totalSteps} metrics`
                  }
                </p>
              </div>
            </div>
            
            {/* Progress bar */}
            {!showSummary && (
              <div className="mt-4 h-1.5 bg-white/30 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}
          </div>

          {/* Content - Scrollable */}
          <div className="p-6 overflow-y-auto flex-1">
            {showSummary ? (
              // Rich Summary View - Variable Reward!
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {isLoadingSummary || !summaryData ? (
                  // Loading state
                  <div className="text-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-12 h-12 mx-auto mb-4"
                    >
                      <Loader2 className="w-12 h-12 text-emerald-500" />
                    </motion.div>
                    <p className="text-muted-foreground">Willson is analyzing your day...</p>
                  </div>
                ) : (
                  <>
                    {/* Achievement Badge (if earned) */}
                    {summaryData.achievement && (
                      <motion.div
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                        className="text-center mb-6"
                      >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-200 rounded-full">
                          <span className="text-2xl">{summaryData.achievement.emoji}</span>
                          <span className="font-semibold text-amber-800">{summaryData.achievement.name}</span>
                        </div>
                      </motion.div>
                    )}

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-emerald-50 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-emerald-600">{summaryData.stats.onTrack}</div>
                        <div className="text-sm text-emerald-700">On Track</div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-slate-600">{summaryData.stats.total - summaryData.stats.onTrack}</div>
                        <div className="text-sm text-slate-600">Needs Work</div>
                      </div>
                    </div>

                    {/* Willson's Commentary */}
                    <div className="space-y-4 mb-6">
                      {/* Day Highlight */}
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="flex-1 bg-emerald-50 rounded-2xl rounded-tl-none p-3">
                          <p className="text-sm font-medium text-emerald-800">{summaryData.commentary.dayHighlight}</p>
                        </div>
                      </motion.div>

                      {/* Week Insight */}
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 bg-blue-50 rounded-2xl rounded-tl-none p-3">
                          <p className="text-sm text-blue-800">{summaryData.commentary.weekInsight}</p>
                        </div>
                      </motion.div>

                      {/* Encouragement */}
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg gradient-ember flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl rounded-tl-none p-3">
                          <p className="text-sm font-medium text-amber-900">{summaryData.commentary.encouragement}</p>
                        </div>
                      </motion.div>

                      {/* Tomorrow Tip */}
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Target className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1 bg-purple-50 rounded-2xl rounded-tl-none p-3">
                          <p className="text-xs text-purple-600 font-medium mb-1">Tomorrow&apos;s Focus</p>
                          <p className="text-sm text-purple-800">{summaryData.commentary.tomorrowTip}</p>
                        </div>
                      </motion.div>
                    </div>

                    {/* Hero Quote (Variable Reward) */}
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="bg-slate-900 text-white rounded-xl p-4 mb-6"
                    >
                      <div className="flex items-start gap-3">
                        <Quote className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-sm italic mb-2">&ldquo;{summaryData.heroQuote.quote}&rdquo;</p>
                          <p className="text-xs text-slate-400">— {summaryData.heroQuote.hero}</p>
                        </div>
                      </div>
                    </motion.div>

                    <Button onClick={onClose} className="w-full gradient-ember" size="lg">
                      <Check className="w-4 h-4 mr-2" />
                      Done for Today!
                    </Button>
                  </>
                )}
              </motion.div>
            ) : currentItem ? (
              // Metric input view
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {/* Willson's prompt */}
                <div className="flex items-start gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg gradient-ember flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-slate-100 rounded-2xl rounded-tl-none p-3 text-sm">
                    {willsonPrompt}
                  </div>
                </div>

                {/* Category & Metric */}
                <div className="mb-4">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">
                    {currentItem.category.name}
                  </span>
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    {currentItem.metric.name}
                    {currentItem.metric.direction === 'lower' ? (
                      <TrendingDown className="w-4 h-4 text-blue-500" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    )}
                  </h3>
                  {currentItem.metric.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentItem.metric.description}
                    </p>
                  )}
                </div>

                {/* Already logged indicator */}
                {getTodayValue(currentItem.metric.id) !== null && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm text-emerald-700">Already logged today:</span>
                    </div>
                    <span className="font-semibold text-emerald-700">
                      {getTodayValue(currentItem.metric.id)}
                    </span>
                  </div>
                )}

                {/* Target reminder */}
                <div className="bg-slate-50 rounded-lg p-3 mb-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Your target:</span>
                  <span className="font-medium">
                    {currentItem.metric.aggregation === 'count' 
                      ? `${currentItem.metric.target} days per week`
                      : `${currentItem.metric.direction === 'lower' ? '≤' : '≥'} ${currentItem.metric.target} ${currentItem.metric.unit}`
                    }
                  </span>
                </div>

                {/* Week's progress */}
                {(() => {
                  const weekData = getWeekAverage(currentItem.metric);
                  if (weekData.daysWithData > 0) {
                    return (
                      <div className="text-sm text-muted-foreground mb-4">
                        This week so far: <span className="font-medium">{weekData.value}</span> ({weekData.daysWithData} days)
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Input based on aggregation type */}
                {currentItem.metric.aggregation === 'count' ? (
                  // Yes/No for "Days Done" metrics
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-3">Did you do this today?</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleLogValue(1)}
                        className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-colors"
                      >
                        <Check className="w-5 h-5" />
                        <span className="font-semibold text-lg">Yes!</span>
                      </button>
                      <button
                        onClick={() => handleLogValue(0)}
                        className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-colors"
                      >
                        <X className="w-5 h-5" />
                        <span className="font-semibold text-lg">No</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  // Quick select for other metrics
                  <>
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">Quick select:</p>
                      <div className="flex flex-wrap gap-2">
                        {getQuickPresets(currentItem.metric).map((preset) => {
                          const isTarget = preset === currentItem.metric.target;
                          return (
                            <button
                              key={preset}
                              onClick={() => handleLogValue(preset)}
                              className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                                isTarget
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 ring-2 ring-emerald-300"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              }`}
                            >
                              {preset}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom input */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-sm text-muted-foreground">Or enter:</span>
                      <input
                        type="number"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
                        placeholder="Custom value"
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-emerald-400"
                      />
                      <Button 
                        onClick={handleCustomSubmit}
                        disabled={!inputValue || isNaN(parseFloat(inputValue))}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-3">
                    {currentStep > 0 && (
                      <button
                        onClick={() => setCurrentStep(prev => prev - 1)}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        ← Back
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSkip}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <SkipForward className="w-4 h-4" />
                      {getTodayValue(currentItem.metric.id) !== null ? "Keep & Next" : "Skip"}
                    </button>
                    
                    {/* Quick jump to summary if most are logged */}
                    {alreadyLoggedCount >= allMetrics.length * 0.5 && (
                      <button
                        onClick={() => setShowSummary(true)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        View Summary →
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No metrics to track!</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

