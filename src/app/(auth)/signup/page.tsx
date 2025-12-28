"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Mail, Lock, User, ArrowRight, Loader2, Check, CheckCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { 
  trackSignupStarted, 
  trackSignupFormEngaged, 
  trackSignupMethodSelected, 
  trackSignupCompleted,
  trackSignupError 
} from "@/lib/posthog";

const benefits = [
  "Know exactly what you're working toward (finally)",
  "Make hard decisions automatically with your personal rules",
  "See real progress with data, not just feelings",
  "Stay on track even when motivation disappears",
];

const chatBenefits = [
  "Continue your conversation with Willson",
  "Get a personalized plan based on what you shared",
  "Track daily with your custom scorecard",
  "Unlimited coaching whenever you need it",
];

function SignupContent() {
  const searchParams = useSearchParams();
  const fromChat = searchParams.get("from") === "chat";
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [hasConversation, setHasConversation] = useState(false);

  // Track page view on mount and check for saved conversation
  useEffect(() => {
    trackSignupStarted(fromChat ? 'chat_gate' : 'signup_page');
    
    // Check if there's a saved conversation
    const savedConversation = localStorage.getItem("willson_conversation");
    if (savedConversation) {
      setHasConversation(true);
    }
  }, [fromChat]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    trackSignupMethodSelected('email');

    const supabase = createClient();

    // Use production URL for email redirects (not localhost)
    const redirectUrl = process.env.NEXT_PUBLIC_APP_URL || "https://willpowered.com";
    
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${redirectUrl}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      trackSignupError(error.message, 'email');
      setIsLoading(false);
      return;
    }

    // Check if email confirmation is required
    // If identities array is empty, email confirmation is needed
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setError("An account with this email already exists. Please sign in instead.");
      trackSignupError('account_exists', 'email');
      setIsLoading(false);
      return;
    }

    // Show confirmation screen
    trackSignupCompleted('email');
    setIsLoading(false);
    setShowConfirmation(true);
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    trackSignupMethodSelected('google');
    const supabase = createClient();
    const redirectUrl = process.env.NEXT_PUBLIC_APP_URL || "https://willpowered.com";

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${redirectUrl}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      trackSignupError(error.message, 'google');
      setIsLoading(false);
    }
  };

  // Track form field engagement
  const handleFieldFocus = (field: string) => {
    trackSignupFormEngaged(field);
  };

  // Email confirmation screen
  if (showConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream to-white p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          {/* Success animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6"
          >
            <Mail className="w-10 h-10 text-emerald-600" />
          </motion.div>

          <h1 className="font-serif text-3xl font-bold text-foreground mb-3">
            Check your email
          </h1>
          
          <p className="text-lg text-muted-foreground mb-2">
            We sent a verification link to
          </p>
          
          <p className="text-lg font-medium text-foreground mb-6">
            {email}
          </p>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 text-left">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              What happens next?
            </h3>
            <ol className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-ember/10 flex items-center justify-center flex-shrink-0 text-ember font-medium text-sm">1</span>
                <span>Open the email we just sent you</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-ember/10 flex items-center justify-center flex-shrink-0 text-ember font-medium text-sm">2</span>
                <span>Click the verification link</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-ember/10 flex items-center justify-center flex-shrink-0 text-ember font-medium text-sm">3</span>
                <span>Start your journey with Willson!</span>
              </li>
            </ol>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Didn't receive the email? Check your spam folder or{" "}
            <button 
              onClick={() => setShowConfirmation(false)}
              className="text-ember hover:underline font-medium"
            >
              try again
            </button>
          </p>

          <div className="pt-4 border-t border-slate-200">
            <p className="text-sm text-muted-foreground">
              Already verified?{" "}
              <Link href="/login" className="text-ember hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  const displayBenefits = fromChat ? chatBenefits : benefits;

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-12 flex-col justify-between">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg gradient-ember flex items-center justify-center">
              <span className="font-serif font-bold text-xl">W</span>
            </div>
            <span className="font-serif text-xl font-semibold">Willpowered</span>
          </Link>
        </div>

        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {fromChat ? (
              <>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-sm font-medium mb-6">
                  <MessageSquare className="w-4 h-4" />
                  Conversation saved
                </span>
                <h1 className="font-serif text-4xl font-bold mb-6">
                  Willson is ready to continue.
                </h1>
                <p className="text-xl text-slate-300 mb-8">
                  Your conversation has been saved. Create your free account and Willson will 
                  pick up right where you left off—with a personalized plan based on what you shared.
                </p>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-sm font-medium mb-6">
                  <Sparkles className="w-4 h-4" />
                  Why → How → What
                </span>
                <h1 className="font-serif text-4xl font-bold mb-6">
                  Your system is 5 minutes away.
                </h1>
                <p className="text-xl text-slate-300 mb-8">
                  Not another app to check. Not another habit to track. 
                  A complete system that connects who you want to be with what you do every day.
                </p>
              </>
            )}

            <div className="space-y-4">
              {displayBenefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-ember/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-ember-light" />
                  </div>
                  <span className="text-slate-300">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="text-sm text-slate-400">
          © {new Date().getFullYear()} Willpowered. All rights reserved.
        </div>
      </div>

      {/* Right side - Signup form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-cream to-white">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg gradient-ember flex items-center justify-center">
                <span className="font-serif font-bold text-xl text-white">W</span>
              </div>
              <span className="font-serif text-xl font-semibold">Willpowered</span>
            </Link>
          </div>

          <div className="text-center mb-8">
            {fromChat ? (
              <>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
                  <MessageSquare className="w-4 h-4" />
                  Continue with Willson
                </div>
                <h2 className="font-serif text-3xl font-bold text-foreground mb-2">
                  Save your conversation
                </h2>
                <p className="text-muted-foreground">
                  Free forever • Pick up where you left off
                </p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-ember/10 text-ember rounded-full text-sm font-medium mb-4">
                  <Sparkles className="w-4 h-4" />
                  Free to start • No credit card
                </div>
                <h2 className="font-serif text-3xl font-bold text-foreground mb-2">
                  Create your account
                </h2>
                <p className="text-muted-foreground">
                  Takes less than 60 seconds
                </p>
              </>
            )}
          </div>

          {/* Google signup */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 mb-4 bg-white"
            onClick={handleGoogleSignup}
            disabled={isLoading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <p className="text-xs text-center text-muted-foreground mb-4">
            Recommended — instant access, no verification needed
          </p>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gradient-to-br from-cream to-white px-2 text-muted-foreground">
                Or with email
              </span>
            </div>
          </div>

          {/* Email signup form */}
          <form onSubmit={handleSignup} className="space-y-4">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Your name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onFocus={() => handleFieldFocus('name')}
                  placeholder="What should Willson call you?"
                  required
                  className="w-full h-12 pl-10 pr-4 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ember/20 focus:border-ember transition-all bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => handleFieldFocus('email')}
                  placeholder="you@example.com"
                  required
                  className="w-full h-12 pl-10 pr-4 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ember/20 focus:border-ember transition-all bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => handleFieldFocus('password')}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  className="w-full h-12 pl-10 pr-4 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ember/20 focus:border-ember transition-all bg-white"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 gradient-ember text-white"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="text-ember hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-ember hover:underline">
                Privacy Policy
              </Link>
            </p>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-ember hover:text-ember-dark font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-ember" />
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}
