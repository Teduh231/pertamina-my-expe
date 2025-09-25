-- This script is designed to be idempotent and safe to re-run.

-- 1. Create the 'attendees' table
-- This table stores information about event attendees.
CREATE TABLE IF NOT EXISTS public.attendees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    registered_at timestamp with time zone DEFAULT now() NOT NULL,
    custom_response text,
    qr_code_url text,
    points integer DEFAULT 0 NOT NULL,
    phone_number text,
    CONSTRAINT attendees_pkey PRIMARY KEY (id),
    CONSTRAINT attendees_phone_number_key UNIQUE (phone_number)
);
ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.attendees FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert" ON public.attendees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow users to update their own data" ON public.attendees FOR UPDATE USING (auth.uid() = id);


-- 2. Create the 'booths' table
-- This table stores information about booths at the event.
CREATE TABLE IF NOT EXISTS public.booths (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text,
    description text,
    location text,
    status public.booth_status,
    user_id uuid,
    booth_manager text,
    image_url text,
    image_path text,
    CONSTRAINT booths_pkey PRIMARY KEY (id)
);
ALTER TABLE public.booths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.booths FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to create booths" ON public.booths FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow assigned users to update their booth" ON public.booths FOR UPDATE USING (
  (SELECT role FROM public.user_roles WHERE id = auth.uid()) = 'admin'
  OR 
  (SELECT booth_id FROM public.tenants WHERE id = auth.uid()) = id
);
CREATE POLICY "Allow admin to delete booths" ON public.booths FOR DELETE USING ((SELECT role FROM public.user_roles WHERE id = auth.uid()) = 'admin');

-- 3. Create the 'check_ins' table
-- This table logs when an attendee checks into a booth.
-- It has been modified to remove the direct link to the attendees table.
CREATE TABLE IF NOT EXISTS public.check_ins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booth_id uuid,
    checked_in_at timestamp with time zone DEFAULT now() NOT NULL,
    phone_number text, -- Stores phone number directly
    CONSTRAINT check_ins_pkey PRIMARY KEY (id),
    CONSTRAINT check_ins_booth_id_fkey FOREIGN KEY (booth_id) REFERENCES public.booths (id) ON DELETE CASCADE
);
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.check_ins FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert" ON publicic.check_ins FOR INSERT TO authenticated WITH CHECK (true);

-- 4. Re-create the 'raffles' table (if it exists)
-- This ensures it's clean and has the correct foreign key reference.
DROP TABLE IF EXISTS public.raffles;
CREATE TABLE public.raffles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    prize text,
    number_of_winners integer,
    status public.raffle_status DEFAULT 'upcoming'::public.raffle_status,
    winners jsonb,
    drawn_at timestamp with time zone,
    booth_id uuid,
    boothName text,
    CONSTRAINT raffles_pkey PRIMARY KEY (id),
    CONSTRAINT raffles_booth_id_fkey FOREIGN KEY (booth_id) REFERENCES public.booths (id) ON DELETE CASCADE
);
ALTER TABLE public.raffles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.raffles FOR SELECT USING (true);
CREATE POLICY "Allow admin and assigned tenants to manage raffles" ON public.raffles FOR ALL USING (
    (SELECT role FROM public.user_roles WHERE id = auth.uid()) = 'admin'
    OR
    (SELECT booth_id FROM public.tenants WHERE id = auth.uid()) = booth_id
);

-- And other tables...
CREATE TABLE IF NOT EXISTS public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text,
    points integer,
    stock integer,
    image_url text,
    image_path text,
    booth_id uuid,
    CONSTRAINT products_pkey PRIMARY KEY (id),
    CONSTRAINT products_booth_id_fkey FOREIGN KEY (booth_id) REFERENCES public.booths (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    booth_id uuid,
    attendee_id uuid,
    product_id uuid,
    points_spent integer,
    attendee_name text,
    product_name text,
    items jsonb,
    discount integer,
    CONSTRAINT transactions_pkey PRIMARY KEY (id),
    CONSTRAINT transactions_booth_id_fkey FOREIGN KEY (booth_id) REFERENCES public.booths (id) ON DELETE CASCADE,
    CONSTRAINT transactions_attendee_id_fkey FOREIGN KEY (attendee_id) REFERENCES public.attendees (id) ON DELETE SET NULL,
    CONSTRAINT transactions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.tenants (
    id uuid NOT NULL,
    name text,
    email text,
    booth_id uuid,
    status text DEFAULT 'pending'::text,
    CONSTRAINT tenants_pkey PRIMARY KEY (id),
    CONSTRAINT tenants_booth_id_fkey FOREIGN KEY (booth_id) REFERENCES public.booths (id) ON DELETE SET NULL,
    CONSTRAINT tenants_email_key UNIQUE (email),
    CONSTRAINT tenants_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid NOT NULL,
    role text,
    CONSTRAINT user_roles_pkey PRIMARY KEY (id),
    CONSTRAINT user_roles_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booth_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    points_reward integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT activities_pkey PRIMARY KEY (id),
    CONSTRAINT activities_booth_id_fkey FOREIGN KEY (booth_id) REFERENCES public.booths(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.activity_participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    activity_id uuid NOT NULL,
    attendee_id uuid NOT NULL,
    completed_at timestamp with time zone DEFAULT now(),
    points_awarded integer,
    CONSTRAINT activity_participants_pkey PRIMARY KEY (id),
    CONSTRAINT activity_participants_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE,
    CONSTRAINT unique_participant_activity UNIQUE (attendee_id, activity_id)
);
