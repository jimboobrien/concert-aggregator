DROP FUNCTION if exists get_personalized_feed(uuid);
create
or replace function get_personalized_feed (p_user_id uuid) returns table (
  id uuid,
  created_at timestamp with time zone,
  artist_id uuid,
  venue_id uuid,
  event_date timestamp with time zone,
  title character varying,
  description text,
  url character varying,
  artist_name text,
  venue_name text
) as $$
begin
  return query
  select
    e.id,
    e.created_at,
    e.artist_id,
    e.venue_id,
    e.event_date,
    e.title,
    e.description,
    e.url,
    a.name as artist_name,
    v.name as venue_name
  from
    events e
    join artists a on e.artist_id = a.id
    join venues v on e.venue_id = v.id
  where
    e.artist_id in (
      select
        fa.artist_id
      from
        followed_artists fa
      where
        fa.user_id = p_user_id
    ) or e.venue_id in (
      select
        fv.venue_id
      from
        followed_venues fv
      where
        fv.user_id = p_user_id
    )
  order by
    e.event_date asc;
end;
$$ language plpgsql; 