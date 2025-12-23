import Link from "next/link";
import { Mail, BookOpen, PenLine } from "lucide-react";

const resources = [
  { name: "Articles", href: "/articles" },
  { name: "Books", href: "/books" },
  { name: "About Colin", href: "/about" },
  { name: "Pricing", href: "/pricing" },
];

const socialLinks = [
  { 
    name: "Medium", 
    href: "https://medium.com/@colinrobertson", 
    icon: PenLine 
  },
  { 
    name: "Goodreads", 
    href: "https://goodreads.com/willpowered", 
    icon: BookOpen 
  },
  { 
    name: "Email", 
    href: "mailto:colin@willpowered.co", 
    icon: Mail 
  },
];

export function Footer() {
  return (
    <footer className="bg-slate-warm text-cream/90">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-ember flex items-center justify-center">
                <span className="text-white font-serif font-bold text-lg">W</span>
              </div>
              <span className="font-serif text-xl font-semibold tracking-tight text-cream">
                Willpowered
              </span>
            </Link>
            <p className="mt-4 text-sm text-cream/70 leading-relaxed">
              Build a system for becoming who you want to be. 
              Purpose → Principles → Scorecard.
            </p>
            <div className="mt-6 flex gap-4">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="w-10 h-10 rounded-full bg-cream/10 hover:bg-ember/80 flex items-center justify-center transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.name}
                >
                  <link.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-ember-light mb-4">
              Resources
            </h3>
            <ul className="space-y-3">
              {resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-cream/70 hover:text-cream transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter Signup */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-ember-light mb-4">
              Stay Willpowered
            </h3>
            <p className="text-sm text-cream/70 mb-4">
              Get weekly insights on building unshakeable willpower.
            </p>
            <form className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Your email"
                className="px-4 py-2.5 bg-cream/10 border border-cream/20 rounded-lg text-sm text-cream placeholder:text-cream/50 focus:outline-none focus:border-ember"
              />
              <button
                type="submit"
                className="px-4 py-2.5 gradient-ember text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-cream/10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-cream/50">
              © {new Date().getFullYear()} Willpowered. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-sm text-cream/50 hover:text-cream/70">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-cream/50 hover:text-cream/70">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
