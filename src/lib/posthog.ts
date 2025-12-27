import posthog from 'posthog-js'

// Initialize PostHog only on client side
export const initPostHog = () => {
  if (typeof window !== 'undefined' && !posthog.__loaded) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      person_profiles: 'identified_only',
      capture_pageview: false, // We'll handle this manually for SPA
      capture_pageleave: true,
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') {
          // Uncomment to debug in development
          // posthog.debug()
        }
      },
    })
  }
  return posthog
}

// ============================================
// CONVERSION FUNNEL EVENTS
// ============================================

export const trackPageView = (url?: string) => {
  posthog.capture('$pageview', {
    $current_url: url || window.location.href,
  })
}

export const trackSignupStarted = (source: string) => {
  posthog.capture('signup_started', {
    source, // 'hero_cta', 'nav_button', 'footer_cta', 'article_cta'
  })
}

export const trackSignupCompleted = (method: 'email' | 'google') => {
  posthog.capture('signup_completed', {
    method,
  })
}

export const trackEmailVerified = () => {
  posthog.capture('email_verified')
}

export const trackOnboardingStep = (step: number, stepName: string) => {
  posthog.capture('onboarding_step', {
    step,
    step_name: stepName,
  })
}

export const trackOnboardingCompleted = (totalSteps: number) => {
  posthog.capture('onboarding_completed', {
    total_steps: totalSteps,
  })
}

export const trackFirstCheckin = () => {
  posthog.capture('first_checkin')
}

export const trackSubscriptionStarted = (plan: string) => {
  posthog.capture('subscription_started', {
    plan,
  })
}

// ============================================
// ENGAGEMENT EVENTS
// ============================================

export const trackArticleRead = (slug: string, title: string, readTime?: number) => {
  posthog.capture('article_read', {
    slug,
    title,
    read_time_seconds: readTime,
  })
}

export const trackChatStarted = (source: string) => {
  posthog.capture('chat_started', {
    source, // 'floating_button', 'hero_cta', 'article_cta'
  })
}

export const trackChatMessage = (messageCount: number) => {
  posthog.capture('chat_message_sent', {
    message_count: messageCount,
  })
}

export const trackCTAClicked = (ctaId: string, ctaText: string, location: string) => {
  posthog.capture('cta_clicked', {
    cta_id: ctaId,
    cta_text: ctaText,
    location, // 'hero', 'mid_page', 'footer', 'article'
  })
}

// ============================================
// A/B TESTING HELPERS
// ============================================

export const getFeatureFlag = (flagKey: string): boolean | string | undefined => {
  return posthog.getFeatureFlag(flagKey)
}

export const getFeatureFlagPayload = (flagKey: string) => {
  return posthog.getFeatureFlagPayload(flagKey)
}

// Identify user for personalized experiments
export const identifyUser = (userId: string, properties?: Record<string, unknown>) => {
  posthog.identify(userId, properties)
}

export const resetUser = () => {
  posthog.reset()
}

export { posthog }

