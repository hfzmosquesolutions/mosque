-- Split khairat into dedicated tables: khairat_programs and khairat_contributions
-- Safe, additive migration with data backfill from contribution_programs/contributions

begin;

-- 1) Create khairat_programs table
create table if not exists public.khairat_programs (
  id uuid primary key default uuid_generate_v4(),
  mosque_id uuid not null references public.mosques(id),
  name varchar not null,
  description text,
  target_amount numeric,
  current_amount numeric default 0,
  fixed_price numeric,
  start_date date,
  end_date date,
  is_active boolean default true,
  created_by uuid not null references public.user_profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2) Create khairat_contributions table
create table if not exists public.khairat_contributions (
  id uuid primary key default uuid_generate_v4(),
  program_id uuid not null references public.khairat_programs(id) on delete cascade,
  contributor_id uuid references public.user_profiles(id),
  contributor_name varchar,
  amount numeric not null,
  payment_method varchar,
  payment_reference varchar,
  status public.contribution_status default 'pending',
  notes text,
  contributed_at timestamptz default now(),
  payment_data jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  bill_id text
);

-- 3) Backfill khairat_programs from contribution_programs (program_type='khairat')
insert into public.khairat_programs (
  id, mosque_id, name, description, target_amount, current_amount, fixed_price,
  start_date, end_date, is_active, created_by, created_at, updated_at
)
select
  cp.id, cp.mosque_id, cp.name, cp.description, cp.target_amount, cp.current_amount, NULL::numeric,
  cp.start_date, cp.end_date, cp.is_active, cp.created_by, cp.created_at, cp.updated_at
from public.contribution_programs cp
where cp.program_type = 'khairat'
  and not exists (
    select 1 from public.khairat_programs kp where kp.id = cp.id
  );

-- 4) Backfill khairat_contributions joined through khairat programs
insert into public.khairat_contributions (
  id, program_id, contributor_id, contributor_name, amount, payment_method,
  payment_reference, status, notes, contributed_at, payment_data, created_at, updated_at, bill_id
)
select
  c.id, c.program_id, c.contributor_id, c.contributor_name, c.amount, c.payment_method,
  c.payment_reference, c.status, c.notes, c.contributed_at, coalesce(c.payment_data, '{}'::jsonb),
  c.created_at, c.updated_at, c.bill_id
from public.contributions c
join public.contribution_programs cp on cp.id = c.program_id
where cp.program_type = 'khairat'
  and not exists (
    select 1 from public.khairat_contributions kc where kc.id = c.id
  );

-- 5) Helpful views for backward compatibility (optional)
create or replace view public.v_khairat_programs as
  select * from public.khairat_programs;

create or replace view public.v_khairat_contributions as
  select * from public.khairat_contributions;

commit;


