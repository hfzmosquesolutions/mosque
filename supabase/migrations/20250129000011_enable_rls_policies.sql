-- Enable Row Level Security (RLS) for all tables
-- This migration adds comprehensive RLS policies for the mosque management system

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mosques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.khairat_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.khairat_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Mosques Policies
-- Users can view and manage mosques they own
CREATE POLICY "Users can view own mosques" ON public.mosques
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own mosques" ON public.mosques
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mosques" ON public.mosques
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mosques" ON public.mosques
  FOR DELETE USING (auth.uid() = user_id);

-- Announcements Policies
-- Users can manage announcements for mosques they own
CREATE POLICY "Users can view announcements for own mosques" ON public.announcements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mosques 
      WHERE mosques.id = announcements.mosque_id 
      AND mosques.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert announcements for own mosques" ON public.announcements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mosques 
      WHERE mosques.id = announcements.mosque_id 
      AND mosques.user_id = auth.uid()
    )
    AND auth.uid() = created_by
  );

CREATE POLICY "Users can update announcements for own mosques" ON public.announcements
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.mosques 
      WHERE mosques.id = announcements.mosque_id 
      AND mosques.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete announcements for own mosques" ON public.announcements
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.mosques 
      WHERE mosques.id = announcements.mosque_id 
      AND mosques.user_id = auth.uid()
    )
  );

-- Audit Logs Policies
-- Users can view audit logs for mosques they own
CREATE POLICY "Users can view audit logs for own mosques" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mosques 
      WHERE mosques.id = audit_logs.mosque_id 
      AND mosques.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- Donation Categories Policies
CREATE POLICY "Users can view donation categories for own mosques" ON public.donation_categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mosques 
      WHERE mosques.id = donation_categories.mosque_id 
      AND mosques.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage donation categories for own mosques" ON public.donation_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.mosques 
      WHERE mosques.id = donation_categories.mosque_id 
      AND mosques.user_id = auth.uid()
    )
  );

-- Donations Policies
-- Users can view donations for mosques they own
-- Donors can view their own donations
CREATE POLICY "Users can view donations for own mosques" ON public.donations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mosques 
      WHERE mosques.id = donations.mosque_id 
      AND mosques.user_id = auth.uid()
    )
    OR auth.uid() = donor_id
  );

CREATE POLICY "Users can insert donations" ON public.donations
  FOR INSERT WITH CHECK (
    auth.uid() = donor_id OR donor_id IS NULL
  );

CREATE POLICY "Mosque owners can update donations" ON public.donations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.mosques 
      WHERE mosques.id = donations.mosque_id 
      AND mosques.user_id = auth.uid()
    )
  );

-- Events Policies
CREATE POLICY "Users can view events for own mosques" ON public.events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mosques 
      WHERE mosques.id = events.mosque_id 
      AND mosques.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage events for own mosques" ON public.events
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

-- Event Registrations Policies
-- Users can view registrations for events in their mosques
-- Users can manage their own registrations
CREATE POLICY "Users can view event registrations" ON public.event_registrations
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.mosques m ON e.mosque_id = m.id
      WHERE e.id = event_registrations.event_id
      AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own event registrations" ON public.event_registrations
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Mosque owners can update event registrations" ON public.event_registrations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.mosques m ON e.mosque_id = m.id
      WHERE e.id = event_registrations.event_id
      AND m.user_id = auth.uid()
    )
  );

-- Contribution Programs Policies
CREATE POLICY "Public can view active contribution programs" ON public.contribution_programs
  FOR SELECT USING (
    is_active = true
  );

CREATE POLICY "Mosque owners can manage their programs" ON public.contribution_programs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.mosques
      WHERE mosques.id = contribution_programs.mosque_id
      AND mosques.user_id = auth.uid()
    )
  );

-- Khairat Programs Policies
CREATE POLICY "Users can view khairat programs for own mosques" ON public.khairat_programs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mosques 
      WHERE mosques.id = khairat_programs.mosque_id 
      AND mosques.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage khairat programs for own mosques" ON public.khairat_programs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.mosques 
      WHERE mosques.id = khairat_programs.mosque_id 
      AND mosques.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mosques 
      WHERE mosques.id = khairat_programs.mosque_id 
      AND mosques.user_id = auth.uid()
    )
    AND auth.uid() = created_by
  );

-- Khairat Contributions Policies
CREATE POLICY "Users can view khairat contributions" ON public.khairat_contributions
  FOR SELECT USING (
    auth.uid() = contributor_id
    OR EXISTS (
      SELECT 1 FROM public.khairat_programs kp
      JOIN public.mosques m ON kp.mosque_id = m.id
      WHERE kp.id = khairat_contributions.program_id
      AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert khairat contributions" ON public.khairat_contributions
  FOR INSERT WITH CHECK (
    auth.uid() = contributor_id OR contributor_id IS NULL
  );

CREATE POLICY "Mosque owners can update khairat contributions" ON public.khairat_contributions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.khairat_programs kp
      JOIN public.mosques m ON kp.mosque_id = m.id
      WHERE kp.id = khairat_contributions.program_id
      AND m.user_id = auth.uid()
    )
  );

-- Notifications Policies
-- Users can view and manage their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Resource Categories Policies
CREATE POLICY "Users can view resource categories for own mosques" ON public.resource_categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mosques 
      WHERE mosques.id = resource_categories.mosque_id 
      AND mosques.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage resource categories for own mosques" ON public.resource_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.mosques 
      WHERE mosques.id = resource_categories.mosque_id 
      AND mosques.user_id = auth.uid()
    )
  );

-- Resources Policies
CREATE POLICY "Users can view resources for own mosques" ON public.resources
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mosques 
      WHERE mosques.id = resources.mosque_id 
      AND mosques.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage resources for own mosques" ON public.resources
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.mosques 
      WHERE mosques.id = resources.mosque_id 
      AND mosques.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mosques 
      WHERE mosques.id = resources.mosque_id 
      AND mosques.user_id = auth.uid()
    )
    AND auth.uid() = created_by
  );

-- System Settings Policies
CREATE POLICY "Users can view system settings for own mosques" ON public.system_settings
  FOR SELECT USING (
    mosque_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.mosques 
      WHERE mosques.id = system_settings.mosque_id 
      AND mosques.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage system settings for own mosques" ON public.system_settings
  FOR ALL USING (
    mosque_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.mosques 
      WHERE mosques.id = system_settings.mosque_id 
      AND mosques.user_id = auth.uid()
    )
  );

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions for anon users (for public donations, etc.)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.mosques TO anon;
GRANT INSERT ON public.donations TO anon;
GRANT INSERT ON public.khairat_contributions TO anon;