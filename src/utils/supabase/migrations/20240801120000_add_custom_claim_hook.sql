-- In this hook, you can add custom claims to the JWT.
--
-- For more information, see:
-- https://supabase.com/docs/guides/auth/auth-hooks#the-custom-access-token-hook

--
-- Create the function.
--
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
  declare
    claims jsonb;
    user_role public.app_role;
  begin
    -- Fetch the user role from the user_roles table
    select role into user_role from public.user_roles where user_id = (event->>'user_id')::uuid;

    claims := event->'claims';

    if user_role is not null then
      -- Set the 'user_role' claim
      claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
    else
      claims := jsonb_set(claims, '{user_role}', 'null');
    end if;

    -- Update the 'claims' object in the original event
    event := jsonb_set(event, '{claims}', claims);

    -- Return the modified or original event
    return event;
  end;
$$;

--
-- Grant usage to the supabase_auth_admin role
--
grant usage on schema public to supabase_auth_admin;

grant execute
  on function public.custom_access_token_hook
  to supabase_auth_admin;

--
-- Don't allow public access to the function
--
revoke execute
  on function public.custom_access_token_hook
  from authenticated, anon, public;

--
-- Add the function to the list of hooks
--
grant all
  on table public.user_roles
to supabase_auth_admin;

revoke all
  on table public.user_roles
  from authenticated, anon, public;

--
-- Create a policy that allows the auth admin to read user roles
--
create policy "Allow auth admin to read user roles" ON public.user_roles
as permissive for select
to supabase_auth_admin
using (true);

-- pgrst
NOTIFY pgrst, 'reload schema'; 