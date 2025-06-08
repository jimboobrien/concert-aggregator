create table
  public.followed_artists (
    user_id uuid not null,
    artist_id uuid not null,
    created_at timestamp with time zone not null default now(),
    constraint followed_artists_pkey primary key (user_id, artist_id),
    constraint followed_artists_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade,
    constraint followed_artists_artist_id_fkey foreign key (artist_id) references artists (id) on delete cascade
  );

alter table public.followed_artists enable row level security;

create policy "Allow read access to followed artists" on public.followed_artists for
select
  using (auth.uid () = user_id);

create policy "Allow insert access to followed artists" on public.followed_artists for insert with
check
  (auth.uid () = user_id);

create policy "Allow delete access to followed artists" on public.followed_artists for delete using (auth.uid () = user_id); 