-- Create the events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location TEXT,
    speaker TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the attendees table
CREATE TABLE attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    custom_response TEXT,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, email)
);

-- Create the raffles table
CREATE TABLE raffles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    prize TEXT NOT NULL,
    number_of_winners INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- upcoming, active, finished
    winners JSONB,
    drawn_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the products table for POS
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    points INTEGER NOT NULL,
    stock INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the transactions table for POS redemptions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    user_name TEXT,
    product_name TEXT NOT NULL,
    points INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a function to decrement product stock
CREATE OR REPLACE FUNCTION decrement_product_stock(p_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET stock = stock - 1
  WHERE id = p_id AND stock > 0;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample products
INSERT INTO products (name, points, stock) VALUES
('Fuel Voucher 50L', 5000, 10),
('Pertamina T-Shirt', 1500, 50),
('Pertamina Hat', 1000, 100),
('Coffee Mug', 750, 75);

-- RLS Policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE raffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policies for public access (events, products)
CREATE POLICY "Public can read all events" ON events FOR SELECT USING (true);
CREATE POLICY "Public can read all products" ON products FOR SELECT USING (true);
CREATE POLICY "Public can create attendees" ON attendees FOR INSERT WITH CHECK (true);

-- Policies for authenticated users (CMS access)
CREATE POLICY "Authenticated users can manage all data" ON events FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage all data" ON attendees FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage all data" ON raffles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage all data" ON products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage all data" ON transactions FOR ALL USING (auth.role() = 'authenticated');
