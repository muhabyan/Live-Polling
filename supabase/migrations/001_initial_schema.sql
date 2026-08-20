-- ============================================
-- PulseLive Database Schema
-- Supabase PostgreSQL Migration
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. EVENTS TABLE
-- ============================================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'General Session',
  organizer_name TEXT DEFAULT 'Moderator',
  organizer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('draft', 'waiting', 'live', 'paused', 'ended')),
  current_question_index INTEGER DEFAULT 0,
  question_started_at TIMESTAMPTZ,
  timer_remaining_seconds INTEGER DEFAULT 45,
  is_timer_running BOOLEAN DEFAULT FALSE,
  show_results_on_projector BOOLEAN DEFAULT TRUE,
  is_voting_locked BOOLEAN DEFAULT FALSE,
  reveal_answer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_room_code ON public.events(room_code);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_organizer ON public.events(organizer_id);

-- ============================================
-- 2. QUESTIONS TABLE
-- ============================================
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'open_text', 'rating', 'word_cloud', 'true_false')),
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  timer_seconds INTEGER DEFAULT 45,
  points INTEGER DEFAULT 0,
  options JSONB DEFAULT '[]'::jsonb,
  rating_min INTEGER DEFAULT 1,
  rating_max INTEGER DEFAULT 5,
  rating_min_label TEXT DEFAULT 'Low',
  rating_max_label TEXT DEFAULT 'High',
  max_word_count INTEGER DEFAULT 2,
  allow_multiple BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questions_event ON public.questions(event_id);
CREATE INDEX idx_questions_sort ON public.questions(event_id, sort_order);

-- ============================================
-- 3. PARTICIPANTS TABLE
-- ============================================
CREATE TABLE public.participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_bg TEXT DEFAULT '#2563EB',
  avatar_emoji TEXT DEFAULT '👋',
  score INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_participants_event ON public.participants(event_id);

-- ============================================
-- 4. RESPONSES TABLE
-- ============================================
CREATE TABLE public.responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  participant_name TEXT NOT NULL,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option_ids JSONB DEFAULT '[]'::jsonb,
  text_response TEXT,
  rating_value INTEGER,
  time_taken_seconds INTEGER DEFAULT 0,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_responses_event ON public.responses(event_id);
CREATE INDEX idx_responses_question ON public.responses(question_id);
CREATE INDEX idx_responses_participant ON public.responses(participant_id);
CREATE UNIQUE INDEX idx_responses_unique_answer ON public.responses(participant_id, question_id);

-- ============================================
-- 5. REACTIONS TABLE
-- ============================================
CREATE TABLE public.reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  sender_name TEXT DEFAULT 'Audience',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reactions_event ON public.reactions(event_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- EVENTS: Anyone can read, only authenticated users can create/update/delete their own
CREATE POLICY "Events are viewable by everyone"
  ON public.events FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create events"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update their own events"
  ON public.events FOR UPDATE
  USING (auth.uid() = organizer_id OR organizer_id IS NULL);

CREATE POLICY "Organizers can delete their own events"
  ON public.events FOR DELETE
  USING (auth.uid() = organizer_id OR organizer_id IS NULL);

-- QUESTIONS: Anyone can read, only event organizer can modify
CREATE POLICY "Questions are viewable by everyone"
  ON public.questions FOR SELECT USING (true);

CREATE POLICY "Organizers can manage questions"
  ON public.questions FOR ALL
  USING (true);

-- PARTICIPANTS: Anyone can read and join (insert)
CREATE POLICY "Participants are viewable by everyone"
  ON public.participants FOR SELECT USING (true);

CREATE POLICY "Anyone can join as participant"
  ON public.participants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Participants can be updated"
  ON public.participants FOR UPDATE USING (true);

-- RESPONSES: Anyone can read, participants can insert
CREATE POLICY "Responses are viewable by everyone"
  ON public.responses FOR SELECT USING (true);

CREATE POLICY "Participants can submit responses"
  ON public.responses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Responses can be updated"
  ON public.responses FOR UPDATE USING (true);

CREATE POLICY "Responses can be deleted"
  ON public.responses FOR DELETE USING (true);

-- REACTIONS: Anyone can read and send
CREATE POLICY "Reactions are viewable by everyone"
  ON public.reactions FOR SELECT USING (true);

CREATE POLICY "Anyone can send reactions"
  ON public.reactions FOR INSERT
  WITH CHECK (true);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
