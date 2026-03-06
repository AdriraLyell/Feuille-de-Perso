-- MIGRATION: VARIANT RESERVE for Variable Items
-- Allows predefined or custom variants for Traits and Skills

-- 1. Table for Trait Variants
CREATE TABLE IF NOT EXISTS libraries_traits_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trait_id UUID NOT NULL REFERENCES libraries_traits(id) ON DELETE CASCADE,
    setting_id UUID REFERENCES game_settings(id) ON DELETE CASCADE, -- NULL = Global/Standard variant
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(trait_id, setting_id, name)
);

-- 2. Table for Skill Variants
CREATE TABLE IF NOT EXISTS libraries_skills_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    skill_id UUID NOT NULL REFERENCES libraries_skills(id) ON DELETE CASCADE,
    setting_id UUID REFERENCES game_settings(id) ON DELETE CASCADE, -- NULL = Global/Standard variant
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(skill_id, setting_id, name)
);

-- 3. Table for Background Variants
CREATE TABLE IF NOT EXISTS libraries_backgrounds_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    background_id UUID NOT NULL REFERENCES libraries_backgrounds(id) ON DELETE CASCADE,
    setting_id UUID REFERENCES game_settings(id) ON DELETE CASCADE, -- NULL = Global/Standard variant
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(background_id, setting_id, name)
);

-- 4. Security (RLS)
ALTER TABLE libraries_traits_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE libraries_skills_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE libraries_backgrounds_variants ENABLE ROW LEVEL SECURITY;

-- 5. Policies (Public Read for Global & Local)
DROP POLICY IF EXISTS "Public Read Trait Variants" ON libraries_traits_variants;
CREATE POLICY "Public Read Trait Variants" ON libraries_traits_variants
FOR SELECT TO anon, authenticated
USING (
    setting_id IS NULL 
    OR 
    setting_id IN (SELECT id FROM game_settings WHERE is_public = true) 
    OR 
    auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Admin Write Trait Variants" ON libraries_traits_variants;
CREATE POLICY "Admin Write Trait Variants" ON libraries_traits_variants
FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Skill Variants" ON libraries_skills_variants;
CREATE POLICY "Public Read Skill Variants" ON libraries_skills_variants
FOR SELECT TO anon, authenticated
USING (
    setting_id IS NULL 
    OR 
    setting_id IN (SELECT id FROM game_settings WHERE is_public = true) 
    OR 
    auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Admin Write Skill Variants" ON libraries_skills_variants;
CREATE POLICY "Admin Write Skill Variants" ON libraries_skills_variants
FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Background Variants" ON libraries_backgrounds_variants;
CREATE POLICY "Public Read Background Variants" ON libraries_backgrounds_variants
FOR SELECT TO anon, authenticated
USING (
    setting_id IS NULL 
    OR 
    setting_id IN (SELECT id FROM game_settings WHERE is_public = true) 
    OR 
    auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Admin Write Background Variants" ON libraries_backgrounds_variants;
CREATE POLICY "Admin Write Background Variants" ON libraries_backgrounds_variants
FOR ALL TO authenticated USING (true) WITH CHECK (true);
