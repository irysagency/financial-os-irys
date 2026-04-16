-- SQL to create the transactions table in Supabase
-- This table is designed to store transactions synced from Qonto.

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qonto_transaction_id TEXT UNIQUE NOT NULL, -- The unique ID from Qonto
  amount DECIMAL(15, 2) NOT NULL,
  label TEXT,
  side TEXT CHECK (side IN ('debit', 'credit')),
  settled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups by Qonto ID
CREATE INDEX IF NOT EXISTS idx_transactions_qonto_id ON transactions(qonto_transaction_id);

-- Enable RLS (Row Level Security) if needed
-- ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Note: Make sure to set QONTO_SLUG, QONTO_SECRET, QONTO_IBAN, 
-- NEXT_PUBLIC_SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY 
-- in your Vercel/environment variables.
