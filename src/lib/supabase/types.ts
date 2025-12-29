// Database types for Willpowered
// These match the schema defined in supabase/schema.sql

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Subscription status types
export type SubscriptionStatus = 
  | 'free'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'expired'
  | 'paused'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          onboarding_completed: boolean
          onboarding_step: number
          purpose_statement: string | null
          purpose_answers: Json | null
          journey_assessment: Json | null
          focus_step: number | null
          skills_to_learn: Json | null
          principles: Json | null // Principle[]
          principle_reviews: Json | null // WeeklyPrincipleReview[]
          scorecard: Json | null // Scorecard
          timezone: string
          daily_reminder_time: string
          weekly_reflection_day: number
          created_at: string
          updated_at: string
          // Stripe subscription fields
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: SubscriptionStatus
          subscription_period_end: string | null
          subscription_trial_end: string | null
          // Conversation tracking
          monthly_conversations: number
          conversation_reset_date: string | null
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          onboarding_completed?: boolean
          onboarding_step?: number
          purpose_statement?: string | null
          purpose_answers?: Json | null
          journey_assessment?: Json | null
          focus_step?: number | null
          skills_to_learn?: Json | null
          principles?: Json | null
          principle_reviews?: Json | null
          scorecard?: Json | null
          timezone?: string
          daily_reminder_time?: string
          weekly_reflection_day?: number
          created_at?: string
          updated_at?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: SubscriptionStatus
          subscription_period_end?: string | null
          subscription_trial_end?: string | null
          monthly_conversations?: number
          conversation_reset_date?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          onboarding_completed?: boolean
          onboarding_step?: number
          purpose_statement?: string | null
          purpose_answers?: Json | null
          journey_assessment?: Json | null
          focus_step?: number | null
          skills_to_learn?: Json | null
          principles?: Json | null
          principle_reviews?: Json | null
          scorecard?: Json | null
          timezone?: string
          daily_reminder_time?: string
          weekly_reflection_day?: number
          created_at?: string
          updated_at?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: SubscriptionStatus
          subscription_period_end?: string | null
          subscription_trial_end?: string | null
          monthly_conversations?: number
          conversation_reset_date?: string | null
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          success_criteria: string | null
          why_statement: string | null
          target_date: string | null
          started_at: string
          completed_at: string | null
          status: 'active' | 'completed' | 'paused' | 'abandoned'
          is_primary: boolean
          progress_percentage: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          success_criteria?: string | null
          why_statement?: string | null
          target_date?: string | null
          started_at?: string
          completed_at?: string | null
          status?: 'active' | 'completed' | 'paused' | 'abandoned'
          is_primary?: boolean
          progress_percentage?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          success_criteria?: string | null
          why_statement?: string | null
          target_date?: string | null
          started_at?: string
          completed_at?: string | null
          status?: 'active' | 'completed' | 'paused' | 'abandoned'
          is_primary?: boolean
          progress_percentage?: number
          created_at?: string
          updated_at?: string
        }
      }
      milestones: {
        Row: {
          id: string
          goal_id: string
          user_id: string
          title: string
          description: string | null
          order_index: number
          target_date: string | null
          completed_at: string | null
          status: 'pending' | 'in_progress' | 'completed' | 'skipped'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          goal_id: string
          user_id: string
          title: string
          description?: string | null
          order_index: number
          target_date?: string | null
          completed_at?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'skipped'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          goal_id?: string
          user_id?: string
          title?: string
          description?: string | null
          order_index?: number
          target_date?: string | null
          completed_at?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'skipped'
          created_at?: string
          updated_at?: string
        }
      }
      habits: {
        Row: {
          id: string
          user_id: string
          goal_id: string | null
          title: string
          description: string | null
          frequency: 'daily' | 'weekdays' | 'weekends' | 'weekly' | 'custom'
          custom_days: number[] | null
          target_count: number
          journey_step: number | null
          is_active: boolean
          current_streak: number
          longest_streak: number
          last_completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_id?: string | null
          title: string
          description?: string | null
          frequency?: 'daily' | 'weekdays' | 'weekends' | 'weekly' | 'custom'
          custom_days?: number[] | null
          target_count?: number
          journey_step?: number | null
          is_active?: boolean
          current_streak?: number
          longest_streak?: number
          last_completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal_id?: string | null
          title?: string
          description?: string | null
          frequency?: 'daily' | 'weekdays' | 'weekends' | 'weekly' | 'custom'
          custom_days?: number[] | null
          target_count?: number
          journey_step?: number | null
          is_active?: boolean
          current_streak?: number
          longest_streak?: number
          last_completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      habit_completions: {
        Row: {
          id: string
          habit_id: string
          user_id: string
          completed_date: string
          count: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          habit_id: string
          user_id: string
          completed_date: string
          count?: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          habit_id?: string
          user_id?: string
          completed_date?: string
          count?: number
          notes?: string | null
          created_at?: string
        }
      }
      daily_checkins: {
        Row: {
          id: string
          user_id: string
          checkin_date: string
          checkin_type: 'morning' | 'evening'
          energy_level: number | null
          sleep_hours: number | null
          today_focus: string | null
          today_intention: string | null
          mood_level: number | null
          wins: string[] | null
          challenges: string[] | null
          lessons: string | null
          gratitude: string | null
          exercised: boolean
          meditated: boolean
          ate_well: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          checkin_date: string
          checkin_type: 'morning' | 'evening'
          energy_level?: number | null
          sleep_hours?: number | null
          today_focus?: string | null
          today_intention?: string | null
          mood_level?: number | null
          wins?: string[] | null
          challenges?: string[] | null
          lessons?: string | null
          gratitude?: string | null
          exercised?: boolean
          meditated?: boolean
          ate_well?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          checkin_date?: string
          checkin_type?: 'morning' | 'evening'
          energy_level?: number | null
          sleep_hours?: number | null
          today_focus?: string | null
          today_intention?: string | null
          mood_level?: number | null
          wins?: string[] | null
          challenges?: string[] | null
          lessons?: string | null
          gratitude?: string | null
          exercised?: boolean
          meditated?: boolean
          ate_well?: boolean
          created_at?: string
        }
      }
      coach_conversations: {
        Row: {
          id: string
          user_id: string
          title: string | null
          conversation_type: 'general' | 'purpose_discovery' | 'goal_setting' | 'weekly_reflection' | 'setback_recovery' | 'milestone_celebration'
          goal_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          conversation_type?: 'general' | 'purpose_discovery' | 'goal_setting' | 'weekly_reflection' | 'setback_recovery' | 'milestone_celebration'
          goal_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          conversation_type?: 'general' | 'purpose_discovery' | 'goal_setting' | 'weekly_reflection' | 'setback_recovery' | 'milestone_celebration'
          goal_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      coach_messages: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          role: 'user' | 'assistant'
          content: string
          tokens_used: number | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          role: 'user' | 'assistant'
          content: string
          tokens_used?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          role?: 'user' | 'assistant'
          content?: string
          tokens_used?: number | null
          created_at?: string
        }
      }
      content_progress: {
        Row: {
          id: string
          user_id: string
          content_type: 'article' | 'hero_story' | 'willpower_workout'
          content_slug: string
          started_at: string
          completed_at: string | null
          accepted: boolean
        }
        Insert: {
          id?: string
          user_id: string
          content_type: 'article' | 'hero_story' | 'willpower_workout'
          content_slug: string
          started_at?: string
          completed_at?: string | null
          accepted?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          content_type?: 'article' | 'hero_story' | 'willpower_workout'
          content_slug?: string
          started_at?: string
          completed_at?: string | null
          accepted?: boolean
        }
      }
      achievements: {
        Row: {
          id: string
          user_id: string
          achievement_type: string
          achievement_name: string
          description: string | null
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_type: string
          achievement_name: string
          description?: string | null
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_type?: string
          achievement_name?: string
          description?: string | null
          earned_at?: string
        }
      }
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Goal = Database['public']['Tables']['goals']['Row']
export type Milestone = Database['public']['Tables']['milestones']['Row']
export type Habit = Database['public']['Tables']['habits']['Row']
export type HabitCompletion = Database['public']['Tables']['habit_completions']['Row']
export type DailyCheckin = Database['public']['Tables']['daily_checkins']['Row']
export type CoachConversation = Database['public']['Tables']['coach_conversations']['Row']
export type CoachMessage = Database['public']['Tables']['coach_messages']['Row']
export type ContentProgress = Database['public']['Tables']['content_progress']['Row']
export type Achievement = Database['public']['Tables']['achievements']['Row']

// Purpose discovery answers structure
export interface PurposeAnswers {
  loseTrackOfTime: string
  problemsThatAngerYou: string
  whatIfMoneyNoFactor: string
  whoYouAdmire: string
  whatYouLovedAsChild: string
  whatYoudRegretNotAttempting: string
  whatYoudMaster: string
}

// Journey assessment scores
export interface JourneyAssessment {
  purpose: number // 1-100
  skills: number
  habits: number
  grit: number
  setbacks: number
  limits: number
  perseverance: number
}

export interface SkillTask {
  id: string
  title: string
  description?: string
  link?: string
  linkLabel?: string
  status: 'pending' | 'in_progress' | 'completed'
  order: number
  created_at: string
}

export interface SkillToLearn {
  title: string
  description: string
  status: 'to_learn' | 'learning' | 'acquired'
  added_at: string
  tasks?: SkillTask[]
}

// ===== NEW: 3-Step Journey Types =====

// Principles from "Pursuit of Perfection" chapter
export interface Principle {
  id: string
  text: string // The principle itself
  description?: string // Optional elaboration
  whenTested?: string // Situations where this principle will be challenged
  howToHold?: string // What living up to it looks like in practice
  createdAt: string
}

// How well someone responded when a principle was tested
export type PrincipleResponse = 'held' | 'struggled' | 'broke'

// A single reflection on one principle
export interface PrincipleReflectionEntry {
  principleId: string
  wasTested: boolean
  situation?: string // What happened
  response?: PrincipleResponse // How did they respond
  learning?: string // What they learned
}

// Weekly principles review
export interface WeeklyPrincipleReview {
  id: string
  weekOf: string // ISO date of the Monday of that week
  entries: PrincipleReflectionEntry[]
  willsonInsight?: string // AI-generated insight on patterns
  createdAt: string
}

// Aggregated stats for a principle over time
export interface PrincipleStrength {
  principleId: string
  timesTested: number
  timesHeld: number
  timesStruggled: number
  timesBroke: number
  strengthScore: number // 0-100 percentage (held + 0.5*struggled) / tested
  trend: 'improving' | 'stable' | 'declining'
}

// Scorecard metric - a single thing to track
export interface ScorecardMetric {
  id: string
  name: string // e.g., "Workouts", "Sleep hours", "Date nights"
  target: number // Target number (can be edited)
  unit?: string // e.g., "hours", "sessions", "score"
  direction: 'higher' | 'lower' // 'higher' = more is better, 'lower' = less is better
  description?: string // What exactly is being measured
  aggregation: 'average' | 'sum' | 'count' // How to calculate over 7 days
  // 'average' = average of daily values (e.g., sleep score)
  // 'sum' = total of daily values (e.g., hours worked)
  // 'count' = count of days with any value (e.g., workouts done)
}

// Scorecard category - groups related metrics
export interface ScorecardCategory {
  id: string
  name: string // e.g., "Health", "Relationships", "Growth"
  icon?: string // Icon name for display
  metrics: ScorecardMetric[]
}

// Daily tracking data - stores individual day values for each metric
export interface DailyValues {
  [date: string]: number // ISO date -> value for that day
}

// Metric tracking data - all daily values for a metric
export interface MetricHistory {
  [metricId: string]: DailyValues
}

// Saved daily summary from Willson
export interface DailySummary {
  date: string // ISO date
  commentary: {
    dayHighlight: string
    weekInsight: string
    encouragement: string
    tomorrowTip: string
  }
  achievement: { id: string; name: string; emoji: string } | null
  heroQuote: { hero: string; quote: string; context: string }
  stats: { onTrack: number; total: number; percentage: number }
}

// The complete scorecard data
export interface ScorecardData {
  history: MetricHistory // All daily values by metric
  savedSummaries?: { [date: string]: DailySummary } // Saved summaries by date
}

// The complete scorecard
export interface Scorecard {
  vision?: string // 3-5 year vision
  roles?: string[] // Key life roles
  categories: ScorecardCategory[]
  data: ScorecardData // Daily tracking data
}

// Journey step status
export interface JourneyStepStatus {
  step: 'purpose' | 'principles' | 'scorecard'
  isComplete: boolean
  lastUpdated?: string
}

