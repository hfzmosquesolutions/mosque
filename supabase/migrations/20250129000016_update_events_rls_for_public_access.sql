-- Update RLS policies for events and event_registrations to allow public access
-- This migration enables public viewing of events and proper registration functionality

-- Drop existing restrictive policies for events
DROP POLICY IF EXISTS "Users can view events for own mosques" ON public.events;
DROP POLICY IF EXISTS "Users can manage events for own mosques" ON public.events;
DROP POLICY IF EXISTS "Users can view events in their mosque" ON public.events;
DROP POLICY IF EXISTS "Admins can manage events in their mosque" ON public.events;

-- Drop existing restrictive policies for event_registrations
DROP POLICY IF EXISTS "Users can view event registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Users can manage own event registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Mosque owners can update event registrations" ON public.event_registrations;

-- Create new public access policies for events
-- Allow everyone (including anonymous users) to view published events
CREATE POLICY "Public can view published events" ON public.events
  FOR SELECT USING (
    status = 'published'
  );

-- Allow mosque owners to manage events for their mosques
CREATE POLICY "Mosque owners can manage their events" ON public.events
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
    AND auth.uid() = created_by
  );

-- Create new policies for event_registrations
-- Allow users to view their own registrations
CREATE POLICY "Users can view own registrations" ON public.event_registrations
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Allow mosque owners to view all registrations for their events
CREATE POLICY "Mosque owners can view event registrations" ON public.event_registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.mosques m ON e.mosque_id = m.id
      WHERE e.id = event_registrations.event_id
      AND m.user_id = auth.uid()
    )
  );

-- Allow authenticated users to register for events
CREATE POLICY "Authenticated users can register for events" ON public.event_registrations
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_registrations.event_id
      AND events.status = 'published'
      AND events.registration_required = true
      AND (events.registration_deadline IS NULL OR events.registration_deadline > NOW())
    )
  );

-- Allow users to cancel their own registrations
CREATE POLICY "Users can cancel own registrations" ON public.event_registrations
  FOR DELETE USING (
    auth.uid() = user_id
  );

-- Allow mosque owners to update registration status (e.g., mark as attended)
CREATE POLICY "Mosque owners can update registration status" ON public.event_registrations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.mosques m ON e.mosque_id = m.id
      WHERE e.id = event_registrations.event_id
      AND m.user_id = auth.uid()
    )
  );

-- Add index for better performance on event status queries
CREATE INDEX IF NOT EXISTS idx_events_status_published ON public.events(status) WHERE status = 'published';

-- Add index for better performance on registration queries
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_event ON public.event_registrations(user_id, event_id);

COMMIT;