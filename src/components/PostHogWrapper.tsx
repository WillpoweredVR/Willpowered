'use client'

import { Suspense } from 'react'
import { PostHogProvider } from './PostHogProvider'

// Wrapper to handle Suspense boundary for useSearchParams
export function PostHogWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <PostHogProvider>{children}</PostHogProvider>
    </Suspense>
  )
}

