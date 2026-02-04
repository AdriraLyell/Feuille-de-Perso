-- SECURE RLS SETUP
-- This script replaces the permissive development policies with production-ready security policies.

-- 1. Reset Policies (Clean Slate)
-- We drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anon Select Settings" ON game_settings;
DROP POLICY IF EXISTS "Anon Insert Settings" ON game_settings;
DROP POLICY IF EXISTS "Anon Update Settings" ON game_settings;
DROP POLICY IF EXISTS "Anon Delete Settings" ON game_settings;

DROP POLICY IF EXISTS "Anon Full Access Traits" ON libraries_traits;
DROP POLICY IF EXISTS "Anon Full Access Skills" ON libraries_skills;
DROP POLICY IF EXISTS "Anon Full Access Specializations" ON libraries_specializations;

-- Ensure RLS is enabled
ALTER TABLE game_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE libraries_traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE libraries_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE libraries_specializations ENABLE ROW LEVEL SECURITY;

-- =====================================================================================
-- TABLE: game_settings
-- =====================================================================================

-- READ: 
-- Authenticated: ALL
-- Anon: Only Public settings
CREATE POLICY "Public Read Settings" ON game_settings
FOR SELECT TO anon, authenticated
USING (
    is_public = true 
    OR 
    auth.role() = 'authenticated'
);

-- WRITE (Insert, Update, Delete): 
-- Authenticated: ALLOW
-- Anon: DENY
CREATE POLICY "Admin Write Settings" ON game_settings
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);


-- =====================================================================================
-- TABLE: libraries_traits
-- =====================================================================================

-- READ: 
-- Linked to a Public setting OR User is Authenticated
CREATE POLICY "Public Read Traits" ON libraries_traits
FOR SELECT TO anon, authenticated
USING (
    setting_id IN (SELECT id FROM game_settings WHERE is_public = true)
    OR
    auth.role() = 'authenticated'
);

-- WRITE: 
-- Authenticated Only
CREATE POLICY "Admin Write Traits" ON libraries_traits
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);


-- =====================================================================================
-- TABLE: libraries_skills
-- =====================================================================================

CREATE POLICY "Public Read Skills" ON libraries_skills
FOR SELECT TO anon, authenticated
USING (
    setting_id IN (SELECT id FROM game_settings WHERE is_public = true)
    OR
    auth.role() = 'authenticated'
);

CREATE POLICY "Admin Write Skills" ON libraries_skills
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);


-- =====================================================================================
-- TABLE: libraries_specializations
-- =====================================================================================

CREATE POLICY "Public Read Specializations" ON libraries_specializations
FOR SELECT TO anon, authenticated
USING (
    setting_id IN (SELECT id FROM game_settings WHERE is_public = true)
    OR
    auth.role() = 'authenticated'
);

CREATE POLICY "Admin Write Specializations" ON libraries_specializations
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- End of Script
