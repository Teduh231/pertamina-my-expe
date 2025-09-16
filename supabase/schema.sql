-- Create the events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT,
    speaker VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('draft', 'published', 'canceled')) DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the attendees table
CREATE TABLE attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    custom_response TEXT,
    UNIQUE(event_id, email)
);

-- Create the raffles table
CREATE TABLE raffles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    eventName VARCHAR(255) NOT NULL,
    prize VARCHAR(255) NOT NULL,
    number_of_winners INT NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL CHECK (status IN ('upcoming', 'active', 'finished')) DEFAULT 'active',
    winners JSONB,
    drawn_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the products table for POS
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    points INT NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the transactions table for POS redemptions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- In a real app, this would reference a users table
    user_name VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    points INT NOT NULL,
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
