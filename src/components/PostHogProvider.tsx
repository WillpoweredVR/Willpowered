'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initPostHog, trackPageView, posthog } from '@/lib/posthog'

// IPs to exclude from tracking (add your IP here)
const EXCLUDED_IPS = process.env.NEXT_PUBLIC_EXCLUDED_IPS?.split(',') || [];

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Initialize PostHog on mount
  useEffect(() => {
    // Check if this IP should be excluded
    const checkAndInitPostHog = async () => {
      if (EXCLUDED_IPS.length > 0) {
        try {
          const response = await fetch('https://api.ipify.org?format=json');
          const data = await response.json();
          const userIP = data.ip;
          
          if (EXCLUDED_IPS.includes(userIP)) {
            console.log('PostHog: Internal IP detected, disabling tracking');
            // Don't initialize PostHog for excluded IPs
            return;
          }
        } catch (error) {
          // If IP check fails, continue with tracking
          console.warn('PostHog: Could not check IP, continuing with tracking');
        }
      }
      
      initPostHog();
    };
    
    checkAndInitPostHog();
  }, [])

  // Track page views on route change
  useEffect(() => {
    if (pathname && posthog?.__loaded) {
      let url = window.origin + pathname
      if (searchParams?.toString()) {
        url = url + '?' + searchParams.toString()
      }
      trackPageView(url)
    }
  }, [pathname, searchParams])

  return <>{children}</>
}


