"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, Sparkles, User, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatModal } from "@/components/ChatModal";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const navLinks = [
  { name: "Pricing", href: "/pricing" },
  { name: "Articles", href: "/articles" },
  { name: "Books", href: "/books" },
  { name: "About", href: "/about" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    // Check current session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <nav className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg gradient-ember flex items-center justify-center">
              <span className="text-white font-serif font-bold text-lg">W</span>
            </div>
            <span className="font-serif text-xl font-semibold tracking-tight text-foreground group-hover:text-ember transition-colors">
              Willpowered
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex lg:items-center lg:gap-3">
            {loading ? (
              <div className="w-24 h-9 bg-muted/50 rounded-lg animate-pulse" />
            ) : user ? (
              <>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Dashboard
                </Link>
                <Button 
                  className="gradient-ember text-white hover:opacity-90 transition-opacity gap-2"
                  onClick={() => setIsChatOpen(true)}
                >
                  <Sparkles className="w-4 h-4" />
                  Willson
                </Button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
                <Button 
                  asChild
                  className="gradient-ember text-white hover:opacity-90 transition-opacity"
                >
                  <Link href="/signup">
                    Get Started Free
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border/50">
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="px-4 pt-4 space-y-3">
                {user ? (
                  <>
                    <Button 
                      asChild
                      variant="outline"
                      className="w-full gap-2"
                    >
                      <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <User className="w-4 h-4" />
                        Dashboard
                      </Link>
                    </Button>
                    <Button 
                      className="w-full gradient-ember text-white gap-2"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setIsChatOpen(true);
                      }}
                    >
                      <Sparkles className="w-4 h-4" />
                      Talk to Willson
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      asChild
                      variant="outline"
                      className="w-full gap-2"
                    >
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                        <LogIn className="w-4 h-4" />
                        Sign In
                      </Link>
                    </Button>
                    <Button 
                      asChild
                      className="w-full gradient-ember text-white"
                    >
                      <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                        Get Started Free
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <ChatModal 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </header>
  );
}
