create table
  public.events (
    id uuid not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    artist_id uuid not null,
    venue_id uuid not null,
    event_date timestamp with time zone not null,
    title character varying null,
    description text null,
    url character varying null,
    constraint events_pkey primary key (id),
    constraint events_artist_id_fkey foreign key (artist_id) references artists (id) on delete cascade,
    constraint events_venue_id_fkey foreign key (venue_id) references venues (id) on delete cascade
  );

alter table public.events enable row level security;

create policy "Allow read access to all users" on public.events for
select
  using (true); 