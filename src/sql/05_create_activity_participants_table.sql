-- Tabel perantara (junction table) untuk melacak peserta yang mengikuti setiap aktivitas
CREATE TABLE activity_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    attendee_id UUID NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    score INT,
    completed_at TIMESTAMPTZ,
    
    -- Memastikan seorang peserta hanya bisa bergabung dengan satu aktivitas sekali
    CONSTRAINT unique_activity_attendee UNIQUE (activity_id, attendee_id)
);

COMMENT ON COLUMN activity_participants.score IS 'Skor yang didapat peserta dalam aktivitas (jika ada)';
COMMENT ON COLUMN activity_participants.completed_at IS 'Waktu ketika peserta menyelesaikan aktivitas';

-- Index untuk mempercepat query
CREATE INDEX idx_activity_participants_activity_id ON activity_participants(activity_id);
CREATE INDEX idx_activity_participants_attendee_id ON activity_participants(attendee_id);
