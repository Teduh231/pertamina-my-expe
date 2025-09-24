-- 05_create_activity_participants_table.sql
CREATE TABLE IF NOT EXISTS activity_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    attendee_id UUID NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    points_awarded INT NOT NULL,
    UNIQUE(activity_id, attendee_id)
);

-- Note: We assume the `handle_updated_at` function and trigger utility already exist from previous migrations.
-- If not, you would need to create them. For simplicity, we are not creating a separate trigger for this table's `updated_at`
-- as it's less likely to be updated frequently. The `completed_at` is the primary timestamp.
