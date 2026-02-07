-- MIGRATION: UNIVERSAL RESERVE (TRAITS & SPECIALIZATIONS)
-- This enables global items and inheritance for traits and specializations.

-- 1. Allow Global Traits & Specializations (setting_id = NULL)
ALTER TABLE libraries_traits ALTER COLUMN setting_id DROP NOT NULL;
ALTER TABLE libraries_specializations ALTER COLUMN setting_id DROP NOT NULL;

-- 2. Add Missing Columns (Flexible / Precision support)
ALTER TABLE libraries_traits ADD COLUMN IF NOT EXISTS is_variable BOOLEAN DEFAULT false;
ALTER TABLE libraries_traits ADD COLUMN IF NOT EXISTS effects JSONB DEFAULT '[]'::jsonb;
ALTER TABLE libraries_skills ADD COLUMN IF NOT EXISTS is_variable BOOLEAN DEFAULT false;
ALTER TABLE libraries_backgrounds ADD COLUMN IF NOT EXISTS is_variable BOOLEAN DEFAULT false;

-- 2. Create Relation Tables for Picking (Inheritance)
-- Traits
CREATE TABLE IF NOT EXISTS rel_setting_traits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_id UUID REFERENCES game_settings(id) ON DELETE CASCADE,
    trait_id UUID REFERENCES libraries_traits(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(setting_id, trait_id)
);

-- Specializations
CREATE TABLE IF NOT EXISTS rel_setting_specializations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_id UUID REFERENCES game_settings(id) ON DELETE CASCADE,
    specialization_id UUID REFERENCES libraries_specializations(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(setting_id, specialization_id)
);

-- 3. Security (RLS)
ALTER TABLE rel_setting_traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE rel_setting_specializations ENABLE ROW LEVEL SECURITY;

-- 4. Update Policies for libraries_traits (Read Global + Local)
DROP POLICY IF EXISTS "Public Read Traits" ON libraries_traits;
CREATE POLICY "Public Read Traits" ON libraries_traits
FOR SELECT TO anon, authenticated
USING (
    setting_id IS NULL                                -- 1. Global Items
    OR
    setting_id IN (                                   -- 2. Items from Public Settings
        SELECT id FROM game_settings WHERE is_public = true
    )
    OR
    auth.role() = 'authenticated'                     -- 3. Admin Access
);

-- 5. Update Policies for libraries_specializations (Read Global + Local)
DROP POLICY IF EXISTS "Public Read Specializations" ON libraries_specializations;
CREATE POLICY "Public Read Specializations" ON libraries_specializations
FOR SELECT TO anon, authenticated
USING (
    setting_id IS NULL                                -- 1. Global Items
    OR
    setting_id IN (                                   -- 2. Items from Public Settings
        SELECT id FROM game_settings WHERE is_public = true
    )
    OR
    auth.role() = 'authenticated'                     -- 3. Admin Access
);

-- 6. Policies for Join Tables
DROP POLICY IF EXISTS "Read Traits Joins" ON rel_setting_traits;
CREATE POLICY "Read Traits Joins" ON rel_setting_traits FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin Write Traits Joins" ON rel_setting_traits;
CREATE POLICY "Admin Write Traits Joins" ON rel_setting_traits FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Read Specs Joins" ON rel_setting_specializations;
CREATE POLICY "Read Specs Joins" ON rel_setting_specializations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin Write Specs Joins" ON rel_setting_specializations;
CREATE POLICY "Admin Write Specs Joins" ON rel_setting_specializations FOR ALL TO authenticated USING (true) WITH CHECK (true);
