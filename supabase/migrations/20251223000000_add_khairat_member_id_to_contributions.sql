-- Migration: Add khairat_member_id to khairat_contributions
-- This allows payments to be directly linked to khairat members for better tracking
-- and admin management. This is the primary reference ID for linking payments to members.

begin;

-- Add khairat_member_id column to khairat_contributions
alter table public.khairat_contributions 
add column if not exists khairat_member_id uuid references public.khairat_members(id) on delete set null;

-- Create index for better query performance
create index if not exists idx_khairat_contributions_khairat_member_id 
on public.khairat_contributions(khairat_member_id);

-- Add comment to document the column purpose
comment on column public.khairat_contributions.khairat_member_id is 
'Direct reference to the khairat member who made this contribution. This is the primary way to link payments to members for admin tracking and management.';

commit;

