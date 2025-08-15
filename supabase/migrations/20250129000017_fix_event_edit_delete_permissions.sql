-- Fix RLS policies to allow event creators to edit and delete their own events
-- This migration ensures that users who created events can manage them properly

BEGIN;

-- Drop the existing restrictive policy for mosque owners only
DROP POLICY IF EXISTS "Mosque owners can manage their events" ON public.events;

-- Create separate policies for different operations

-- Allow mosque owners to manage all events in their mosque
CREATE POLICY "Mosque owners can manage all mosque events" ON public.events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.mosques 
      WHERE mosques.id = events.mosque_id 
      AND mosques.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mosques 
      WHERE mosques.id = events.mosque_id 
      AND mosques.user_id = auth.uid()
    )
  );

-- Allow event creators to edit and delete their own events
CREATE POLICY "Event creators can manage their own events" ON public.events
  FOR ALL USING (
    auth.uid() = created_by
  )
  WITH CHECK (
    auth.uid() = created_by
  );

-- Allow authenticated users to create events (they must own the mosque)
CREATE POLICY "Authenticated users can create events" ON public.events
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.mosques m
      WHERE m.id = events.mosque_id
      AND m.user_id = auth.uid()
    )
  );

COMMIT;