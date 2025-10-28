-- Drop Events feature (tables, policies, indexes, triggers, enum)
-- Safe to run multiple times; uses IF EXISTS guards

-- 1) Drop RLS policies related to events and registrations
DO $$
BEGIN
  -- event_registrations policies
  EXECUTE 'DROP POLICY IF EXISTS "Users can view event registrations" ON public.event_registrations';
  EXECUTE 'DROP POLICY IF EXISTS "Users can manage own event registrations" ON public.event_registrations';
  EXECUTE 'DROP POLICY IF EXISTS "Mosque owners can update event registrations" ON public.event_registrations';
  EXECUTE 'DROP POLICY IF EXISTS "Users can view own registrations" ON public.event_registrations';
  EXECUTE 'DROP POLICY IF EXISTS "Mosque owners can view event registrations" ON public.event_registrations';
  EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can register for events" ON public.event_registrations';
  EXECUTE 'DROP POLICY IF EXISTS "Users can cancel own registrations" ON public.event_registrations';
  EXECUTE 'DROP POLICY IF EXISTS "Mosque owners can update registration status" ON public.event_registrations';

  -- events policies (if any existed)
  EXECUTE 'DROP POLICY IF EXISTS "Public can view published events" ON public.events';
  EXECUTE 'DROP POLICY IF EXISTS "Mosque owners can manage events" ON public.events';
  EXECUTE 'DROP POLICY IF EXISTS "Creators can manage their events" ON public.events';
END $$;

-- 2) Drop indexes related to events tables
DROP INDEX IF EXISTS public.idx_events_mosque_id;
DROP INDEX IF EXISTS public.idx_events_date;
DROP INDEX IF EXISTS public.idx_events_status;
DROP INDEX IF EXISTS public.idx_events_category;
DROP INDEX IF EXISTS public.idx_events_status_published;
DROP INDEX IF EXISTS public.idx_event_registrations_user_event;

-- 3) Drop triggers related to events
DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;

-- 4) Drop event_registrations first (FK depends on events)
DROP TABLE IF EXISTS public.event_registrations;

-- 5) Drop events table
DROP TABLE IF EXISTS public.events;

-- 6) Drop enum type used by events table
DROP TYPE IF EXISTS public.event_status;

-- Note: Do NOT drop shared functions like update_updated_at_column, as other tables may use them.

