-- Gunakan skrip ini untuk membuat ulang tabel attendees dari awal
-- dengan phone_number sebagai pengganti email.
-- PENTING: Ini akan menghapus tabel attendees yang ada dan semua datanya.

-- Hapus tabel yang ada jika ada
DROP TABLE IF EXISTS attendees;

-- Buat kembali tabel attendees dengan phone_number
CREATE TABLE attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL UNIQUE,
    registered_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    custom_response TEXT,
    qr_code_url TEXT,
    points INTEGER DEFAULT 100 NOT NULL
);

-- Skrip untuk menambahkan relasi antara check_ins dan attendees

-- 1. (Opsional tapi aman) Hapus constraint lama jika ada, untuk menghindari error jika dijalankan ulang
ALTER TABLE IF EXISTS public.check_ins DROP CONSTRAINT IF EXISTS check_ins_attendee_id_fkey;

-- 2. Hapus semua data check-in yang tidak memiliki attendee yang valid (data yatim)
-- Ini adalah langkah penting untuk membersihkan data sebelum menambahkan constraint.
DELETE FROM public.check_ins
WHERE attendee_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1
    FROM public.attendees
    WHERE public.attendees.id = public.check_ins.attendee_id
);

-- 3. Tambahkan foreign key constraint dengan ON DELETE CASCADE
-- ON DELETE CASCADE akan secara otomatis menghapus check-in jika attendee terkait dihapus.
ALTER TABLE IF EXISTS public.check_ins
ADD CONSTRAINT check_ins_attendee_id_fkey
FOREIGN KEY (attendee_id)
REFERENCES public.attendees (id)
ON DELETE CASCADE;
