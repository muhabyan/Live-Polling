-- ============================================
-- Migration 006: Secure RLS - Lock sensitive ops to authenticated hosts
-- 
-- STRATEGY:
--   - Public (anon): SELECT all tables, INSERT participants/responses/reactions
--   - Authenticated host only: INSERT/UPDATE/DELETE events & questions
--                               DELETE participants/responses/reactions
--
-- This does NOT break anything because:
--   - All host operations (create/delete event, kick participant, reset)
--     are performed while logged in (Supabase session active)
--   - Participant operations (join, vote, react) remain fully public
-- ============================================

-- ============================================
-- EVENTS TABLE
-- ============================================
DROP POLICY IF EXISTS "Allow public select events" ON public.events;
DROP POLICY IF EXISTS "Allow public insert events" ON public.events;
DROP POLICY IF EXISTS "Allow public update events" ON public.events;
DROP POLICY IF EXISTS "Allow public delete events" ON public.events;
DROP POLICY IF EXISTS "Allow delete events" ON public.events;

-- Anyone can read events (participants need this to join by room code)
CREATE POLICY "Public can select events"
  ON public.events FOR SELECT USING (true);

-- Only authenticated users (hosts) can create events
CREATE POLICY "Auth users can insert events"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only authenticated users (hosts) can update events (start/end session, timer, etc.)
CREATE POLICY "Auth users can update events"
  ON public.events FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Only authenticated users (hosts) can delete events
CREATE POLICY "Auth users can delete events"
  ON public.events FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- QUESTIONS TABLE
-- ============================================
DROP POLICY IF EXISTS "Allow public select questions" ON public.questions;
DROP POLICY IF EXISTS "Allow public insert questions" ON public.questions;
DROP POLICY IF EXISTS "Allow public update questions" ON public.questions;
DROP POLICY IF EXISTS "Allow public delete questions" ON public.questions;
DROP POLICY IF EXISTS "Allow delete questions" ON public.questions;
DROP POLICY IF EXISTS "Allow manage questions" ON public.questions;

-- Anyone can read questions (participants need this to see the question)
CREATE POLICY "Public can select questions"
  ON public.questions FOR SELECT USING (true);

-- Only authenticated users (hosts) can manage questions
CREATE POLICY "Auth users can insert questions"
  ON public.questions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can update questions"
  ON public.questions FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can delete questions"
  ON public.questions FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- PARTICIPANTS TABLE
-- ============================================
DROP POLICY IF EXISTS "Allow public select participants" ON public.participants;
DROP POLICY IF EXISTS "Allow public insert participants" ON public.participants;
DROP POLICY IF EXISTS "Allow public update participants" ON public.participants;
DROP POLICY IF EXISTS "Allow public delete participants" ON public.participants;
DROP POLICY IF EXISTS "Allow delete participants" ON public.participants;

-- Anyone can read participants (leaderboard is public)
CREATE POLICY "Public can select participants"
  ON public.participants FOR SELECT USING (true);

-- Anyone can join as participant (no login required)
CREATE POLICY "Public can insert participants"
  ON public.participants FOR INSERT
  WITH CHECK (true);

-- Score updates come from host session (authenticated)
CREATE POLICY "Auth users can update participants"
  ON public.participants FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Only authenticated users (hosts) can kick/delete participants
CREATE POLICY "Auth users can delete participants"
  ON public.participants FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- RESPONSES TABLE
-- ============================================
DROP POLICY IF EXISTS "Allow public select responses" ON public.responses;
DROP POLICY IF EXISTS "Allow public insert responses" ON public.responses;
DROP POLICY IF EXISTS "Allow public update responses" ON public.responses;
DROP POLICY IF EXISTS "Allow public delete responses" ON public.responses;
DROP POLICY IF EXISTS "Allow delete responses" ON public.responses;

-- Anyone can read responses (results are shown publicly on projector)
CREATE POLICY "Public can select responses"
  ON public.responses FOR SELECT USING (true);

-- Participants (anon) can submit their response
CREATE POLICY "Public can insert responses"
  ON public.responses FOR INSERT
  WITH CHECK (true);

-- Score/update operations from host (authenticated)
CREATE POLICY "Auth users can update responses"
  ON public.responses FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Only authenticated users (hosts) can delete/reset responses
CREATE POLICY "Auth users can delete responses"
  ON public.responses FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- REACTIONS TABLE
-- ============================================
DROP POLICY IF EXISTS "Allow public select reactions" ON public.reactions;
DROP POLICY IF EXISTS "Allow public insert reactions" ON public.reactions;
DROP POLICY IF EXISTS "Allow public delete reactions" ON public.reactions;
DROP POLICY IF EXISTS "Allow delete reactions" ON public.reactions;

-- Anyone can read reactions (live emoji animations)
CREATE POLICY "Public can select reactions"
  ON public.reactions FOR SELECT USING (true);

-- Participants (anon) can send emoji reactions
CREATE POLICY "Public can insert reactions"
  ON public.reactions FOR INSERT
  WITH CHECK (true);

-- Only authenticated users (hosts) can clear/delete reactions
CREATE POLICY "Auth users can delete reactions"
  ON public.reactions FOR DELETE
  USING (auth.uid() IS NOT NULL);
