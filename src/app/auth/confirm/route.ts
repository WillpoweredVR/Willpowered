import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// This route handles Supabase's default email confirmation redirect
// It verifies the token and redirects to the main callback handler

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') || '/auth/callback'

  if (token_hash && type) {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'signup' | 'recovery' | 'invite' | 'magiclink' | 'email',
    })

    if (!error) {
      // Successfully verified - redirect to callback to handle user routing
      return NextResponse.redirect(`${origin}/auth/callback`)
    }
    
    console.error('Email confirmation error:', error)
  }

  // Redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}

