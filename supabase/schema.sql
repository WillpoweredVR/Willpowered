-- Willpowered Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  
  -- Onboarding status
  onboarding_completed boolean default false,
  onboarding_step integer default 0,
  
  -- Purpose Discovery (Step 1 of onboarding)
  purpose_statement text,
  purpose_answers jsonb, -- Stores answers to the 7 purpose questions
  
  -- Journey Assessment
  journey_assessment jsonb, -- Stores scores for each of the 7 steps
  focus_step integer, -- Which step they should focus on (1-7)
  
  -- Preferences
  timezone text default 'America/New_York',
  daily_reminder_time time default '09:00',
  weekly_reflection_day integer default 0, -- 0 = Sunday
  
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- GOALS (User's main quests)
-- ============================================================================
create table public.goals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  
  -- Goal definition
  title text not null,
  description text,
  success_criteria text, -- What does success look like?
  why_statement text, -- Connection to purpose
  
  -- Timeline
  target_date date,
  started_at timestamptz default now(),
  completed_at timestamptz,
  
  -- Status
  status text default 'active' check (status in ('active', 'completed', 'paused', 'abandoned')),
  is_primary boolean default false, -- The main goal they're focused on
  
  -- Progress
  progress_percentage integer default 0,
  
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- MILESTONES (Checkpoints within goals)
-- ============================================================================
create table public.milestones (
  id uuid default uuid_generate_v4() primary key,
  goal_id uuid references public.goals on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  
  title text not null,
  description text,
  order_index integer not null,
  
  target_date date,
  completed_at timestamptz,
  
  status text default 'pending' check (status in ('pending', 'in_progress', 'completed', 'skipped')),
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- HABITS (Daily/recurring actions)
-- ============================================================================
create table public.habits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  goal_id uuid references public.goals on delete set null, -- Optional link to a goal
  
  title text not null,
  description text,
  
  -- Frequency
  frequency text default 'daily' check (frequency in ('daily', 'weekdays', 'weekends', 'weekly', 'custom')),
  custom_days integer[], -- For custom frequency: [0,1,2,3,4,5,6] where 0=Sunday
  
  -- Tracking
  target_count integer default 1, -- How many times per day/week
  
  -- Willpower category (maps to the 7 steps)
  journey_step integer, -- 1-7, which step this habit supports
  
  -- Status
  is_active boolean default true,
  
  -- Streaks (denormalized for performance)
  current_streak integer default 0,
  longest_streak integer default 0,
  last_completed_at timestamptz,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- HABIT_COMPLETIONS (Daily check-ins)
-- ============================================================================
create table public.habit_completions (
  id uuid default uuid_generate_v4() primary key,
  habit_id uuid references public.habits on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  
  completed_date date not null,
  count integer default 1, -- How many times completed that day
  
  notes text,
  
  created_at timestamptz default now(),
  
  unique(habit_id, completed_date)
);

-- ============================================================================
-- DAILY_CHECKINS (Morning/Evening reflections)
-- ============================================================================
create table public.daily_checkins (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  
  checkin_date date not null,
  checkin_type text not null check (checkin_type in ('morning', 'evening')),
  
  -- Morning check-in
  energy_level integer check (energy_level between 1 and 5),
  sleep_hours numeric(3,1),
  today_focus text,
  today_intention text,
  
  -- Evening check-in
  mood_level integer check (mood_level between 1 and 5),
  wins text[], -- What went well
  challenges text[], -- What was hard
  lessons text, -- What did you learn
  gratitude text,
  
  -- Willpower fuel tracking
  exercised boolean default false,
  meditated boolean default false,
  ate_well boolean default false,
  
  created_at timestamptz default now(),
  
  unique(user_id, checkin_date, checkin_type)
);

-- ============================================================================
-- COACH_CONVERSATIONS (AI chat history with context)
-- ============================================================================
create table public.coach_conversations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  
  title text, -- Optional title for the conversation
  conversation_type text default 'general' check (conversation_type in (
    'general', 
    'purpose_discovery', 
    'goal_setting', 
    'weekly_reflection', 
    'setback_recovery',
    'milestone_celebration'
  )),
  
  -- Related entities
  goal_id uuid references public.goals on delete set null,
  
  -- Status
  is_active boolean default true,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- COACH_MESSAGES (Individual messages in conversations)
-- ============================================================================
create table public.coach_messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.coach_conversations on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  
  -- Metadata
  tokens_used integer,
  
  created_at timestamptz default now()
);

-- ============================================================================
-- CONTENT_PROGRESS (Track articles read, etc.)
-- ============================================================================
create table public.content_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  
  content_type text not null check (content_type in ('article', 'hero_story', 'willpower_workout')),
  content_slug text not null,
  
  started_at timestamptz default now(),
  completed_at timestamptz,
  
  -- For workouts
  accepted boolean default false,
  
  unique(user_id, content_type, content_slug)
);

-- ============================================================================
-- ACHIEVEMENTS (Badges and milestones)
-- ============================================================================
create table public.achievements (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  
  achievement_type text not null,
  achievement_name text not null,
  description text,
  
  earned_at timestamptz default now(),
  
  unique(user_id, achievement_type)
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.milestones enable row level security;
alter table public.habits enable row level security;
alter table public.habit_completions enable row level security;
alter table public.daily_checkins enable row level security;
alter table public.coach_conversations enable row level security;
alter table public.coach_messages enable row level security;
alter table public.content_progress enable row level security;
alter table public.achievements enable row level security;

-- Profiles: Users can only read/update their own profile
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Goals: Users can only access their own goals
create policy "Users can view own goals" on public.goals for select using (auth.uid() = user_id);
create policy "Users can insert own goals" on public.goals for insert with check (auth.uid() = user_id);
create policy "Users can update own goals" on public.goals for update using (auth.uid() = user_id);
create policy "Users can delete own goals" on public.goals for delete using (auth.uid() = user_id);

-- Milestones: Users can only access their own milestones
create policy "Users can view own milestones" on public.milestones for select using (auth.uid() = user_id);
create policy "Users can insert own milestones" on public.milestones for insert with check (auth.uid() = user_id);
create policy "Users can update own milestones" on public.milestones for update using (auth.uid() = user_id);
create policy "Users can delete own milestones" on public.milestones for delete using (auth.uid() = user_id);

-- Habits: Users can only access their own habits
create policy "Users can view own habits" on public.habits for select using (auth.uid() = user_id);
create policy "Users can insert own habits" on public.habits for insert with check (auth.uid() = user_id);
create policy "Users can update own habits" on public.habits for update using (auth.uid() = user_id);
create policy "Users can delete own habits" on public.habits for delete using (auth.uid() = user_id);

-- Habit completions: Users can only access their own
create policy "Users can view own habit_completions" on public.habit_completions for select using (auth.uid() = user_id);
create policy "Users can insert own habit_completions" on public.habit_completions for insert with check (auth.uid() = user_id);
create policy "Users can update own habit_completions" on public.habit_completions for update using (auth.uid() = user_id);
create policy "Users can delete own habit_completions" on public.habit_completions for delete using (auth.uid() = user_id);

-- Daily checkins: Users can only access their own
create policy "Users can view own daily_checkins" on public.daily_checkins for select using (auth.uid() = user_id);
create policy "Users can insert own daily_checkins" on public.daily_checkins for insert with check (auth.uid() = user_id);
create policy "Users can update own daily_checkins" on public.daily_checkins for update using (auth.uid() = user_id);

-- Coach conversations: Users can only access their own
create policy "Users can view own conversations" on public.coach_conversations for select using (auth.uid() = user_id);
create policy "Users can insert own conversations" on public.coach_conversations for insert with check (auth.uid() = user_id);
create policy "Users can update own conversations" on public.coach_conversations for update using (auth.uid() = user_id);

-- Coach messages: Users can only access their own
create policy "Users can view own messages" on public.coach_messages for select using (auth.uid() = user_id);
create policy "Users can insert own messages" on public.coach_messages for insert with check (auth.uid() = user_id);

-- Content progress: Users can only access their own
create policy "Users can view own content_progress" on public.content_progress for select using (auth.uid() = user_id);
create policy "Users can insert own content_progress" on public.content_progress for insert with check (auth.uid() = user_id);
create policy "Users can update own content_progress" on public.content_progress for update using (auth.uid() = user_id);

-- Achievements: Users can only access their own
create policy "Users can view own achievements" on public.achievements for select using (auth.uid() = user_id);
create policy "Users can insert own achievements" on public.achievements for insert with check (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();
  
create trigger goals_updated_at before update on public.goals
  for each row execute procedure public.handle_updated_at();
  
create trigger milestones_updated_at before update on public.milestones
  for each row execute procedure public.handle_updated_at();
  
create trigger habits_updated_at before update on public.habits
  for each row execute procedure public.handle_updated_at();
  
create trigger coach_conversations_updated_at before update on public.coach_conversations
  for each row execute procedure public.handle_updated_at();

-- ============================================================================
-- INDEXES
-- ============================================================================

create index idx_goals_user_id on public.goals(user_id);
create index idx_goals_status on public.goals(status);
create index idx_habits_user_id on public.habits(user_id);
create index idx_habit_completions_habit_id on public.habit_completions(habit_id);
create index idx_habit_completions_date on public.habit_completions(completed_date);
create index idx_daily_checkins_user_date on public.daily_checkins(user_id, checkin_date);
create index idx_coach_messages_conversation on public.coach_messages(conversation_id);
create index idx_content_progress_user on public.content_progress(user_id);





