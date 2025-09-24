-- Create the booths table
CREATE TABLE booths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    description TEXT,
    booth_manager VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    image_url TEXT,
    image_path TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Trigger to automatically update 'updated_at' timestamp on any change
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON booths
FOR EACH ROW
EXECUTE PROCEDURE handle_updated_at();
