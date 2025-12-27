"use client";

import { useEffect, useRef, useState } from "react";
import {
  trackArticleViewed,
  trackArticleScrolled,
  trackArticleCompleted,
} from "@/lib/posthog";

interface ArticleTrackerProps {
  slug: string;
  title: string;
  category?: string;
  children: React.ReactNode;
}

export function ArticleTracker({ slug, title, category, children }: ArticleTrackerProps) {
  const startTimeRef = useRef<number>(Date.now());
  const trackedScrollPoints = useRef<Set<number>>(new Set());
  const [hasCompleted, setHasCompleted] = useState(false);

  // Track article view on mount
  useEffect(() => {
    trackArticleViewed(slug, title, category);
    startTimeRef.current = Date.now();
  }, [slug, title, category]);

  // Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      // Track at 25%, 50%, 75%, 100%
      const milestones = [25, 50, 75, 100];
      for (const milestone of milestones) {
        if (scrollPercent >= milestone && !trackedScrollPoints.current.has(milestone)) {
          trackedScrollPoints.current.add(milestone);
          trackArticleScrolled(slug, milestone);

          // Track completion at 90%+
          if (milestone >= 75 && !hasCompleted) {
            const readTimeSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
            trackArticleCompleted(slug, title, readTimeSeconds);
            setHasCompleted(true);
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [slug, title, hasCompleted]);

  return <>{children}</>;
}


