-- Fix: Add missing 'last_updated' column
ALTER TABLE game_settings 
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ DEFAULT NOW();

-- Ensure other columns expected by AdminService exist (just in case)
ALTER TABLE game_settings 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- Update existing rows to have a valid date
UPDATE game_settings SET last_updated = NOW() WHERE last_updated IS NULL;
