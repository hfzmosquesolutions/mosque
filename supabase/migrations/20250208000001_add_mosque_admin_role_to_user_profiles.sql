-- Add mosque_admin_role column to user_profiles
-- This stores the admin's organisational role in the mosque/surau

alter table public.user_profiles
add column if not exists mosque_admin_role text;

comment on column public.user_profiles.mosque_admin_role is
  'Mosque/surau organisational role for admins (e.g. chairman, secretary, treasurer, AJK, imam, staff, volunteer).';

