-- ============================================
-- Enable Supabase Realtime on tables
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable realtime for live data sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions;
