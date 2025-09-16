--
-- Create the events table
--
CREATE TABLE
  events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    speaker TEXT,
    status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'canceled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone ('utc'::TEXT, NOW()) NOT NULL
  );

--
-- Create the attendees table
--
CREATE TABLE
  attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    event_id UUID REFERENCES events (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone ('utc'::TEXT, NOW()) NOT NULL,
    custom_response TEXT,
    UNIQUE (event_id, email)
  );

--
-- Create the raffles table
--
CREATE TABLE
  raffles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    event_id UUID REFERENCES events (id) ON DELETE CASCADE,
    prize TEXT NOT NULL,
    number_of_winners INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'finished')),
    winners JSONB,
    drawn_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone ('utc'::TEXT, NOW()) NOT NULL,
    eventName TEXT
  );

--
-- Create the products table
--
CREATE TABLE
  products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT NOT NULL,
    points INTEGER NOT NULL,
    stock INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone ('utc'::TEXT, NOW()) NOT NULL
  );

--
-- Create the transactions table
--
CREATE TABLE
  transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL,
    user_name TEXT,
    product_name TEXT NOT NULL,
    points INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone ('utc'::TEXT, NOW()) NOT NULL
  );

--
-- Function to decrement product stock
--
CREATE OR REPLACE FUNCTION decrement_product_stock(p_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET stock = stock - 1
  WHERE id = p_id AND stock > 0;
END;
$$ LANGUAGE plpgsql;