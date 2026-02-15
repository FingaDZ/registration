-- Migration: Add Dolibarr integration fields
-- Date: 2025-02-15
-- Purpose: Store the Dolibarr third-party ID for each registered client

ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS dolibarr_id INTEGER;

COMMENT ON COLUMN documents.dolibarr_id IS 'Dolibarr third-party ID for this client';

-- Index for quick lookups by Dolibarr ID
CREATE INDEX IF NOT EXISTS idx_documents_dolibarr_id ON documents(dolibarr_id);
