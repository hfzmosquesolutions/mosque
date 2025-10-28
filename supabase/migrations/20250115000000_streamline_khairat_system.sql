-- Migration: Streamline Khairat System
-- Remove khairat_programs table and simplify khairat_contributions to be mosque-specific
-- This makes khairat a simple "khairat kematian" system where users pay directly to the mosque

begin;

-- 1. First, update khairat_contributions to add mosque_id and remove program_id dependency
-- Add mosque_id column to khairat_contributions
alter table public.khairat_contributions 
add column mosque_id uuid;

-- Update existing contributions to set mosque_id from their program
update public.khairat_contributions 
set mosque_id = (
  select mosque_id 
  from public.khairat_programs 
  where khairat_programs.id = khairat_contributions.program_id
);

-- Make mosque_id not null after populating it
alter table public.khairat_contributions 
alter column mosque_id set not null;

-- Add foreign key constraint for mosque_id
alter table public.khairat_contributions 
add constraint khairat_contributions_mosque_id_fkey 
foreign key (mosque_id) references public.mosques(id) on delete cascade;

-- 2. Update khairat_claims to remove program_id dependency (if it exists)
-- Check if program_id column exists in khairat_claims table
-- If it exists, update existing claims to ensure mosque_id is properly set
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'khairat_claims' 
    AND column_name = 'program_id'
  ) THEN
    -- Update existing claims to ensure mosque_id is properly set
    UPDATE public.khairat_claims 
    SET mosque_id = (
      SELECT mosque_id 
      FROM public.khairat_programs 
      WHERE khairat_programs.id = khairat_claims.program_id
    )
    WHERE program_id IS NOT NULL;

    -- Remove the program_id foreign key constraint and column
    ALTER TABLE public.khairat_claims 
    DROP CONSTRAINT IF EXISTS khairat_claims_program_id_fkey;

    ALTER TABLE public.khairat_claims 
    DROP COLUMN IF EXISTS program_id;
  END IF;
END $$;

-- 3. Update khairat_members to remove program dependency if it exists
-- (Based on the schema, khairat_members doesn't seem to have program_id, so this might not be needed)

-- 4. Update khairat_applications to remove program_id dependency (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'khairat_applications' 
    AND column_name = 'program_id'
  ) THEN
    ALTER TABLE public.khairat_applications 
    DROP CONSTRAINT IF EXISTS khairat_applications_program_id_fkey;

    ALTER TABLE public.khairat_applications 
    DROP COLUMN IF EXISTS program_id;
  END IF;
END $$;

-- 5. Update khairat_memberships to remove program dependency (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'khairat_memberships' 
    AND column_name = 'program_id'
  ) THEN
    ALTER TABLE public.khairat_memberships 
    DROP CONSTRAINT IF EXISTS khairat_memberships_program_id_fkey;

    ALTER TABLE public.khairat_memberships 
    DROP COLUMN IF EXISTS program_id;
  END IF;
END $$;

-- 6. Remove the program_id column from khairat_contributions
-- First, drop all existing RLS policies that depend on program_id
drop policy if exists "khairat_contributions_select_user_or_admin" on public.khairat_contributions;
drop policy if exists "khairat_contributions_insert_rules" on public.khairat_contributions;
drop policy if exists "khairat_contributions_update_rules" on public.khairat_contributions;
drop policy if exists "khairat_contributions_delete_admins" on public.khairat_contributions;

-- Drop any other policies that might reference program_id
drop policy if exists "Users can view contributions for programs they have access to" on public.khairat_contributions;
drop policy if exists "Users can create contributions for programs they have access to" on public.khairat_contributions;
drop policy if exists "Mosque admins can manage contributions for their mosque programs" on public.khairat_contributions;

-- Now drop the foreign key constraint and column
alter table public.khairat_contributions 
drop constraint if exists khairat_contributions_program_id_fkey;

alter table public.khairat_contributions 
drop column if exists program_id;

-- 7. Drop existing policies that reference khairat_programs BEFORE dropping the table
drop policy if exists "Users can view khairat programs for their mosque" on public.khairat_programs;
drop policy if exists "Mosque admins can manage khairat programs" on public.khairat_programs;

-- 8. Drop the khairat_programs table
drop table if exists public.khairat_programs;

-- 9. Add mosque-specific khairat settings to mosques table
-- Add khairat settings to the existing settings jsonb column
-- This will store things like fixed price, description, etc.
-- The settings column already exists, so we'll just document the expected structure

-- 10. Create a view for mosque khairat summary (replaces program-based logic)
create or replace view public.mosque_khairat_summary as
select 
  m.id as mosque_id,
  m.name as mosque_name,
  coalesce(sum(kc.amount), 0) as total_contributions,
  count(kc.id) as total_contributions_count,
  coalesce(sum(case when kc.status = 'completed' then kc.amount else 0 end), 0) as completed_contributions,
  count(case when kc.status = 'completed' then 1 end) as completed_contributions_count,
  coalesce(sum(case when kc.status = 'pending' then kc.amount else 0 end), 0) as pending_contributions,
  count(case when kc.status = 'pending' then 1 end) as pending_contributions_count
from public.mosques m
left join public.khairat_contributions kc on m.id = kc.mosque_id
group by m.id, m.name;

-- 11. Update RLS policies for the new structure

-- Create new policies for mosque-based khairat contributions
create policy "Users can view khairat contributions for mosques they have access to" 
on public.khairat_contributions
for select
using (
  -- Users can see contributions for mosques they're members of or admin of
  exists (
    select 1 from public.user_profiles up
    where up.id = auth.uid()
    and (
      up.role = 'admin' or
      exists (
        select 1 from public.khairat_members km
        where km.user_id = auth.uid()
        and km.mosque_id = khairat_contributions.mosque_id
        and km.status = 'active'
      )
    )
  )
);

create policy "Users can create khairat contributions for mosques they have access to"
on public.khairat_contributions
for insert
with check (
  -- Users can contribute to mosques they're members of or admin of
  exists (
    select 1 from public.user_profiles up
    where up.id = auth.uid()
    and (
      up.role = 'admin' or
      exists (
        select 1 from public.khairat_members km
        where km.user_id = auth.uid()
        and km.mosque_id = khairat_contributions.mosque_id
        and km.status = 'active'
      )
    )
  )
);

create policy "Mosque admins can manage khairat contributions for their mosque"
on public.khairat_contributions
for all
using (
  exists (
    select 1 from public.mosques m
    where m.id = khairat_contributions.mosque_id
    and m.user_id = auth.uid()
  )
);

-- 11. Create indexes for better performance
create index if not exists idx_khairat_contributions_mosque_id on public.khairat_contributions(mosque_id);
create index if not exists idx_khairat_contributions_contributor_id on public.khairat_contributions(contributor_id);
create index if not exists idx_khairat_contributions_status on public.khairat_contributions(status);
create index if not exists idx_khairat_contributions_contributed_at on public.khairat_contributions(contributed_at);

commit;
