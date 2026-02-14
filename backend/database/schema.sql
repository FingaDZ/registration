-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(50) UNIQUE NOT NULL,
    document_type VARCHAR(20) NOT NULL CHECK (document_type IN ('particuliers', 'entreprise')),
    user_data JSONB NOT NULL,
    file_path_fr VARCHAR(500) NOT NULL,
    file_path_ar VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_documents_reference ON documents(reference);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists, then create it
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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
