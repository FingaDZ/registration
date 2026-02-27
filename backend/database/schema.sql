-- ============================================================
-- Schema principal - toutes les tables créées au démarrage
-- ============================================================

-- Table: users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'operator' CHECK (role IN ('admin', 'operator')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: documents
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(50) UNIQUE NOT NULL,
    document_type VARCHAR(20) NOT NULL CHECK (document_type IN ('particuliers', 'entreprise')),
    user_data JSONB NOT NULL,
    file_path_fr VARCHAR(500) NOT NULL,
    file_path_ar VARCHAR(500) NOT NULL,
    dolibarr_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: cpe_models
CREATE TABLE IF NOT EXISTS cpe_models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: internet_offers
CREATE TABLE IF NOT EXISTS internet_offers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_documents_reference ON documents(reference);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_dolibarr_id ON documents(dolibarr_id);

-- ============================================================
-- Trigger: updated_at automatique sur documents
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Données initiales
-- ============================================================
INSERT INTO cpe_models (name) VALUES ('Loco5ac') ON CONFLICT (name) DO NOTHING;
INSERT INTO cpe_models (name) VALUES ('LBE-5AC-Gen2') ON CONFLICT (name) DO NOTHING;

INSERT INTO internet_offers (name) VALUES ('15 Mbps (partagée)') ON CONFLICT (name) DO NOTHING;
