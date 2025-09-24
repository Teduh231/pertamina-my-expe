-- Create the activities table
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booth_id UUID REFERENCES booths(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    points_reward INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);

-- Add a trigger to automatically update the updated_at column
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON activities
FOR EACH ROW
EXECUTE PROCEDURE moddatetime(updated_at);
