-- Updates for Phase 7: Dynamic Fields
-- Run this script to update an existing database

-- Create cpe_models table
CREATE TABLE IF NOT EXISTS cpe_models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create internet_offers table
CREATE TABLE IF NOT EXISTS internet_offers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial data for CPE Models
INSERT INTO cpe_models (name) VALUES ('Loco5ac') ON CONFLICT (name) DO NOTHING;
INSERT INTO cpe_models (name) VALUES ('LBE-5AC-Gen2') ON CONFLICT (name) DO NOTHING;

-- Insert initial data for Internet Offers
INSERT INTO internet_offers (name) VALUES ('15 Mbps (partagée)') ON CONFLICT (name) DO NOTHING;
