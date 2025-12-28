"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Bell, Sparkles, BarChart3, Calendar, ArrowLeft, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface EmailPreferences {
  marketing: boolean;
  product_updates: boolean;
  onboarding_sequence: boolean;
  weekly_summary: boolean;
  checkin_reminders: boolean;
}

const defaultPreferences: EmailPreferences = {
  marketing: true,
  product_updates: true,
  onboarding_sequence: true,
  weekly_summary: true,
  checkin_reminders: true,
};

const preferenceOptions = [
  {
    key: "onboarding_sequence",
    title: "Onboarding Emails",
    description: "Helpful tips during your first week to get the most out of Willpowered",
    icon: Sparkles,
  },
  {
    key: "weekly_summary",
    title: "Weekly Summary",
    description: "A weekly recap of your progress, insights, and suggestions",
    icon: BarChart3,
  },
  {
    key: "checkin_reminders",
    title: "Check-in Reminders",
    description: "Gentle nudges if you miss your daily check-in",
    icon: Calendar,
  },
  {
    key: "product_updates",
    title: "Product Updates",
    description: "New features, improvements, and what's coming next",
    icon: Bell,
  },
  {
    key: "marketing",
    title: "Tips & Inspiration",
    description: "Occasional articles, stories, and insights on building willpower",
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
            Control what emails you receive from Willpowered
          </p>
        </div>

        {/* Saved indicator */}
        {showSaved && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-4 right-4 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Preferences saved
          </motion.div>
        )}

        {/* Preferences List */}
        <div className="bg-white rounded-2xl border border-border shadow-sm">
          {preferenceOptions.map((option, index) => {
            const Icon = option.icon;
            const isEnabled = preferences[option.key as keyof EmailPreferences];
            const isLast = index === preferenceOptions.length - 1;

            return (
              <div
                key={option.key}
                className={`flex items-start gap-4 p-6 ${
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
          We'll always send you essential account emails like password resets and
          billing receipts.
        </p>
      </div>
    </div>
  );
}



