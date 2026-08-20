-- ============================================
-- Add Missing DELETE policies for participants & reactions
-- Run this in Supabase SQL Editor (1-click)
-- ============================================

DROP POLICY IF EXISTS "Allow public delete participants" ON public.participants;
CREATE POLICY "Allow public delete participants" ON public.participants FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public delete reactions" ON public.reactions;
CREATE POLICY "Allow public delete reactions" ON public.reactions FOR DELETE USING (true);

-- Also ensure all tables have RLS delete enabled
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
