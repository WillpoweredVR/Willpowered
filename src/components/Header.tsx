"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const journeySteps = [
  { name: "Finding Your Purpose", href: "/articles/finding-your-purpose" },
  { name: "Acquiring Skills", href: "/articles/acquiring-skills" },
  { name: "Establishing Habits", href: "/articles/establishing-habits" },
  { name: "Becoming Gritty", href: "/articles/becoming-gritty" },
  { name: "Handling Setbacks", href: "/articles/handling-setbacks" },
  { name: "Overcoming Limits", href: "/articles/overcoming-limits" },
  { name: "Persevering", href: "/articles/persevering" },
];

const navLinks = [
  { name: "Articles", href: "/articles" },
  { name: "Books", href: "/books" },
  { name: "Maps", href: "/maps" },
  { name: "About", href: "/about" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [journeyOpen, setJourneyOpen] = useState(false);

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
            {/* Journey Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setJourneyOpen(true)}
              onMouseLeave={() => setJourneyOpen(false)}
            >
              <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                The Journey
              </button>
              {journeyOpen && (
                <div className="absolute top-full left-0 w-64 mt-1 py-2 bg-card border border-border rounded-xl shadow-lg">
                  {journeySteps.map((step, index) => (
                    <Link
                      key={step.href}
                      href={step.href}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      <span className="w-6 h-6 rounded-full bg-ember/10 text-ember text-xs font-medium flex items-center justify-center">
                        {index + 1}
                      </span>
                      {step.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

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

          {/* CTA Button */}
          <div className="hidden lg:flex lg:items-center lg:gap-4">
            <Button className="gradient-ember text-white hover:opacity-90 transition-opacity gap-2">
              <Sparkles className="w-4 h-4" />
              Talk to AI Coach
            </Button>
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
              <p className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                The Journey
              </p>
              {journeySteps.map((step, index) => (
                <Link
                  key={step.href}
                  href={step.href}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="w-6 h-6 rounded-full bg-ember/10 text-ember text-xs font-medium flex items-center justify-center">
                    {index + 1}
                  </span>
                  {step.name}
                </Link>
              ))}
              <div className="h-px bg-border my-2" />
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
              <div className="px-4 pt-4">
                <Button className="w-full gradient-ember text-white gap-2">
                  <Sparkles className="w-4 h-4" />
                  Talk to AI Coach
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

