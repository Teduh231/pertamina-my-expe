-- Make sure that the booth_id cannot be null
ALTER TABLE activities
ALTER COLUMN booth_id SET NOT NULL;
