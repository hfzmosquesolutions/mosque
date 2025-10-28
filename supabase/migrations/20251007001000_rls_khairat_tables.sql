-- RLS and policies for khairat tables
-- Assumptions:
-- - auth.uid() is available
-- - public.user_profiles(id) references auth.users(id)
-- - mosques.user_id is the mosque owner; admins are tracked via user_profiles.role in ('admin','treasurer')

begin;

-- Enable RLS
alter table public.khairat_programs enable row level security;
alter table public.khairat_contributions enable row level security;

-- Helper: determine if current user is mosque admin/owner
-- We use simple policy expressions in USING/WITH CHECK to avoid custom SQL functions

-- khairat_programs policies

-- Read: allow everyone to read active programs; allow mosque members/admins to read all
create policy "khairat_programs_select_public_active" on public.khairat_programs
  for select
  using (
    is_active = true
    or exists (
      select 1
      from public.user_profiles up
      where up.id = auth.uid()
    )
  );

-- Insert: only mosque owner or admins can create
create policy "khairat_programs_insert_admins" on public.khairat_programs
  for insert
  with check (
    exists (
      select 1
      from public.mosques m
      join public.user_profiles up on up.id = auth.uid()
      where m.id = khairat_programs.mosque_id
        and (m.user_id = auth.uid() or up.role in ('admin','treasurer'))
    )
  );

-- Update: only mosque owner or admins for same mosque
create policy "khairat_programs_update_admins" on public.khairat_programs
  for update
  using (
    exists (
      select 1
      from public.mosques m
      join public.user_profiles up on up.id = auth.uid()
      where m.id = khairat_programs.mosque_id
        and (m.user_id = auth.uid() or up.role in ('admin','treasurer'))
    )
  )
  with check (
    exists (
      select 1
      from public.mosques m
      join public.user_profiles up on up.id = auth.uid()
      where m.id = khairat_programs.mosque_id
        and (m.user_id = auth.uid() or up.role in ('admin','treasurer'))
    )
  );

-- Delete: only mosque owner
create policy "khairat_programs_delete_owner" on public.khairat_programs
  for delete
  using (
    exists (
      select 1
      from public.mosques m
      where m.id = khairat_programs.mosque_id and m.user_id = auth.uid()
    )
  );

-- khairat_contributions policies

-- Read: public can read their own contributions; admins can read for their mosque; public read of program-level contributions restricted to active programs
create policy "khairat_contributions_select_user_or_admin" on public.khairat_contributions
  for select
  using (
    contributor_id = auth.uid() or
    exists (
      select 1
      from public.khairat_programs kp
      join public.mosques m on m.id = kp.mosque_id
      join public.user_profiles up on up.id = auth.uid()
      where kp.id = khairat_contributions.program_id
        and (m.user_id = auth.uid() or up.role in ('admin','treasurer'))
    )
  );

-- Insert: anyone can insert for active program; if contributor_id present, must be self; admins can insert on behalf
create policy "khairat_contributions_insert_rules" on public.khairat_contributions
  for insert
  with check (
    exists (
      select 1
      from public.khairat_programs kp
      where kp.id = khairat_contributions.program_id
        and kp.is_active = true
    )
    and (
      contributor_id is null
      or contributor_id = auth.uid()
      or exists (
        select 1
        from public.khairat_programs kp
        join public.mosques m on m.id = kp.mosque_id
        join public.user_profiles up on up.id = auth.uid()
        where kp.id = khairat_contributions.program_id
          and (m.user_id = auth.uid() or up.role in ('admin','treasurer'))
      )
    )
  );

-- Update: only mosque admins/owner or the contributor can update their own record
create policy "khairat_contributions_update_rules" on public.khairat_contributions
  for update
  using (
    contributor_id = auth.uid()
    or exists (
      select 1
      from public.khairat_programs kp
      join public.mosques m on m.id = kp.mosque_id
      join public.user_profiles up on up.id = auth.uid()
      where kp.id = khairat_contributions.program_id
        and (m.user_id = auth.uid() or up.role in ('admin','treasurer'))
    )
  )
  with check (
    contributor_id = auth.uid()
    or exists (
      select 1
      from public.khairat_programs kp
      join public.mosques m on m.id = kp.mosque_id
      join public.user_profiles up on up.id = auth.uid()
      where kp.id = khairat_contributions.program_id
        and (m.user_id = auth.uid() or up.role in ('admin','treasurer'))
    )
  );

-- Delete: only mosque admins/owner
create policy "khairat_contributions_delete_admins" on public.khairat_contributions
  for delete
  using (
    exists (
      select 1
      from public.khairat_programs kp
      join public.mosques m on m.id = kp.mosque_id
      join public.user_profiles up on up.id = auth.uid()
      where kp.id = khairat_contributions.program_id
        and (m.user_id = auth.uid() or up.role in ('admin','treasurer'))
    )
  );

commit;


