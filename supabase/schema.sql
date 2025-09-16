-- Create the events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT NOT NULL,
    speaker TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'canceled')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create the attendees table
CREATE TABLE attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    registered_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    custom_response TEXT,
    CONSTRAINT unique_attendee_per_event UNIQUE (event_id, email)
);

-- Create the raffles table
CREATE TABLE raffles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    eventName TEXT NOT NULL,
    prize TEXT NOT NULL,
    number_of_winners INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'finished')),
    winners JSONB,
    drawn_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
