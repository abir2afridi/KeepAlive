-- Supabase schema for KeepAlive

create extension if not exists "pgcrypto";

-- Users table (mirrors auth.users id)
create table if not exists public.users (
  id uuid primary key,
  email text,
  plan text default 'free',
  status_slug text unique,
  name text,
  created_at timestamptz default now()
);

create table if not exists public.monitors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  url text not null,
  type text not null default 'http',
  interval_seconds int not null default 60,
  timeout_seconds int not null default 30,
  method text not null default 'GET',
  body text default '',
  port int default 80,
  headers text default '{}',
  alert_config text default '{}',
  status text not null default 'unknown',
  last_is_up boolean,
  last_pinged_at timestamptz,
  last_response_time int,
  last_status_code int,
  last_error_message text,
  status_page_id uuid references public.status_pages(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists monitors_user_id_idx on public.monitors(user_id);

create table if not exists public.pings (
  id uuid primary key default gen_random_uuid(),
  monitor_id uuid not null references public.monitors(id) on delete cascade,
  status_code int,
  response_time int,
  is_up boolean not null,
  status text not null default 'unknown',
  error_message text,
  created_at timestamptz default now()
);

create index if not exists pings_monitor_id_created_at_idx on public.pings(monitor_id, created_at desc);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  monitor_id uuid not null references public.monitors(id) on delete cascade,
  type text not null,
  target text not null,
  created_at timestamptz default now()
);

create index if not exists alerts_monitor_id_idx on public.alerts(monitor_id);

-- Alert Channels table (for user notification preferences)
create table if not exists public.alert_channels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  type text not null, -- 'email', 'slack', 'discord', 'telegram', etc.
  config text not null default '{}', -- JSON config for the channel
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists alert_channels_user_id_idx on public.alert_channels(user_id);

-- Status Pages table (for public status pages)
create table if not exists public.status_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  slug text unique not null,
  description text,
  public boolean not null default false,
  custom_domain text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists status_pages_user_id_idx on public.status_pages(user_id);
create index if not exists status_pages_slug_idx on public.status_pages(slug);

-- RLS
alter table public.users enable row level security;
alter table public.monitors enable row level security;
alter table public.pings enable row level security;
alter table public.alerts enable row level security;
alter table public.alert_channels enable row level security;
alter table public.status_pages enable row level security;

-- Users: user can read/update their own profile row
create policy if not exists "users_select_own" on public.users
for select using (id = auth.uid());

create policy if not exists "users_update_own" on public.users
for update using (id = auth.uid());

-- Monitors: user can CRUD own
create policy if not exists "monitors_select_own" on public.monitors
for select using (user_id = auth.uid());

create policy if not exists "monitors_insert_own" on public.monitors
for insert with check (user_id = auth.uid());

create policy if not exists "monitors_update_own" on public.monitors
for update using (user_id = auth.uid());

create policy if not exists "monitors_delete_own" on public.monitors
for delete using (user_id = auth.uid());

-- Pings: user can read pings for their monitors, system can insert
create policy if not exists "pings_select_own" on public.pings
for select using (
  exists (
    select 1 from public.monitors m
    where m.id = pings.monitor_id and m.user_id = auth.uid()
  )
);

create policy if not exists "pings_insert_system" on public.pings
for insert with check (
  exists (
    select 1 from public.monitors m
    where m.id = pings.monitor_id and m.user_id = auth.uid()
  )
);

create policy if not exists "pings_update_system" on public.pings
for update using (
  exists (
    select 1 from public.monitors m
    where m.id = pings.monitor_id and m.user_id = auth.uid()
  )
);

create policy if not exists "pings_delete_system" on public.pings
for delete using (
  exists (
    select 1 from public.monitors m
    where m.id = pings.monitor_id and m.user_id = auth.uid()
  )
);

-- Alerts: user can CRUD alerts for their monitors
create policy if not exists "alerts_select_own" on public.alerts
for select using (
  exists (
    select 1 from public.monitors m
    where m.id = alerts.monitor_id and m.user_id = auth.uid()
  )
);

create policy if not exists "alerts_insert_own" on public.alerts
for insert with check (
  exists (
    select 1 from public.monitors m
    where m.id = alerts.monitor_id and m.user_id = auth.uid()
  )
);

create policy if not exists "alerts_update_own" on public.alerts
for update using (
  exists (
    select 1 from public.monitors m
    where m.id = alerts.monitor_id and m.user_id = auth.uid()
  )
);

create policy if not exists "alerts_delete_own" on public.alerts
for delete using (
  exists (
    select 1 from public.monitors m
    where m.id = alerts.monitor_id and m.user_id = auth.uid()
  )
);

-- Alert Channels: user can CRUD own alert channels
create policy if not exists "alert_channels_select_own" on public.alert_channels
for select using (user_id = auth.uid());

create policy if not exists "alert_channels_insert_own" on public.alert_channels
for insert with check (user_id = auth.uid());

create policy if not exists "alert_channels_update_own" on public.alert_channels
for update using (user_id = auth.uid());

create policy if not exists "alert_channels_delete_own" on public.alert_channels
for delete using (user_id = auth.uid());

-- Status Pages: user can CRUD own status pages, public can read public pages
create policy if not exists "status_pages_select_own" on public.status_pages
for select using (user_id = auth.uid());

create policy if not exists "status_pages_select_public" on public.status_pages
for select using (public = true);

create policy if not exists "status_pages_insert_own" on public.status_pages
for insert with check (user_id = auth.uid());

create policy if not exists "status_pages_update_own" on public.status_pages
for update using (user_id = auth.uid());

create policy if not exists "status_pages_delete_own" on public.status_pages
for delete using (user_id = auth.uid());
