-- Create Events Table
CREATE TABLE events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location TEXT,
    speaker TEXT,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Attendees Table
CREATE TABLE attendees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    custom_response TEXT,
    registered_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (event_id, email)
);

-- Create Raffles Table
CREATE TABLE raffles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid REFERENCES events(id) ON DELETE CASCADE,
    prize TEXT NOT NULL,
    number_of_winners INTEGER NOT NULL DEFAULT 1,
    status TEXT DEFAULT 'upcoming',
    winners JSONB,
    drawn_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE raffles ENABLE ROW LEVEL SECURITY;

-- Create Policies for Public Access (if needed)
-- Allows public read access to published events
CREATE POLICY "Allow public read access on published events" ON events
FOR SELECT USING (status = 'published');

-- Allows anyone to register as an attendee for a published event
CREATE POLICY "Allow public insert for attendees on published events" ON attendees
FOR INSERT WITH CHECK (
    (SELECT status FROM events WHERE id = event_id) = 'published'
);

-- For Authenticated Users (assuming you have user management)
-- This allows any authenticated user to manage all records.
-- For production, you'd likely want to scope this to user_id.

-- Events
CREATE POLICY "Allow auth users full access to events" ON events
FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Attendees
CREATE POLICY "Allow auth users full access to attendees" ON attendees
FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Raffles
CREATE POLICY "Allow auth users full access to raffles" ON raffles
FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');


-- Insert Mock Data
-- This helps in testing the application with some initial data.
-- Create some events
INSERT INTO events (name, description, date, time, location, speaker, status) VALUES
('Tech Innovators Conference 2024', 'Join the brightest minds in tech for a day of innovation, networking, and groundbreaking announcements.', CURRENT_DATE + 30, '09:00', 'Silicon Valley Convention Center', 'Dr. Evelyn Reed', 'published'),
('Creative Design Workshop', 'A hands-on workshop for designers looking to push their creative boundaries.', CURRENT_DATE + 15, '13:00', 'The Art Space, New York', 'Marco Bianci', 'published'),
('Indie Music Fest', 'Experience a magical evening with performances from the best up-and-coming indie bands.', CURRENT_DATE - 2, '18:00', 'Greenfield Park', 'Various Artists', 'published'),
('Future of Business Summit', 'A premier networking event for entrepreneurs and executives.', CURRENT_DATE + 60, '10:00', 'Grand Hyatt, Singapore', 'Ken Adams', 'draft'),
('Annual Charity Gala', 'An elegant evening of dining and entertainment to support a great cause.', CURRENT_DATE + 45, '20:00', 'The Starlight Ballroom', 'Celebrity Host', 'canceled');

-- Add attendees to the first event
WITH first_event AS (
  SELECT id FROM events WHERE name = 'Tech Innovators Conference 2024' LIMIT 1
)
INSERT INTO attendees (event_id, name, email, registered_at) VALUES
((SELECT id FROM first_event), 'Alice Johnson', 'alice@example.com', now() - interval '5 days'),
((SELECT id FROM first_event), 'Bob Williams', 'bob@example.com', now() - interval '10 days');

-- Add attendees to the second event
WITH second_event AS (
  SELECT id FROM events WHERE name = 'Creative Design Workshop' LIMIT 1
)
INSERT INTO attendees (event_id, name, email, registered_at) VALUES
((SELECT id FROM second_event), 'Diana Prince', 'diana@example.com', now() - interval '12 days');

-- Create an active raffle for the first event
WITH first_event AS (
  SELECT id FROM events WHERE name = 'Tech Innovators Conference 2024' LIMIT 1
)
INSERT INTO raffles (event_id, prize, number_of_winners, status) VALUES
((SELECT id FROM first_event), 'T-Shirt', 3, 'active');

-- Create a finished raffle for the music fest
WITH music_fest AS (
  SELECT id FROM events WHERE name = 'Indie Music Fest' LIMIT 1
)
INSERT INTO raffles (event_id, prize, number_of_winners, status, winners, drawn_at) VALUES
((SELECT id FROM music_fest), 'Free Drink Coupon', 2, 'finished', '[
    {"name": "Winner One", "email": "winner1@example.com", "attendeeId": "c1-placeholder"},
    {"name": "Winner Two", "email": "winner2@example.com", "attendeeId": "c2-placeholder"}
]', now() - interval '1 day');
