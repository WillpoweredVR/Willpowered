"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, CreditCard, Bell, Trash2, Loader2, ChevronRight, LogOut, Shield, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";

export default function SettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ email: string; full_name: string | null } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { status, isPro, isTrialing, periodEndsAt, openPortal, isLoading: subLoading } = useSubscription();

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", authUser.id)
        .single();

      setUser({
        email: authUser.email || "",
        full_name: profile?.full_name || null,
      });
      setFullName(profile?.full_name || "");
      setIsLoading(false);
    };

    fetchUser();
  }, [router]);

  const handleSaveName = async () => {
    if (!user) return;
    
    setIsSaving(true);
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (authUser) {
      await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", authUser.id);
    }
    
    setUser({ ...user, full_name: fullName });
    setIsSaving(false);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    // In a real implementation, this would trigger account deletion
    // For now, just sign out
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
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
        <h1 className="font-serif text-3xl font-bold text-foreground mb-8">Settings</h1>

        {/* Profile Section */}
        <section className="mb-8">
          <h2 className="font-serif text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-ember" />
            Profile
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Email
              </label>
              <div className="flex items-center gap-2 text-foreground">
                <Mail className="w-4 h-4 text-muted-foreground" />
                {user?.email}
              </div>
            </div>
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

        {/* Notifications Section */}
        <section className="mb-8">
          <h2 className="font-serif text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-ember" />
            Notifications
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <p className="text-sm text-muted-foreground">
              Notification preferences coming soon.
            </p>
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


