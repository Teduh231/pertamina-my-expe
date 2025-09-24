-- Tabel untuk menyimpan detail aktivitas atau tantangan di setiap booth
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booth_id UUID NOT NULL REFERENCES booths(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- Contoh: 'quiz', 'challenge', 'scavenger_hunt'
    status VARCHAR(50) NOT NULL DEFAULT 'inactive', -- Contoh: 'inactive', 'active', 'finished'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN activities.type IS 'Tipe aktivitas, misalnya quiz atau challenge';
COMMENT ON COLUMN activities.status IS 'Status aktivitas saat ini';

-- Index untuk mempercepat pencarian aktivitas berdasarkan booth
CREATE INDEX idx_activities_booth_id ON activities(booth_id);

-- Trigger untuk memperbarui kolom updated_at secara otomatis
CREATE TRIGGER handle_activities_updated_at
BEFORE UPDATE ON activities
FOR EACH ROW
EXECUTE FUNCTION moddatetime (updated_at);
