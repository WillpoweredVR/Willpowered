'use client'

import { useEffect, useState } from 'react'
import { posthog } from '@/lib/posthog'

type FlagValue = boolean | string | undefined

export function useFeatureFlag(flagKey: string): FlagValue {
  const [value, setValue] = useState<FlagValue>(undefined)

  useEffect(() => {
    // Get initial value
    const initialValue = posthog.getFeatureFlag(flagKey)
    setValue(initialValue)

    // Listen for flag changes
    const handleFlagsLoaded = () => {
      const newValue = posthog.getFeatureFlag(flagKey)
      setValue(newValue)
    }

    posthog.onFeatureFlags(handleFlagsLoaded)
  }, [flagKey])

  return value
}

// Hook for multivariate flags with payload
export function useFeatureFlagWithPayload<T = unknown>(flagKey: string): {
  value: FlagValue
  payload: T | undefined
} {
  const [value, setValue] = useState<FlagValue>(undefined)
  const [payload, setPayload] = useState<T | undefined>(undefined)

  useEffect(() => {
    const updateFlag = () => {
      const newValue = posthog.getFeatureFlag(flagKey)
      const newPayload = posthog.getFeatureFlagPayload(flagKey) as T | undefined
      setValue(newValue)
      setPayload(newPayload)
    }

    updateFlag()
    posthog.onFeatureFlags(updateFlag)
  }, [flagKey])

  return { value, payload }
}

// Pre-defined experiment hooks for Willpowered
export function useHeroVariant(): 'control' | 'discipline' | 'coach' | undefined {
  const value = useFeatureFlag('hero-headline-test')
  return value as 'control' | 'discipline' | 'coach' | undefined
}

export function useCtaVariant(): 'control' | 'meet-coach' | 'start-journey' | undefined {
  const value = useFeatureFlag('cta-button-test')
  return value as 'control' | 'meet-coach' | 'start-journey' | undefined
}

export function useOnboardingVariant(): 'full' | 'minimal' | undefined {
  const value = useFeatureFlag('onboarding-length-test')
  return value as 'full' | 'minimal' | undefined
}


