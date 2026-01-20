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

  // Track page views - both initial and on route changes
  const lastTrackedUrl = useRef<string | null>(null)
  
  useEffect(() => {
    if (!isInitialized || !pathname) return
    
    let url = window.origin + pathname
    if (searchParams?.toString()) {
      url = url + '?' + searchParams.toString()
    }
    
    // Avoid duplicate tracking of the same URL
    if (lastTrackedUrl.current === url) return
    
    trackPageView(url)
    lastTrackedUrl.current = url
    console.log('PostHog: Page view tracked', url)
  }, [isInitialized, pathname, searchParams])

  return <>{children}</>
}


