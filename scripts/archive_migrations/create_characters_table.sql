-- Migration: Create Characters Table for Player Sync
-- Run this script in Supabase SQL Editor

-- 1. Create the characters table
CREATE TABLE IF NOT EXISTS characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_id UUID REFERENCES game_settings(id) ON DELETE SET NULL,
    character_name TEXT NOT NULL,
    player_name TEXT NOT NULL,
    data JSONB NOT NULL,
    last_synced TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate characters for same campaign/player/name combo
    -- Note: setting_id can be NULL for "orphaned" characters
    UNIQUE(setting_id, character_name, player_name)
);

-- 1b. ENSURE constraint is ON DELETE SET NULL (in case table already existed)
ALTER TABLE characters 
DROP CONSTRAINT IF EXISTS characters_setting_id_fkey;

ALTER TABLE characters 
ADD CONSTRAINT characters_setting_id_fkey 
FOREIGN KEY (setting_id) 
REFERENCES game_settings(id) 
ON DELETE SET NULL;

-- 2. Create index for fast lookups by campaign
CREATE INDEX IF NOT EXISTS idx_characters_setting ON characters(setting_id);

-- 3. Enable Row Level Security
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if any (for clean re-run)
DROP POLICY IF EXISTS "Anon Sync Characters" ON characters;
DROP POLICY IF EXISTS "Anon Insert Characters" ON characters;
DROP POLICY IF EXISTS "Anon Update Characters" ON characters;
DROP POLICY IF EXISTS "Anon Select Characters" ON characters;
DROP POLICY IF EXISTS "Admin Read Characters" ON characters;

-- 5. RLS Policy: Public (unauthenticated) users can INSERT new characters
-- Note: Supabase uses 'public' role for anonymous/unauthenticated users
CREATE POLICY "Anon Insert Characters" ON characters
FOR INSERT TO public
WITH CHECK (true);

-- 6. RLS Policy: Public users can UPDATE existing characters
CREATE POLICY "Anon Update Characters" ON characters
FOR UPDATE TO public
USING (true)
WITH CHECK (true);

-- 7. RLS Policy: Public users can SELECT to check existence (needed for upsert)
CREATE POLICY "Anon Select Characters" ON characters
FOR SELECT TO public
USING (true);

-- 8. RLS Policy: Authenticated users (Admin) can read all characters
CREATE POLICY "Admin Read Characters" ON characters
FOR SELECT TO authenticated
USING (true);

-- Verification: Check table was created
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'characters'
ORDER BY ordinal_position;
