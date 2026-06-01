-- Phase 2: shared guest request bus for DJ Command Center

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  track_id text not null,
  title text not null,
  artist text not null,
  artwork_url text not null default '',
  guest_name text not null default 'Guest',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now()
);

create index requests_status_created_at_idx
  on public.requests (status, created_at desc);

alter table public.requests enable row level security;

-- Guests (anon): insert pending requests only
create policy "guests_insert_pending"
  on public.requests
  for insert
  to anon
  with check (
    status = 'pending'
    and length(trim(track_id)) > 0
    and length(trim(title)) > 0
    and length(trim(artist)) > 0
  );

-- Guests and DJ (anon read for guest confirmation; DJ uses service role for writes)
create policy "public_read_requests"
  on public.requests
  for select
  to anon, authenticated
  using (true);

-- Realtime: broadcast row changes to subscribed clients
alter publication supabase_realtime add table public.requests;
