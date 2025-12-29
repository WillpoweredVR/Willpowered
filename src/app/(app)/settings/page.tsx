"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  User, Mail, CreditCard, Bell, Trash2, Loader2, ChevronRight, LogOut, Shield, Download,
  Clock, Sun, Moon, Calendar, BarChart3, CalendarDays, Check, Sparkles, ArrowLeft, Camera
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";

interface EmailPreferences {
  marketing: boolean;
  product_updates: boolean;
  onboarding_sequence: boolean;
  weekly_summary: boolean;
  checkin_reminders: boolean;
  daily_scorecard: boolean;
  daily_scorecard_time: string;
  weekly_principles: boolean;
  weekly_principles_day: number;
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
  weekly_principles_day: 0,
};

const timeOptions = [
  { value: "06:00", label: "6 AM", icon: Sun },
  { value: "08:00", label: "8 AM", icon: Sun },
  { value: "12:00", label: "12 PM", icon: Sun },
  { value: "18:00", label: "6 PM", icon: Moon },
  { value: "20:00", label: "8 PM", icon: Moon },
  { value: "21:00", label: "9 PM", icon: Moon },
];

const dayOptions = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export default function SettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string; full_name: string | null; avatar_url: string | null } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [preferences, setPreferences] = useState<EmailPreferences>(defaultPreferences);
  const [showSaved, setShowSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { status, isPro, isTrialing, periodEndsAt, openPortal, isLoading: subLoading } = useSubscription();
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email_preferences, avatar_url")
        .eq("id", authUser.id)
        .single();

      setUser({
        id: authUser.id,
        email: authUser.email || "",
        full_name: profile?.full_name || null,
        avatar_url: profile?.avatar_url || null,
      });
      setFullName(profile?.full_name || "");
      setAvatarUrl(profile?.avatar_url || null);
      
      if (profile?.email_preferences) {
        setPreferences({
          ...defaultPreferences,
          ...profile.email_preferences,
        });
      }
      
      setIsLoading(false);
    };

    fetchUser();
  }, [router, supabase]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    setIsUploadingAvatar(true);

    try {
      // Create unique file path - flat structure with user ID prefix
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `avatar-${user.id}.${fileExt}`;

      // Try to remove old avatar first (ignore errors)
      try {
        await supabase.storage.from("avatars").remove([fileName]);
      } catch {
        // Ignore - file might not exist
      }

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { 
          upsert: true,
          cacheControl: "3600",
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        alert(`Failed to upload: ${uploadError.message}`);
        return;
      }

      console.log("Upload successful:", uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Add cache buster to force refresh
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlWithCacheBuster })
        .eq("id", user.id);

      if (updateError) {
        console.error("Profile update error:", updateError);
        alert(`Failed to save: ${updateError.message}`);
        return;
      }

      setAvatarUrl(urlWithCacheBuster);
      setUser({ ...user, avatar_url: urlWithCacheBuster });
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch (error) {
      console.error("Avatar upload error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveName = async () => {
    if (!user) return;
    
    setIsSaving(true);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (authUser) {
      await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", authUser.id);
    }
    
    setUser({ ...user, full_name: fullName });
    setIsSaving(false);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

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
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (authUser) {
      await supabase
        .from("profiles")
        .update({ email_preferences: prefs })
        .eq("id", authUser.id);
    }

    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  // Get initials for avatar fallback
  const getInitials = () => {
    if (fullName) {
      return fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "?";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-ember" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-12 lg:px-8">
        {/* Back to Dashboard */}
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <h1 className="font-serif text-3xl font-bold text-foreground mb-8">Settings</h1>

        {/* Saved indicator */}
        {showSaved && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-4 right-4 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50"
          >
            <Check className="w-4 h-4" />
            Saved
          </motion.div>
        )}

        {/* Profile Section */}
        <section className="mb-8">
          <h2 className="font-serif text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-ember" />
            Profile
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            {/* Profile Picture */}
            <div className="flex items-center gap-6 mb-6 pb-6 border-b border-slate-100">
              <div className="relative">
                {avatarUrl ? (
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-200">
                    <Image
                      src={avatarUrl}
                      alt="Profile picture"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-ember to-amber-500 flex items-center justify-center text-white text-2xl font-bold border-2 border-slate-200">
                    {getInitials()}
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  ) : (
                    <Camera className="w-4 h-4 text-slate-500" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <div>
                <p className="font-medium text-foreground">{fullName || "Add your name"}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-ember hover:underline mt-1"
                >
                  {avatarUrl ? "Change photo" : "Upload photo"}
                </button>
              </div>
            </div>

            {/* Name input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ember/20 focus:border-ember"
              />
            </div>
            <Button 
              onClick={handleSaveName} 
              disabled={isSaving || fullName === user?.full_name}
              className="gradient-ember text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </section>

        {/* Subscription Section */}
        <section className="mb-8">
          <h2 className="font-serif text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-ember" />
            Subscription
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            {subLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </div>
            ) : isPro || isTrialing ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full">
                      <Shield className="w-3.5 h-3.5" />
                      {isTrialing ? "Pro Trial" : "Pro Plan"}
                    </span>
                    {periodEndsAt && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {isTrialing ? "Trial ends" : "Next billing date"}:{" "}
                        {periodEndsAt.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={openPortal}
                    className="gap-2"
                  >
                    Manage
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enjoy unlimited conversations with Willson, priority AI responses, and more.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 text-sm font-medium rounded-full">
                      Free Plan
                    </span>
                    <p className="text-sm text-muted-foreground mt-2">
                      20 conversations per month
                    </p>
                  </div>
                  <Button 
                    onClick={() => router.push("/pricing")}
                    className="gradient-ember text-white gap-2"
                  >
                    Upgrade
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Unlock unlimited Willson conversations, priority responses, and more with Pro.
                </p>
              </>
            )}
          </div>
        </section>

        {/* ===== EMAIL PREFERENCES SECTION ===== */}
        <section className="mb-8">
          <h2 className="font-serif text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-ember" />
            Email Reminders
          </h2>

          {/* Daily Scorecard */}
          <div className="bg-white rounded-xl border border-slate-200 mb-4">
            <div className="p-5">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  preferences.daily_scorecard ? "bg-ember/10" : "bg-slate-100"
                }`}>
                  <BarChart3 className={`w-5 h-5 ${
                    preferences.daily_scorecard ? "text-ember" : "text-slate-400"
                  }`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">Daily Scorecard</h3>
                      <p className="text-sm text-muted-foreground">
                        Personalized check-in with your metrics
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggle("daily_scorecard")}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                        preferences.daily_scorecard ? "bg-ember" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                          preferences.daily_scorecard ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {preferences.daily_scorecard && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3 pt-3 border-t border-slate-100"
                    >
                      <label className="text-xs font-medium text-slate-500 flex items-center gap-1 mb-2">
                        <Clock className="w-3 h-3" />
                        SEND AT
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {timeOptions.map((option) => {
                          const isSelected = preferences.daily_scorecard_time === option.value;
                          return (
                            <button
                              key={option.value}
                              onClick={() => handleSelectChange("daily_scorecard_time", option.value)}
                              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                                isSelected
                                  ? "bg-ember text-white"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Principles */}
          <div className="bg-white rounded-xl border border-slate-200 mb-4">
            <div className="p-5">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  preferences.weekly_principles ? "bg-violet-100" : "bg-slate-100"
                }`}>
                  <CalendarDays className={`w-5 h-5 ${
                    preferences.weekly_principles ? "text-violet-600" : "text-slate-400"
                  }`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">Weekly Principles Review</h3>
                      <p className="text-sm text-muted-foreground">
                        5-minute reflection on your principles
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggle("weekly_principles")}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                        preferences.weekly_principles ? "bg-violet-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                          preferences.weekly_principles ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {preferences.weekly_principles && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3 pt-3 border-t border-violet-100"
                    >
                      <label className="text-xs font-medium text-slate-500 flex items-center gap-1 mb-2">
                        <Calendar className="w-3 h-3" />
                        SEND ON
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {dayOptions.map((option) => {
                          const isSelected = preferences.weekly_principles_day === option.value;
                          return (
                            <button
                              key={option.value}
                              onClick={() => handleSelectChange("weekly_principles_day", option.value)}
                              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                                isSelected
                                  ? "bg-violet-600 text-white"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Other Email Preferences */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-medium text-slate-600">Other Emails</h3>
            </div>
            
            {/* Welcome Series */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Sparkles className={`w-4 h-4 ${preferences.onboarding_sequence ? "text-ember" : "text-slate-400"}`} />
                <span className="text-sm text-foreground">Welcome Series</span>
              </div>
              <button
                onClick={() => handleToggle("onboarding_sequence")}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                  preferences.onboarding_sequence ? "bg-ember" : "bg-slate-200"
                }`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                  preferences.onboarding_sequence ? "translate-x-4" : "translate-x-0"
                }`} />
              </button>
            </div>

            {/* Product Updates */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Bell className={`w-4 h-4 ${preferences.product_updates ? "text-ember" : "text-slate-400"}`} />
                <span className="text-sm text-foreground">Product Updates</span>
              </div>
              <button
                onClick={() => handleToggle("product_updates")}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                  preferences.product_updates ? "bg-ember" : "bg-slate-200"
                }`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                  preferences.product_updates ? "translate-x-4" : "translate-x-0"
                }`} />
              </button>
            </div>

            {/* Tips & Inspiration */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Mail className={`w-4 h-4 ${preferences.marketing ? "text-ember" : "text-slate-400"}`} />
                <span className="text-sm text-foreground">Tips & Inspiration</span>
              </div>
              <button
                onClick={() => handleToggle("marketing")}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                  preferences.marketing ? "bg-ember" : "bg-slate-200"
                }`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                  preferences.marketing ? "translate-x-4" : "translate-x-0"
                }`} />
              </button>
            </div>
          </div>
        </section>

        {/* Export Section */}
        <section className="mb-8">
          <h2 className="font-serif text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-ember" />
            Export Data
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <p className="text-muted-foreground mb-4">
              Download a copy of your purpose, principles, scorecard, and other data.
            </p>
            <Button variant="outline" disabled={!isPro && !isTrialing}>
              <Download className="w-4 h-4 mr-2" />
              {isPro || isTrialing ? "Export My Data" : "Upgrade to Export"}
            </Button>
          </div>
        </section>

        {/* Account Actions */}
        <section>
          <h2 className="font-serif text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            Account
          </h2>
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
            
            {showDeleteConfirm ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-700 mb-3">
                  Are you sure? This will permanently delete your account and all data.
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleDeleteAccount}
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
