
-- Get the role of the currently authenticated user
create or replace function get_my_role()
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  return (
    select role
    from public.user_roles
    where id = auth.uid()
  );
end;
$$;


-- Grant access to the user_roles table for authenticated users to read their own role
-- This is necessary for the get_my_role() function to work for non-admin users.
-- First, ensure RLS is enabled.
alter table public.user_roles enable row level security;

-- Drop existing policies to prevent conflicts.
drop policy if exists "Allow authenticated users to read their own role" on public.user_roles;

-- Create policy
create policy "Allow authenticated users to read their own role"
on public.user_roles
for select
to authenticated
using (auth.uid() = id);


-- == EVENTS TABLE POLICIES ==
-- Enable RLS for the events table
alter table public.events enable row level security;

-- Drop existing policies to prevent conflicts
drop policy if exists "Enable all access for authenticated users" on public.events;
drop policy if exists "Admins have full access to events" on public.events;

-- Create policy for Admins: Admins can do anything.
create policy "Admins have full access to events"
on public.events
for all
to authenticated
using (get_my_role() = 'admin')
with check (get_my_role() = 'admin');

-- Create policy for public read access to published events.
drop policy if exists "Public can read published events" on public.events;
create policy "Public can read published events"
on public.events
for select
to public
using (status = 'published');


    