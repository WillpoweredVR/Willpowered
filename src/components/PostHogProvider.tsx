'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initPostHog, trackPageView, posthog } from '@/lib/posthog'

// IPs to exclude from tracking (add your IP here)
const EXCLUDED_IPS = process.env.NEXT_PUBLIC_EXCLUDED_IPS?.split(',') || [];

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isInitialized, setIsInitialized] = useState(false)
  const initialPageViewTracked = useRef(false)

  // Initialize PostHog on mount
  useEffect(() => {
    const checkAndInitPostHog = async () => {
      // Skip if already initialized
      if (posthog?.__loaded) {
        setIsInitialized(true)
        return
      }

      if (EXCLUDED_IPS.length > 0) {
        try {
          const response = await fetch('https://api.ipify.org?format=json');
          const data = await response.json();
          const userIP = data.ip;
          
          if (EXCLUDED_IPS.includes(userIP)) {
            console.log('PostHog: Internal IP detected, disabling tracking');
            return;
          }
        } catch (error) {
          console.warn('PostHog: Could not check IP, continuing with tracking');
        }
      }
      
      initPostHog();
      setIsInitialized(true)
      console.log('PostHog: Initialized successfully')
    };
    
    checkAndInitPostHog();
  }, [])

  // Track initial page view once PostHog is ready
  useEffect(() => {
    if (isInitialized && pathname && !initialPageViewTracked.current) {
      let url = window.origin + pathname
      if (searchParams?.toString()) {
        url = url + '?' + searchParams.toString()
      }
      trackPageView(url)
      initialPageViewTracked.current = true
      console.log('PostHog: Initial page view tracked', url)
    }
  }, [isInitialized, pathname, searchParams])

  // Track subsequent page views on route change
  useEffect(() => {
    // Skip if not initialized or if this is the initial page view
    if (!isInitialized || !initialPageViewTracked.current) return
    
    if (pathname) {
      let url = window.origin + pathname
      if (searchParams?.toString()) {
        url = url + '?' + searchParams.toString()
      }
      trackPageView(url)
      console.log('PostHog: Page view tracked', url)
    }
  }, [pathname, searchParams, isInitialized])

  return <>{children}</>
}


