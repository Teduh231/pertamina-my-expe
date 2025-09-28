-- Enable RLS for the 'events' table if it's not already enabled.
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to prevent conflicts.
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON "public"."events";
DROP POLICY IF EXISTS "Admin users can manage events" ON "public"."events";
DROP POLICY IF EXISTS "Public can read published events" ON "public"."events";


-- Create a policy that gives full control to users with the 'admin' role.
CREATE POLICY "Admin users can manage events"
ON "public"."events"
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.user_roles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.user_roles WHERE id = auth.uid()) = 'admin'
);


-- Create a policy that allows anyone (public) to read events that are 'published'.
-- This is necessary for the public-facing event registration pages.
CREATE POLICY "Public can read published events"
ON "public"."events"
FOR SELECT
TO public
USING (status = 'published'::public.event_status);
