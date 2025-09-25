-- Drop the old table if it exists to start fresh.
DROP TABLE IF EXISTS public.attendees;

-- Create the new attendees table with 'phone_number' as a unique column.
CREATE TABLE public.attendees (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    phone_number text NOT NULL,
    registered_at timestamp with time zone NOT NULL DEFAULT now(),
    custom_response text,
    qr_code_url text,
    points integer NOT NULL DEFAULT 100,
    CONSTRAINT attendees_pkey PRIMARY KEY (id),
    CONSTRAINT attendees_phone_number_key UNIQUE (phone_number)
);

-- Enable Row Level Security (RLS) for the table.
ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access and restricted insert access.
CREATE POLICY "Allow public read access" ON public.attendees FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert" ON public.attendees FOR INSERT TO authenticated WITH CHECK (true);
