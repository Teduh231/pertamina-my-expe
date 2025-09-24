-- Create the transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booth_id UUID NOT NULL REFERENCES booths(id) ON DELETE CASCADE,
    attendee_id UUID NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
    attendee_name TEXT NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name TEXT NOT NULL,
    points_spent INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies for transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Allow admin users full access
CREATE POLICY "Allow admin full access on transactions"
ON transactions
FOR ALL
TO service_role
USING (true);

-- Allow tenants to read transactions for their own booth
CREATE POLICY "Allow tenant to read transactions for own booth"
ON transactions
FOR SELECT
USING (
    (get_my_claim('role')::text = 'admin') OR
    (booth_id IN (SELECT booth_id FROM tenants WHERE id = auth.uid()))
);

-- Allow authenticated users (tenants) to create transactions for their own booth
CREATE POLICY "Allow tenant to create transactions for own booth"
ON transactions
FOR INSERT
WITH CHECK (
    (get_my_claim('role')::text = 'admin') OR
    (booth_id IN (SELECT booth_id FROM tenants WHERE id = auth.uid()))
);
