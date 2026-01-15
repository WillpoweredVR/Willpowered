/**
 * User Segmentation Module
 * 
 * Queries Supabase to find users matching specific marketing segments.
 * Used by the marketing agent to target email campaigns.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';

// Create admin client for marketing operations (bypasses RLS)
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin credentials');
  }
  
  return createClient<Database>(supabaseUrl, serviceRoleKey);
}

export interface MarketingUser {
  id: string;
  email: string;
  name: string | null;
  lastActive: Date | null;
  createdAt: Date;
  onboardingCompleted: boolean;
}

// ============================================================================
// SEGMENT QUERIES
// ============================================================================

/**
 * Get users who haven't been active for X days
 * "Active" = last daily check-in, habit completion, or profile update
 */
export async function getDormantUsers(daysInactive: number): Promise<MarketingUser[]> {
  const supabase = getAdminClient();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysInactive);
  
  // Get profiles that haven't been updated recently
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, updated_at, created_at, onboarding_completed')
    .lt('updated_at', cutoffDate.toISOString())
    .not('email', 'is', null)
    .order('updated_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching dormant users:', error);
    throw error;
  }
  
  return (profiles || [])
    .filter(p => p.email) // Ensure email exists
    .map(p => ({
      id: p.id,
      email: p.email!,
      name: p.full_name,
      lastActive: p.updated_at ? new Date(p.updated_at) : null,
      createdAt: new Date(p.created_at),
      onboardingCompleted: p.onboarding_completed,
    }));
}

/**
 * Get users who signed up in a specific month
 * Great for resolution season targeting
 */
export async function getUsersBySignupMonth(
  month: number, // 0-11
  year: number
): Promise<MarketingUser[]> {
  const supabase = getAdminClient();
  
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0); // Last day of month
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, updated_at, created_at, onboarding_completed')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .not('email', 'is', null);
  
  if (error) {
    console.error('Error fetching users by signup month:', error);
    throw error;
  }
  
  return (profiles || [])
    .filter(p => p.email)
    .map(p => ({
      id: p.id,
      email: p.email!,
      name: p.full_name,
      lastActive: p.updated_at ? new Date(p.updated_at) : null,
      createdAt: new Date(p.created_at),
      onboardingCompleted: p.onboarding_completed,
    }));
}

/**
 * Get users who started onboarding but didn't complete
 */
export async function getAbandonedOnboardingUsers(): Promise<MarketingUser[]> {
  const supabase = getAdminClient();
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, updated_at, created_at, onboarding_completed, onboarding_step')
    .eq('onboarding_completed', false)
    .gt('onboarding_step', 0) // Started but didn't finish
    .not('email', 'is', null);
  
  if (error) {
    console.error('Error fetching abandoned onboarding users:', error);
    throw error;
  }
  
  return (profiles || [])
    .filter(p => p.email)
    .map(p => ({
      id: p.id,
      email: p.email!,
      name: p.full_name,
      lastActive: p.updated_at ? new Date(p.updated_at) : null,
      createdAt: new Date(p.created_at),
      onboardingCompleted: p.onboarding_completed,
    }));
}

/**
 * Get all active users (for announcements, etc.)
 */
export async function getAllActiveUsers(): Promise<MarketingUser[]> {
  const supabase = getAdminClient();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, updated_at, created_at, onboarding_completed')
    .gte('updated_at', thirtyDaysAgo.toISOString())
    .not('email', 'is', null);
  
  if (error) {
    console.error('Error fetching active users:', error);
    throw error;
  }
  
  return (profiles || [])
    .filter(p => p.email)
    .map(p => ({
      id: p.id,
      email: p.email!,
      name: p.full_name,
      lastActive: p.updated_at ? new Date(p.updated_at) : null,
      createdAt: new Date(p.created_at),
      onboardingCompleted: p.onboarding_completed,
    }));
}

// ============================================================================
// SEGMENT DEFINITIONS
// ============================================================================

export type SegmentType = 
  | 'dormant_7_days'
  | 'dormant_14_days'
  | 'dormant_30_days'
  | 'dormant_users'  // Alias
  | 'january_signups'
  | 'abandoned_onboarding'
  | 'all_active'
  | 'inactive_14_days'  // Alias
  | 'inactive_users';   // Alias

// Normalize segment names to handle variations
function normalizeSegment(segment: string): string {
  const aliases: Record<string, string> = {
    'dormant_users': 'dormant_14_days',
    'inactive_users': 'dormant_14_days',
    'inactive_14_days': 'dormant_14_days',
    'dormant': 'dormant_14_days',
    'inactive': 'dormant_14_days',
    'january': 'january_signups',
    'jan_signups': 'january_signups',
    'abandoned': 'abandoned_onboarding',
    'active': 'all_active',
  };
  
  return aliases[segment.toLowerCase()] || segment;
}

export async function getUsersForSegment(segment: SegmentType | string): Promise<MarketingUser[]> {
  const currentYear = new Date().getFullYear();
  const normalizedSegment = normalizeSegment(segment);
  
  switch (normalizedSegment) {
    case 'dormant_7_days':
      return getDormantUsers(7);
    case 'dormant_14_days':
      return getDormantUsers(14);
    case 'dormant_30_days':
      return getDormantUsers(30);
    case 'january_signups':
      return getUsersBySignupMonth(0, currentYear); // January = 0
    case 'abandoned_onboarding':
      return getAbandonedOnboardingUsers();
    case 'all_active':
      return getAllActiveUsers();
    default:
      // Default to dormant 14 days for any "dormant" or "inactive" variation
      if (segment.toLowerCase().includes('dormant') || segment.toLowerCase().includes('inactive')) {
        console.log(`[Segments] Treating unknown segment "${segment}" as dormant_14_days`);
        return getDormantUsers(14);
      }
      throw new Error(`Unknown segment: ${segment}. Valid segments: dormant_7_days, dormant_14_days, dormant_30_days, january_signups, abandoned_onboarding, all_active`);
  }
}

/**
 * Get segment size without fetching all users (for previews)
 */
export async function getSegmentSize(segment: SegmentType | string): Promise<number> {
  const users = await getUsersForSegment(segment);
  return users.length;
}
