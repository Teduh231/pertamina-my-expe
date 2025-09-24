-- Create check_ins table
CREATE TABLE IF NOT EXISTS public.check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendee_id UUID NOT NULL REFERENCES public.attendees(id) ON DELETE CASCADE,
    booth_id UUID NOT NULL REFERENCES public.booths(id) ON DELETE CASCADE,
    checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(attendee_id, booth_id)
);

-- RLS for check_ins
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to check-ins" ON public.check_ins
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to insert their own check-ins" ON public.check_ins
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
