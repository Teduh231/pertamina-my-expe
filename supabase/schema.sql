-- Create events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    speaker TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'canceled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create attendees table
CREATE TABLE attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    custom_response TEXT,
    UNIQUE(event_id, email)
);

-- Create raffles table
CREATE TABLE raffles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    prize TEXT NOT NULL,
    number_of_winners INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('upcoming', 'active', 'finished')),
    winners JSONB,
    drawn_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    points INTEGER NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    user_name TEXT,
    product_name TEXT,
    points INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to decrement stock
CREATE OR REPLACE FUNCTION decrement_product_stock(p_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE products
    SET stock = stock - 1
    WHERE id = p_id AND stock > 0;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS for all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE raffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your auth rules)
-- Allow public read access to events that are published
CREATE POLICY "Public can read published events" ON events
    FOR SELECT USING (status = 'published');

-- Allow public read access for all tables (if you want them readable by anyone)
CREATE POLICY "Public read access for products" ON products
    FOR SELECT USING (true);
CREATE POLICY "Public read access for recent transactions" ON transactions
    FOR SELECT USING (true);

-- Allow authenticated users to perform all actions
CREATE POLICY "Allow all for authenticated users" ON events
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON attendees
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON raffles
    FOR ALL USING (auth.role(). = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON products
    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" on transactions
    FOR ALL USING (auth.role() = 'authenticated');

-- Allow anyone to register as an attendee for a published event
CREATE POLICY "Allow public to register for published events" ON attendees
    FOR INSERT WITH CHECK (
        event_id IN (
            SELECT id FROM events WHERE status = 'published'
        )
    );

-- Insert some sample products
INSERT INTO products (name, points, stock) VALUES
('Fuel Voucher 50L', 500, 100),
('Fuel Voucher 25L', 250, 200),
('Pertamina T-Shirt', 200, 50),
('Pertamina Cap', 150, 75),
('Pertamina Tumbler', 100, 150),
('Pertamina Keychain', 50, 300);
