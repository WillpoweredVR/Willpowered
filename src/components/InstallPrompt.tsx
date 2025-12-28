"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isInStandaloneMode = 
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    
    setIsStandalone(isInStandaloneMode);

    // Check if iOS (including newer iOS Safari)
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.userAgent.includes("Mac") && "ontouchend" in document);
    setIsIOS(isIOSDevice);

    // Check if previously dismissed (within last 7 days)
    const dismissedTimestamp = localStorage.getItem("pwa-prompt-dismissed");
    let recentlyDismissed = false;
    
    if (dismissedTimestamp) {
      const dismissedTime = parseInt(dismissedTimestamp, 10);
      // Only count as dismissed if within 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        recentlyDismissed = true;
        setDismissed(true);
      } else {
        // Clear old dismissal
        localStorage.removeItem("pwa-prompt-dismissed");
      }
    }

    // Don't show prompt if already installed or recently dismissed
    if (isInStandaloneMode || recentlyDismissed) {
      return;
    }

    // Listen for beforeinstallprompt (Android/Desktop Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a delay
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // For iOS, show custom prompt after delay (iOS doesn't fire beforeinstallprompt)
    if (isIOSDevice) {
      setTimeout(() => setShowPrompt(true), 5000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
  };

  // Don't show if already installed or dismissed
  if (isStandalone || dismissed || !showPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
        >
          <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border border-border overflow-hidden">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-ember to-amber-500 p-4 text-white">
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Get the App Experience</h3>
                  <p className="text-white/80 text-sm">Install Willpowered on your device</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              {isIOS ? (
                // iOS Instructions
                <div className="space-y-4">
                  <p className="text-muted-foreground text-sm">
                    Add Willpowered to your home screen for quick access and an app-like experience:
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <Share className="w-4 h-4 text-slate-600" />
                      </div>
                      <span>Tap the <strong>Share</strong> button in Safari</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <Plus className="w-4 h-4 text-slate-600" />
                      </div>
                      <span>Select <strong>"Add to Home Screen"</strong></span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleDismiss}
                  >
                    Got it
                  </Button>
                </div>
              ) : (
                // Android/Desktop prompt
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-ember flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-serif font-bold text-lg">W</span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Install Willpowered for faster access, push notifications for check-in 
                        reminders, and an app-like experience.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleDismiss}
                    >
                      Not Now
                    </Button>
                    <Button
                      className="flex-1 gradient-ember text-white gap-2"
                      onClick={handleInstall}
                    >
                      <Download className="w-4 h-4" />
                      Install
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}



