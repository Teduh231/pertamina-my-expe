-- Create the events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    speaker TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create the attendees table
CREATE TABLE attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    registered_at TIMESTAMPTZ DEFAULT now(),
    custom_response TEXT,
    UNIQUE(event_id, email)
);

-- Create the raffles table
CREATE TABLE raffles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    eventName TEXT NOT NULL,
    prize TEXT NOT NULL,
    number_of_winners INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active',
    winners JSONB,
    drawn_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    points INTEGER NOT NULL,
    stock INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    user_name TEXT NOT NULL,
    product_name TEXT NOT NULL,
    points INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create a function to decrement stock
CREATE OR REPLACE FUNCTION decrement_product_stock(p_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET stock = stock - 1
  WHERE id = p_id AND stock > 0;
END;
$$ LANGUAGE plpgsql;