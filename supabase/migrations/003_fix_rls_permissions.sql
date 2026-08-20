-- ============================================
-- Ensure full access for Live Polling operations
-- Run this in Supabase SQL Editor
-- ============================================

-- Events: Allow all read, insert, update, delete
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON public.events;
DROP POLICY IF EXISTS "Organizers can update their own events" ON public.events;
DROP POLICY IF EXISTS "Organizers can delete their own events" ON public.events;

CREATE POLICY "Allow public select events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Allow public insert events" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update events" ON public.events FOR UPDATE USING (true);
CREATE POLICY "Allow public delete events" ON public.events FOR DELETE USING (true);

-- Questions: Allow all operations
DROP POLICY IF EXISTS "Questions are viewable by everyone" ON public.questions;
DROP POLICY IF EXISTS "Organizers can manage questions" ON public.questions;

CREATE POLICY "Allow public select questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Allow public insert questions" ON public.questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update questions" ON public.questions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete questions" ON public.questions FOR DELETE USING (true);

-- Participants: Allow all operations
DROP POLICY IF EXISTS "Participants are viewable by everyone" ON public.participants;
DROP POLICY IF EXISTS "Anyone can join as participant" ON public.participants;
DROP POLICY IF EXISTS "Participants can be updated" ON public.participants;

CREATE POLICY "Allow public select participants" ON public.participants FOR SELECT USING (true);
CREATE POLICY "Allow public insert participants" ON public.participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update participants" ON public.participants FOR UPDATE USING (true);

-- Responses: Allow all operations
DROP POLICY IF EXISTS "Responses are viewable by everyone" ON public.responses;
DROP POLICY IF EXISTS "Participants can submit responses" ON public.responses;
DROP POLICY IF EXISTS "Responses can be updated" ON public.responses;
DROP POLICY IF EXISTS "Responses can be deleted" ON public.responses;

CREATE POLICY "Allow public select responses" ON public.responses FOR SELECT USING (true);
CREATE POLICY "Allow public insert responses" ON public.responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update responses" ON public.responses FOR UPDATE USING (true);
CREATE POLICY "Allow public delete responses" ON public.responses FOR DELETE USING (true);

-- Reactions: Allow all operations
DROP POLICY IF EXISTS "Reactions are viewable by everyone" ON public.reactions;
DROP POLICY IF EXISTS "Anyone can send reactions" ON public.reactions;

CREATE POLICY "Allow public select reactions" ON public.reactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert reactions" ON public.reactions FOR INSERT WITH CHECK (true);
