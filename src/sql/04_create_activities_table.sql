-- Create the 'activities' table
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booth_id UUID REFERENCES booths(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- e.g., 'quiz', 'challenge'
    points_reward INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Add a trigger to automatically update the 'updated_at' timestamp
CREATE TRIGGER on_activities_update
  BEFORE UPDATE ON activities
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();

-- Add comments to the table and columns
COMMENT ON TABLE activities IS 'Stores all activities like quizzes or challenges for each booth.';
COMMENT ON COLUMN activities.id IS 'Unique identifier for the activity.';
COMMENT ON COLUMN activities.booth_id IS 'Foreign key referencing the booth this activity belongs to.';
COMMENT ON COLUMN activities.name IS 'The name of the activity.';
COMMENT ON COLUMN activities.description IS 'A detailed description of the activity.';
COMMENT ON COLUMN activities.type IS 'The type of activity (e.g., quiz, challenge).';
COMMENT ON COLUMN activities.points_reward IS 'Number of points an attendee gets for completing the activity.';
COMMENT ON COLUMN activities.created_at IS 'Timestamp when the activity was created.';
COMMENT ON COLUMN activities.updated_at IS 'Timestamp when the activity was last updated.';
