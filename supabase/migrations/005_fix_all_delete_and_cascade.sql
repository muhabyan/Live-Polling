-- ============================================
-- Migration 005: Full Cascade & Public Delete Policies
-- Run this in Supabase SQL Editor to allow all delete actions
-- ============================================

-- 1. Ensure foreign key cascades exist on all tables
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_event_id_fkey;
ALTER TABLE public.questions 
  ADD CONSTRAINT questions_event_id_fkey 
  FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

ALTER TABLE public.participants DROP CONSTRAINT IF EXISTS participants_event_id_fkey;
ALTER TABLE public.participants 
  ADD CONSTRAINT participants_event_id_fkey 
  FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

ALTER TABLE public.responses DROP CONSTRAINT IF EXISTS responses_event_id_fkey;
ALTER TABLE public.responses 
  ADD CONSTRAINT responses_event_id_fkey 
  FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

ALTER TABLE public.responses DROP CONSTRAINT IF EXISTS responses_participant_id_fkey;
ALTER TABLE public.responses 
  ADD CONSTRAINT responses_participant_id_fkey 
  FOREIGN KEY (participant_id) REFERENCES public.participants(id) ON DELETE CASCADE;

ALTER TABLE public.responses DROP CONSTRAINT IF EXISTS responses_question_id_fkey;
ALTER TABLE public.responses 
  ADD CONSTRAINT responses_question_id_fkey 
  FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;

ALTER TABLE public.reactions DROP CONSTRAINT IF EXISTS reactions_event_id_fkey;
ALTER TABLE public.reactions 
  ADD CONSTRAINT reactions_event_id_fkey 
  FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

-- 2. Drop any restrictive delete policies and add permissive delete policies
DROP POLICY IF EXISTS "Allow delete events" ON public.events;
DROP POLICY IF EXISTS "Organizers can delete their own events" ON public.events;
CREATE POLICY "Allow delete events" ON public.events FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow delete questions" ON public.questions;
DROP POLICY IF EXISTS "Organizers can manage questions" ON public.questions;
CREATE POLICY "Allow delete questions" ON public.questions FOR DELETE USING (true);
CREATE POLICY "Allow manage questions" ON public.questions FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow delete participants" ON public.participants;
DROP POLICY IF EXISTS "Allow public delete participants" ON public.participants;
CREATE POLICY "Allow delete participants" ON public.participants FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow delete responses" ON public.responses;
DROP POLICY IF EXISTS "Responses can be deleted" ON public.responses;
CREATE POLICY "Allow delete responses" ON public.responses FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow delete reactions" ON public.reactions;
DROP POLICY IF EXISTS "Allow public delete reactions" ON public.reactions;
CREATE POLICY "Allow delete reactions" ON public.reactions FOR DELETE USING (true);
