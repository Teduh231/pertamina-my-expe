-- Create Events Table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    speaker TEXT,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Attendees Table
CREATE TABLE attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    custom_response TEXT,
    UNIQUE(event_id, email)
);

-- Create Raffles Table
CREATE TABLE raffles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    eventName TEXT, -- Denormalized for easier display
    prize TEXT NOT NULL,
    number_of_winners INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'upcoming', -- upcoming, active, finished
    winners JSONB, -- Array of winner objects { attendeeId, name, email }
    drawn_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE raffles ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Public events are viewable by everyone." ON events FOR SELECT USING (true);
CREATE POLICY "Public attendees are viewable by everyone." ON attendees FOR SELECT USING (true);
CREATE POLICY "Public raffles are viewable by everyone." ON raffles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own events." ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can insert their own attendees." ON attendees FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can insert their own raffles." ON raffles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own events." ON events FOR UPDATE USING (true);
CREATE POLICY "Users can update their own raffles." ON raffles FOR UPDATE USING (true);
