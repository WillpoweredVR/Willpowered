"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Mail, Bell, Sparkles, BarChart3, Calendar, ArrowLeft, Loader2, Check,
  Clock, Sun, Moon, CalendarDays
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface EmailPreferences {
  marketing: boolean;
  product_updates: boolean;
  onboarding_sequence: boolean;
  weekly_summary: boolean;
  checkin_reminders: boolean;
  // New structured preferences
  daily_scorecard: boolean;
  daily_scorecard_time: string; // "18:00", "20:00", etc.
  weekly_principles: boolean;
  weekly_principles_day: number; // 0 = Sunday, 1 = Monday, etc.
}

const defaultPreferences: EmailPreferences = {
  marketing: true,
  product_updates: true,
  onboarding_sequence: true,
  weekly_summary: true,
  checkin_reminders: true,
  daily_scorecard: true,
  daily_scorecard_time: "18:00",
  weekly_principles: true,
  weekly_principles_day: 0, // Sunday
};

const timeOptions = [
  { value: "06:00", label: "6:00 AM", icon: Sun },
  { value: "08:00", label: "8:00 AM", icon: Sun },
  { value: "12:00", label: "12:00 PM", icon: Sun },
  { value: "18:00", label: "6:00 PM", icon: Moon },
  { value: "20:00", label: "8:00 PM", icon: Moon },
  { value: "21:00", label: "9:00 PM", icon: Moon },
];

const dayOptions = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const basicPreferences = [
  {
    key: "onboarding_sequence",
    title: "Welcome Series",
    description: "Helpful tips during your first week",
    icon: Sparkles,
  },
  {
    key: "product_updates",
    title: "Product Updates",
    description: "New features and improvements",
    icon: Bell,
  },
  {
    key: "marketing",
    title: "Tips & Inspiration",
    description: "Occasional articles and hero stories",
    icon: Mail,
  },
];

export default function EmailSettingsPage() {
  const [preferences, setPreferences] = useState<EmailPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadPreferences() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email_preferences")
          .eq("id", user.id)
          .single();

        if (profile?.email_preferences) {
          setPreferences({
            ...defaultPreferences,
            ...profile.email_preferences,
          });
        }
      }
      setIsLoading(false);
    }

    loadPreferences();
  }, [supabase]);

  const handleToggle = async (key: keyof EmailPreferences) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };
    setPreferences(newPreferences);
    await savePreferences(newPreferences);
  };

  const handleSelectChange = async (key: keyof EmailPreferences, value: string | number) => {
    const newPreferences = {
      ...preferences,
      [key]: value,
    };
    setPreferences(newPreferences);
    await savePreferences(newPreferences);
  };

  const savePreferences = async (prefs: EmailPreferences) => {
    setIsSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("profiles")
        .update({ email_preferences: prefs })
        .eq("id", user.id);
    }

    setIsSaving(false);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-ember" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </Link>
          <h1 className="text-3xl font-serif font-bold text-foreground">
            Email Preferences
          </h1>
          <p className="text-muted-foreground mt-2">
            Stay on track with personalized reminders
          </p>
        </div>

        {/* Saved indicator */}
        {showSaved && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-4 right-4 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50"
          >
            <Check className="w-4 h-4" />
            Preferences saved
          </motion.div>
        )}

        {/* ===== DAILY SCORECARD SECTION ===== */}
        <div className="bg-white rounded-2xl border border-border shadow-sm mb-6">
          <div className="p-6 border-b border-border">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                preferences.daily_scorecard ? "bg-ember/10" : "bg-slate-100"
              }`}>
                <BarChart3 className={`w-6 h-6 ${
                  preferences.daily_scorecard ? "text-ember" : "text-slate-400"
                }`} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">Daily Scorecard Check-in</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      A personalized question about your progress, with your metrics
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle("daily_scorecard")}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ember focus:ring-offset-2 ${
                      preferences.daily_scorecard ? "bg-ember" : "bg-slate-200"
                    }`}
                    disabled={isSaving}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        preferences.daily_scorecard ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Time selection */}
                {preferences.daily_scorecard && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4"
                  >
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4" />
                      Send daily email at:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {timeOptions.map((option) => {
                        const Icon = option.icon;
                        const isSelected = preferences.daily_scorecard_time === option.value;
                        return (
                          <button
                            key={option.value}
                            onClick={() => handleSelectChange("daily_scorecard_time", option.value)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-all ${
                              isSelected
                                ? "border-ember bg-ember/5 text-ember font-medium"
                                : "border-slate-200 hover:border-slate-300 text-slate-600"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Based on your timezone. Evening works best for reflecting on your day.
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Example preview */}
          {preferences.daily_scorecard && (
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-2 font-medium">EXAMPLE EMAIL:</p>
              <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-900">How did workouts go today?</p>
                <p className="text-xs text-slate-500 mt-1">This week so far: 2/4 sessions</p>
                <p className="text-xs text-ember mt-2">→ 2 more to hit your target</p>
              </div>
            </div>
          )}
        </div>

        {/* ===== WEEKLY PRINCIPLES SECTION ===== */}
        <div className="bg-white rounded-2xl border border-border shadow-sm mb-6">
          <div className="p-6 border-b border-border">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                preferences.weekly_principles ? "bg-violet-100" : "bg-slate-100"
              }`}>
                <CalendarDays className={`w-6 h-6 ${
                  preferences.weekly_principles ? "text-violet-600" : "text-slate-400"
                }`} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">Weekly Principles Review</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      A 5-minute reflection on how your principles held up this week
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle("weekly_principles")}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-600 focus:ring-offset-2 ${
                      preferences.weekly_principles ? "bg-violet-600" : "bg-slate-200"
                    }`}
                    disabled={isSaving}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        preferences.weekly_principles ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Day selection */}
                {preferences.weekly_principles && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4"
                  >
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4" />
                      Send review reminder on:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {dayOptions.map((option) => {
                        const isSelected = preferences.weekly_principles_day === option.value;
                        return (
                          <button
                            key={option.value}
                            onClick={() => handleSelectChange("weekly_principles_day", option.value)}
                            className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                              isSelected
                                ? "border-violet-600 bg-violet-50 text-violet-700 font-medium"
                                : "border-slate-200 hover:border-slate-300 text-slate-600"
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Sunday is ideal for reflecting on the week before the new one begins.
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Example preview */}
          {preferences.weekly_principles && (
            <div className="p-4 bg-violet-50/50 border-t border-violet-100">
              <p className="text-xs text-slate-500 mb-2 font-medium">EXAMPLE EMAIL:</p>
              <div className="bg-white rounded-lg p-4 border border-violet-200 shadow-sm">
                <p className="text-xs text-violet-600 font-medium mb-1">THIS WEEK'S FOCUS:</p>
                <p className="text-sm font-medium text-slate-900">"Consistency conquers intensity"</p>
                <p className="text-xs text-slate-500 mt-2 italic">Usually tested when: feeling motivated to do extra</p>
                <p className="text-xs text-violet-600 mt-2">→ Start 5-minute review</p>
              </div>
            </div>
          )}
        </div>

        {/* ===== OTHER EMAILS SECTION ===== */}
        <div className="bg-white rounded-2xl border border-border shadow-sm">
          <div className="p-4 border-b border-border">
            <h3 className="font-medium text-slate-700">Other Emails</h3>
          </div>
          {basicPreferences.map((option, index) => {
            const Icon = option.icon;
            const isEnabled = preferences[option.key as keyof EmailPreferences] as boolean;
            const isLast = index === basicPreferences.length - 1;

            return (
              <div
                key={option.key}
                className={`flex items-start gap-4 p-5 ${
                  !isLast ? "border-b border-border" : ""
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isEnabled ? "bg-ember/10" : "bg-slate-100"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isEnabled ? "text-ember" : "text-slate-400"
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground">{option.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {option.description}
                  </p>
                </div>

                <button
                  onClick={() => handleToggle(option.key as keyof EmailPreferences)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ember focus:ring-offset-2 ${
                    isEnabled ? "bg-ember" : "bg-slate-200"
                  }`}
                  disabled={isSaving}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="mt-6 text-sm text-muted-foreground text-center">
          We'll always send essential emails like password resets and billing receipts.
        </p>
      </div>
    </div>
  );
}
