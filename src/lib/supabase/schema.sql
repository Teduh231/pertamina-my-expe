-- Skema ini tidak akan dieksekusi secara otomatis.
-- Anda harus menyalin dan menjalankan kueri ini di Supabase SQL Editor Anda.

-- Hapus tabel yang ada jika perlu (PERHATIAN: INI AKAN MENGHAPUS SEMUA DATA!)
DROP TABLE IF EXISTS attendees CASCADE;

-- Buat tabel attendees baru
CREATE TABLE attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    custom_response TEXT,
    qr_code_url TEXT,
    points INTEGER DEFAULT 100
);

-- Tambahkan constraint unik ke kolom phone_number
ALTER TABLE attendees
ADD CONSTRAINT attendees_phone_number_key UNIQUE (phone_number);

-- Tambahkan foreign key constraint dari check_ins ke attendees
-- Ini akan membuat relasi antara kedua tabel.
ALTER TABLE public.check_ins
ADD CONSTRAINT check_ins_attendee_id_fkey
FOREIGN KEY (attendee_id)
REFERENCES public.attendees (id)
ON DELETE CASCADE;
