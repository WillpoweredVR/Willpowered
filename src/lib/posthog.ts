import posthog from 'posthog-js'

// Initialize PostHog only on client side
export const initPostHog = () => {
  if (typeof window !== 'undefined' && !posthog.__loaded) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      person_profiles: 'identified_only',
      capture_pageview: false, // We'll handle this manually for SPA
      capture_pageleave: true,
      // Enable session recording
      disable_session_recording: false,
      // Capture performance metrics
      capture_performance: true,
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
// PAGE & SESSION TRACKING
// ============================================

export const trackPageView = (url?: string) => {
  posthog.capture('$pageview', {
    $current_url: url || window.location.href,
  })
}

export const trackScrollDepth = (depth: number, page: string) => {
  posthog.capture('scroll_depth', {
    depth_percent: depth,
    page,
  })
}

export const trackTimeOnPage = (seconds: number, page: string) => {
  posthog.capture('time_on_page', {
    seconds,
    page,
  })
}

// ============================================
// ACQUISITION & CONVERSION FUNNEL
// ============================================

export const trackSignupStarted = (source: string) => {
  posthog.capture('signup_started', {
    source, // 'hero_cta', 'nav_button', 'footer_cta', 'article_cta', 'pricing_page'
  })
}

export const trackSignupFormEngaged = (field: string) => {
  posthog.capture('signup_form_engaged', {
    field, // 'email', 'password', 'name'
  })
}

export const trackSignupMethodSelected = (method: 'email' | 'google') => {
  posthog.capture('signup_method_selected', {
    method,
  })
}

export const trackSignupCompleted = (method: 'email' | 'google') => {
  posthog.capture('signup_completed', {
    method,
  })
}

export const trackSignupError = (error: string, method: 'email' | 'google') => {
  posthog.capture('signup_error', {
    error,
    method,
  })
}

export const trackLoginStarted = (source: string) => {
  posthog.capture('login_started', {
    source,
  })
}

export const trackLoginCompleted = (method: 'email' | 'google') => {
  posthog.capture('login_completed', {
    method,
  })
}

export const trackLoginError = (error: string) => {
  posthog.capture('login_error', {
    error,
  })
}

export const trackEmailVerified = () => {
  posthog.capture('email_verified')
}

export const trackPasswordResetRequested = () => {
  posthog.capture('password_reset_requested')
}

// ============================================
// ONBOARDING FUNNEL
// ============================================

export const trackOnboardingStarted = () => {
  posthog.capture('onboarding_started')
}

export const trackOnboardingStep = (step: number, stepName: string, data?: Record<string, unknown>) => {
  posthog.capture('onboarding_step', {
    step,
    step_name: stepName,
    ...data,
  })
}

export const trackOnboardingStepSkipped = (step: number, stepName: string) => {
  posthog.capture('onboarding_step_skipped', {
    step,
    step_name: stepName,
  })
}

export const trackOnboardingCompleted = (totalSteps: number, timeSpentSeconds: number) => {
  posthog.capture('onboarding_completed', {
    total_steps: totalSteps,
    time_spent_seconds: timeSpentSeconds,
  })
}

export const trackOnboardingAbandoned = (lastStep: number, stepName: string) => {
  posthog.capture('onboarding_abandoned', {
    last_step: lastStep,
    step_name: stepName,
  })
}

// ============================================
// DASHBOARD & CORE PRODUCT
// ============================================

export const trackDashboardViewed = (hasGoal: boolean, hasMetrics: boolean, dayStreak: number) => {
  posthog.capture('dashboard_viewed', {
    has_goal: hasGoal,
    has_metrics: hasMetrics,
    day_streak: dayStreak,
  })
}

export const trackGoalCreated = (goalType?: string) => {
  posthog.capture('goal_created', {
    goal_type: goalType,
  })
}

export const trackGoalUpdated = (field: string) => {
  posthog.capture('goal_updated', {
    field, // 'purpose', 'principles', 'metrics'
  })
}

export const trackMetricAdded = (metricName: string, category: string) => {
  posthog.capture('metric_added', {
    metric_name: metricName,
    category,
  })
}

export const trackCheckinStarted = () => {
  posthog.capture('checkin_started')
}

export const trackCheckinCompleted = (metricsLogged: number, dayStreak: number) => {
  posthog.capture('checkin_completed', {
    metrics_logged: metricsLogged,
    day_streak: dayStreak,
  })
}

export const trackFirstCheckin = () => {
  posthog.capture('first_checkin')
}

export const trackStreakMilestone = (streak: number) => {
  posthog.capture('streak_milestone', {
    streak_days: streak,
  })
}

// ============================================
// AI COACH ENGAGEMENT
// ============================================

export const trackChatStarted = (source: string, context?: string) => {
  posthog.capture('chat_started', {
    source, // 'floating_button', 'hero_cta', 'article_cta', 'dashboard', 'onboarding'
    context, // optional: what prompted the chat
  })
}

export const trackChatMessage = (messageCount: number, isFirstMessage: boolean) => {
  posthog.capture('chat_message_sent', {
    message_count: messageCount,
    is_first_message: isFirstMessage,
  })
}

export const trackChatResponseReceived = (responseTimeMs: number) => {
  posthog.capture('chat_response_received', {
    response_time_ms: responseTimeMs,
  })
}

export const trackChatEnded = (messageCount: number, durationSeconds: number) => {
  posthog.capture('chat_ended', {
    message_count: messageCount,
    duration_seconds: durationSeconds,
  })
}

export const trackChatTopicSelected = (topic: string) => {
  posthog.capture('chat_topic_selected', {
    topic, // suggested prompt clicked
  })
}

// ============================================
// CONTENT ENGAGEMENT
// ============================================

export const trackArticleViewed = (slug: string, title: string, category?: string) => {
  posthog.capture('article_viewed', {
    slug,
    title,
    category,
  })
}

export const trackArticleScrolled = (slug: string, scrollPercent: number) => {
  // Only track at 25%, 50%, 75%, 100%
  posthog.capture('article_scrolled', {
    slug,
    scroll_percent: scrollPercent,
  })
}

export const trackArticleCompleted = (slug: string, title: string, readTimeSeconds: number) => {
  posthog.capture('article_completed', {
    slug,
    title,
    read_time_seconds: readTimeSeconds,
  })
}

export const trackArticleCTAClicked = (slug: string, ctaType: string) => {
  posthog.capture('article_cta_clicked', {
    slug,
    cta_type: ctaType, // 'signup', 'chat', 'related_article'
  })
}

export const trackBookLinkClicked = (bookTitle: string, platform: string) => {
  posthog.capture('book_link_clicked', {
    book_title: bookTitle,
    platform, // 'amazon', 'audible', 'kindle'
  })
}

// ============================================
// SUBSCRIPTION & MONETIZATION
// ============================================

export const trackPricingViewed = (source: string) => {
  posthog.capture('pricing_viewed', {
    source, // 'nav', 'upgrade_modal', 'usage_limit'
  })
}

export const trackPlanSelected = (plan: string, price: number, interval: 'month' | 'year') => {
  posthog.capture('plan_selected', {
    plan,
    price,
    interval,
  })
}

export const trackCheckoutStarted = (plan: string) => {
  posthog.capture('checkout_started', {
    plan,
  })
}

export const trackSubscriptionStarted = (plan: string, price: number, interval: 'month' | 'year') => {
  posthog.capture('subscription_started', {
    plan,
    price,
    interval,
  })
}

export const trackSubscriptionCancelled = (plan: string, reason?: string) => {
  posthog.capture('subscription_cancelled', {
    plan,
    reason,
  })
}

export const trackTrialStarted = () => {
  posthog.capture('trial_started')
}

export const trackTrialEnded = (converted: boolean) => {
  posthog.capture('trial_ended', {
    converted,
  })
}

export const trackUsageLimitHit = (limitType: string, currentUsage: number, limit: number) => {
  posthog.capture('usage_limit_hit', {
    limit_type: limitType,
    current_usage: currentUsage,
    limit,
  })
}

// ============================================
// UI INTERACTIONS
// ============================================

export const trackCTAClicked = (ctaId: string, ctaText: string, location: string) => {
  posthog.capture('cta_clicked', {
    cta_id: ctaId,
    cta_text: ctaText,
    location, // 'hero', 'mid_page', 'footer', 'article', 'modal'
  })
}

export const trackNavClicked = (item: string) => {
  posthog.capture('nav_clicked', {
    item,
  })
}

export const trackModalOpened = (modalType: string) => {
  posthog.capture('modal_opened', {
    modal_type: modalType,
  })
}

export const trackModalClosed = (modalType: string, action: 'completed' | 'dismissed') => {
  posthog.capture('modal_closed', {
    modal_type: modalType,
    action,
  })
}

export const trackExternalLinkClicked = (url: string, linkText: string) => {
  posthog.capture('external_link_clicked', {
    url,
    link_text: linkText,
  })
}

export const trackSocialShareClicked = (platform: string, contentType: string) => {
  posthog.capture('social_share_clicked', {
    platform,
    content_type: contentType,
  })
}

// ============================================
// ERROR & SUPPORT
// ============================================

export const trackError = (errorType: string, errorMessage: string, page: string) => {
  posthog.capture('error_occurred', {
    error_type: errorType,
    error_message: errorMessage,
    page,
  })
}

export const trackSupportRequested = (source: string) => {
  posthog.capture('support_requested', {
    source,
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

// ============================================
// USER IDENTIFICATION
// ============================================

export const identifyUser = (userId: string, properties?: Record<string, unknown>) => {
  posthog.identify(userId, properties)
}

export const setUserProperties = (properties: Record<string, unknown>) => {
  posthog.people.set(properties)
}

export const incrementUserProperty = (property: string, value: number = 1) => {
  posthog.people.increment(property, value)
}

export const resetUser = () => {
  posthog.reset()
}

// ============================================
// REVENUE TRACKING
// ============================================

export const trackRevenue = (amount: number, currency: string = 'USD', plan?: string) => {
  posthog.capture('revenue', {
    amount,
    currency,
    plan,
  })
}

export { posthog }

