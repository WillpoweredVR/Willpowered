"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Shield,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type {
  Principle,
  PrincipleReflectionEntry,
  PrincipleResponse,
  WeeklyPrincipleReview,
  PrincipleStrength,
} from "@/lib/supabase/types";

interface WeeklyPrinciplesReviewProps {
  isOpen: boolean;
  onClose: () => void;
  principles: Principle[];
  existingReviews: WeeklyPrincipleReview[];
  onReviewComplete: (review: WeeklyPrincipleReview) => void;
}

// Get the Monday of the current week
function getCurrentWeekMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split("T")[0];
}

// Calculate principle strength from reviews
function calculatePrincipleStrength(
  principleId: string,
  reviews: WeeklyPrincipleReview[]
): PrincipleStrength {
  let timesTested = 0;
  let timesHeld = 0;
  let timesStruggled = 0;
  let timesBroke = 0;

  // Look at last 8 weeks of reviews
  const recentReviews = reviews.slice(-8);

  recentReviews.forEach((review) => {
    const entry = review.entries.find((e) => e.principleId === principleId);
    if (entry?.wasTested && entry.response) {
      timesTested++;
      if (entry.response === "held") timesHeld++;
      else if (entry.response === "struggled") timesStruggled++;
      else if (entry.response === "broke") timesBroke++;
    }
  });

  // Strength score: held = 1, struggled = 0.5, broke = 0
  const strengthScore =
    timesTested > 0
      ? Math.round(((timesHeld + timesStruggled * 0.5) / timesTested) * 100)
      : -1; // -1 = not enough data

  // Trend: compare last 4 weeks to previous 4 weeks
  let trend: "improving" | "stable" | "declining" = "stable";
  if (recentReviews.length >= 4) {
    const recent4 = recentReviews.slice(-4);
    const prev4 = recentReviews.slice(-8, -4);

    const recentScore = calculateScoreForPeriod(principleId, recent4);
    const prevScore = calculateScoreForPeriod(principleId, prev4);

    if (recentScore > prevScore + 10) trend = "improving";
    else if (recentScore < prevScore - 10) trend = "declining";
  }

  return {
    principleId,
    timesTested,
    timesHeld,
    timesStruggled,
    timesBroke,
    strengthScore,
    trend,
  };
}

function calculateScoreForPeriod(
  principleId: string,
  reviews: WeeklyPrincipleReview[]
): number {
  let tested = 0;
  let score = 0;

  reviews.forEach((review) => {
    const entry = review.entries.find((e) => e.principleId === principleId);
    if (entry?.wasTested && entry.response) {
      tested++;
      if (entry.response === "held") score += 1;
      else if (entry.response === "struggled") score += 0.5;
    }
  });

  return tested > 0 ? (score / tested) * 100 : 0;
}

export function WeeklyPrinciplesReview({
  isOpen,
  onClose,
  principles,
  existingReviews,
  onReviewComplete,
}: WeeklyPrinciplesReviewProps) {
  const [currentStep, setCurrentStep] = useState(0); // 0 = intro, 1-N = principles, N+1 = summary
  const [entries, setEntries] = useState<PrincipleReflectionEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [willsonInsight, setWillsonInsight] = useState<string>("");

  const totalSteps = principles.length + 2; // intro + principles + summary
  const currentPrinciple =
    currentStep > 0 && currentStep <= principles.length
      ? principles[currentStep - 1]
      : null;
  const currentEntry = currentPrinciple
    ? entries.find((e) => e.principleId === currentPrinciple.id)
    : null;

  // Initialize entries when modal opens
  useEffect(() => {
    if (isOpen && principles.length > 0) {
      setEntries(
        principles.map((p) => ({
          principleId: p.id,
          wasTested: false,
        }))
      );
      setCurrentStep(0);
      setWillsonInsight("");
    }
  }, [isOpen, principles]);

  const updateEntry = (update: Partial<PrincipleReflectionEntry>) => {
    if (!currentPrinciple) return;
    setEntries((prev) =>
      prev.map((e) =>
        e.principleId === currentPrinciple.id ? { ...e, ...update } : e
      )
    );
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsSubmitting(false);
      return;
    }

    // Create the review
    const review: WeeklyPrincipleReview = {
      id: `review-${Date.now()}`,
      weekOf: getCurrentWeekMonday(),
      entries,
      willsonInsight: willsonInsight || undefined,
      createdAt: new Date().toISOString(),
    };

    // Save to database
    const { data: profile } = await supabase
      .from("profiles")
      .select("principle_reviews")
      .eq("id", user.id)
      .single();

    const existingData = (profile?.principle_reviews as WeeklyPrincipleReview[]) || [];
    const updatedReviews = [...existingData, review];

    await supabase
      .from("profiles")
      .update({ principle_reviews: updatedReviews })
      .eq("id", user.id);

    setIsSubmitting(false);
    onReviewComplete(review);
    onClose();
  };

  // Generate Willson insight when reaching summary
  useEffect(() => {
    if (currentStep === totalSteps - 1 && !willsonInsight) {
      generateInsight();
    }
  }, [currentStep]);

  const generateInsight = async () => {
    // Count responses
    const tested = entries.filter((e) => e.wasTested).length;
    const held = entries.filter((e) => e.response === "held").length;
    const struggled = entries.filter((e) => e.response === "struggled").length;
    const broke = entries.filter((e) => e.response === "broke").length;

    if (tested === 0) {
      setWillsonInsight(
        "A quiet week for principles testing. That's okay. Sometimes growth happens in subtle ways. Stay aware of moments where your principles might be challenged."
      );
      return;
    }

    // Simple insight based on responses
    if (held === tested) {
      setWillsonInsight(
        "Incredible week! You held strong on every principle that was tested. This is the compound effect in action. Each time you hold, the next time gets easier."
      );
    } else if (broke === 0 && struggled > 0) {
      setWillsonInsight(
        `You faced ${tested} tests this week and didn't break on any. Even the struggles are wins, because you stayed aware and fought for your principles. That's real growth.`
      );
    } else if (broke > 0) {
      const brokeEntries = entries.filter((e) => e.response === "broke");
      const brokenPrinciple = principles.find(
        (p) => p.id === brokeEntries[0]?.principleId
      );
      setWillsonInsight(
        `Setbacks are data, not defeat. ${brokenPrinciple ? `"${brokenPrinciple.text}"` : "Your principle"} got tested and you learned something. What matters now is what you do with that knowledge.`
      );
    }
  };

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
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">
                  Weekly Principles Review
                </h2>
                <p className="text-xs text-muted-foreground">
                  Step {currentStep + 1} of {totalSteps}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-slate-100">
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {/* Intro Step */}
              {currentStep === 0 && (
                <motion.div
                  key="intro"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-6">
                    <Shield className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-foreground mb-4">
                    How did you live your principles this week?
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    This takes about 5 minutes. For each principle, we&apos;ll
                    explore if it was tested and how you responded.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You have{" "}
                    <span className="font-medium text-indigo-600">
                      {principles.length} principles
                    </span>{" "}
                    to review
                  </p>
                </motion.div>
              )}

              {/* Principle Steps */}
              {currentPrinciple && (
                <motion.div
                  key={currentPrinciple.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Principle */}
                  <div className="p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl border border-indigo-100">
                    <p className="text-xs text-indigo-600 font-medium uppercase tracking-wide mb-2">
                      Principle {currentStep} of {principles.length}
                    </p>
                    <p className="font-semibold text-lg text-foreground">
                      {currentPrinciple.text}
                    </p>
                    {currentPrinciple.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {currentPrinciple.description}
                      </p>
                    )}
                  </div>

                  {/* Was it tested? */}
                  <div>
                    <p className="font-medium text-foreground mb-3">
                      Was this principle tested this week?
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() =>
                          updateEntry({ wasTested: true })
                        }
                        className={`p-4 rounded-xl border-2 transition-all ${
                          currentEntry?.wasTested === true
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <Zap className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                        <span className="font-medium">Yes, I faced a test</span>
                      </button>
                      <button
                        onClick={() =>
                          updateEntry({
                            wasTested: false,
                            situation: undefined,
                            response: undefined,
                            learning: undefined,
                          })
                        }
                        className={`p-4 rounded-xl border-2 transition-all ${
                          currentEntry?.wasTested === false
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <Check className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
                        <span className="font-medium">Not this week</span>
                      </button>
                    </div>
                  </div>

                  {/* If tested, show follow-up questions */}
                  {currentEntry?.wasTested && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-5"
                    >
                      {/* What happened */}
                      <div>
                        <label className="block font-medium text-foreground mb-2">
                          What happened?
                        </label>
                        <textarea
                          value={currentEntry.situation || ""}
                          onChange={(e) =>
                            updateEntry({ situation: e.target.value })
                          }
                          placeholder="Briefly describe the situation..."
                          className="w-full p-3 border border-slate-200 rounded-xl resize-none outline-none focus:border-indigo-400 transition-colors"
                          rows={2}
                        />
                      </div>

                      {/* How did you respond */}
                      <div>
                        <label className="block font-medium text-foreground mb-3">
                          How did you respond?
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            {
                              value: "held" as PrincipleResponse,
                              label: "Held strong",
                              icon: "💪",
                              color: "emerald",
                            },
                            {
                              value: "struggled" as PrincipleResponse,
                              label: "Struggled but held",
                              icon: "😓",
                              color: "amber",
                            },
                            {
                              value: "broke" as PrincipleResponse,
                              label: "Broke it",
                              icon: "💔",
                              color: "red",
                            },
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() =>
                                updateEntry({ response: option.value })
                              }
                              className={`p-3 rounded-xl border-2 transition-all text-center ${
                                currentEntry.response === option.value
                                  ? option.color === "emerald"
                                    ? "border-emerald-500 bg-emerald-50"
                                    : option.color === "amber"
                                    ? "border-amber-500 bg-amber-50"
                                    : "border-red-500 bg-red-50"
                                  : "border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <span className="text-2xl block mb-1">
                                {option.icon}
                              </span>
                              <span className="text-xs font-medium">
                                {option.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* What did you learn */}
                      <div>
                        <label className="block font-medium text-foreground mb-2">
                          What did you learn?{" "}
                          <span className="text-muted-foreground font-normal">
                            (optional)
                          </span>
                        </label>
                        <textarea
                          value={currentEntry.learning || ""}
                          onChange={(e) =>
                            updateEntry({ learning: e.target.value })
                          }
                          placeholder="Any insights or takeaways..."
                          className="w-full p-3 border border-slate-200 rounded-xl resize-none outline-none focus:border-indigo-400 transition-colors"
                          rows={2}
                        />
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Summary Step */}
              {currentStep === totalSteps - 1 && (
                <motion.div
                  key="summary"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Week in Review
                    </h3>
                    <p className="text-muted-foreground">
                      Here&apos;s how you lived your principles
                    </p>
                  </div>

                  {/* Results */}
                  <div className="space-y-3">
                    {principles.map((principle) => {
                      const entry = entries.find(
                        (e) => e.principleId === principle.id
                      );
                      const strength = calculatePrincipleStrength(
                        principle.id,
                        existingReviews
                      );

                      return (
                        <div
                          key={principle.id}
                          className="p-4 bg-slate-50 rounded-xl"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {principle.text}
                              </p>
                              {entry?.wasTested ? (
                                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                                  {entry.response === "held" && (
                                    <>
                                      <span className="text-emerald-600">
                                        💪 Held strong
                                      </span>
                                    </>
                                  )}
                                  {entry.response === "struggled" && (
                                    <>
                                      <span className="text-amber-600">
                                        😓 Struggled but held
                                      </span>
                                    </>
                                  )}
                                  {entry.response === "broke" && (
                                    <>
                                      <span className="text-red-600">
                                        💔 Broke it
                                      </span>
                                    </>
                                  )}
                                </p>
                              ) : (
                                <p className="text-sm text-muted-foreground mt-1">
                                  Not tested this week
                                </p>
                              )}
                            </div>
                            {/* Strength indicator */}
                            {strength.strengthScore >= 0 && (
                              <div className="flex items-center gap-1.5">
                                {strength.trend === "improving" && (
                                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                                )}
                                {strength.trend === "declining" && (
                                  <TrendingDown className="w-4 h-4 text-red-500" />
                                )}
                                {strength.trend === "stable" && (
                                  <Minus className="w-4 h-4 text-slate-400" />
                                )}
                                <span
                                  className={`text-sm font-medium ${
                                    strength.strengthScore >= 80
                                      ? "text-emerald-600"
                                      : strength.strengthScore >= 50
                                      ? "text-amber-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {strength.strengthScore}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Willson's Insight */}
                  {willsonInsight && (
                    <div className="p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl border border-indigo-100">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg gradient-ember flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-indigo-700 mb-1">
                            Willson&apos;s Take
                          </p>
                          <p className="text-sm text-slate-700">
                            {willsonInsight}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            {currentStep > 0 ? (
              <Button variant="ghost" onClick={handleBack}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {currentStep < totalSteps - 1 ? (
              <Button onClick={handleNext} className="gradient-ember text-white">
                {currentStep === 0 ? "Start Review" : "Next"}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="gradient-ember text-white"
              >
                {isSubmitting ? "Saving..." : "Complete Review"}
                <Check className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Strength badge component for dashboard
export function PrincipleStrengthBadge({
  strength,
}: {
  strength: PrincipleStrength;
}) {
  if (strength.strengthScore < 0) {
    return (
      <span className="text-xs text-slate-400 px-2 py-0.5 bg-slate-100 rounded-full">
        No data yet
      </span>
    );
  }

  const getLabel = () => {
    if (strength.strengthScore >= 80) return "💪 Strong";
    if (strength.strengthScore >= 50) return "⚡ Building";
    return "🔥 Needs attention";
  };

  const getColor = () => {
    if (strength.strengthScore >= 80) return "text-emerald-700 bg-emerald-50";
    if (strength.strengthScore >= 50) return "text-amber-700 bg-amber-50";
    return "text-red-700 bg-red-50";
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getColor()}`}>
      {getLabel()}
    </span>
  );
}

