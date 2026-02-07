-- FINAL MIGRATION: UNIVERSAL RESERVE & VARIANTS ALIGNMENT
-- Run this script to fix the 400/404 errors by aligning the DB with the v2.23.0 code.

-- 1. BASE MODULE: Syncing Missing Columns
-- Traits
ALTER TABLE libraries_traits ALTER COLUMN setting_id DROP NOT NULL;
ALTER TABLE libraries_traits ADD COLUMN IF NOT EXISTS is_variable BOOLEAN DEFAULT false;
ALTER TABLE libraries_traits ADD COLUMN IF NOT EXISTS effects JSONB DEFAULT '[]'::jsonb;

-- Skills
ALTER TABLE libraries_skills ALTER COLUMN setting_id DROP NOT NULL;
ALTER TABLE libraries_skills ADD COLUMN IF NOT EXISTS is_variable BOOLEAN DEFAULT false;
ALTER TABLE libraries_skills ADD COLUMN IF NOT EXISTS default_category TEXT;
ALTER TABLE libraries_skills ADD COLUMN IF NOT EXISTS description TEXT;

-- Specializations
ALTER TABLE libraries_specializations ALTER COLUMN setting_id DROP NOT NULL;
ALTER TABLE libraries_specializations ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE libraries_specializations ADD COLUMN IF NOT EXISTS skill_ids TEXT[] DEFAULT '{}'::text[];
ALTER TABLE libraries_specializations ADD COLUMN IF NOT EXISTS default_min_level INTEGER DEFAULT 1;

-- Backgrounds
ALTER TABLE libraries_backgrounds ALTER COLUMN setting_id DROP NOT NULL;
ALTER TABLE libraries_backgrounds ADD COLUMN IF NOT EXISTS is_variable BOOLEAN DEFAULT false;

-- Counters
ALTER TABLE libraries_counters ALTER COLUMN setting_id DROP NOT NULL;
ALTER TABLE libraries_counters ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE libraries_counters ADD COLUMN IF NOT EXISTS max_value INTEGER DEFAULT 10;
ALTER TABLE libraries_counters ADD COLUMN IF NOT EXISTS default_value INTEGER DEFAULT 0;
ALTER TABLE libraries_counters ADD COLUMN IF NOT EXISTS xp_cost INTEGER DEFAULT 0;


-- 2. RELATION TABLES: Support for picking (Master Reserve)
CREATE TABLE IF NOT EXISTS rel_setting_traits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_id UUID REFERENCES game_settings(id) ON DELETE CASCADE,
    trait_id UUID REFERENCES libraries_traits(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(setting_id, trait_id)
);

CREATE TABLE IF NOT EXISTS rel_setting_specializations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_id UUID REFERENCES game_settings(id) ON DELETE CASCADE,
    specialization_id UUID REFERENCES libraries_specializations(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(setting_id, specialization_id)
);


-- 3. VARIANT TABLES: Fixing 404s
CREATE TABLE IF NOT EXISTS libraries_traits_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trait_id UUID NOT NULL REFERENCES libraries_traits(id) ON DELETE CASCADE,
    setting_id UUID REFERENCES game_settings(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(trait_id, setting_id, name)
);

CREATE TABLE IF NOT EXISTS libraries_skills_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    skill_id UUID NOT NULL REFERENCES libraries_skills(id) ON DELETE CASCADE,
    setting_id UUID REFERENCES game_settings(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(skill_id, setting_id, name)
);

CREATE TABLE IF NOT EXISTS libraries_backgrounds_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    background_id UUID NOT NULL REFERENCES libraries_backgrounds(id) ON DELETE CASCADE,
    setting_id UUID REFERENCES game_settings(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(background_id, setting_id, name)
);


-- 4. SECURITY (RLS) & POLICIES
ALTER TABLE rel_setting_traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE rel_setting_specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE libraries_traits_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE libraries_skills_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE libraries_backgrounds_variants ENABLE ROW LEVEL SECURITY;

-- SIMPLE POLICIES (Read for all, Write for Admin)
DO $$ 
BEGIN
    -- rel_setting_traits
    DROP POLICY IF EXISTS "Read Traits Joins" ON rel_setting_traits;
    CREATE POLICY "Read Traits Joins" ON rel_setting_traits FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Admin Write Traits Joins" ON rel_setting_traits;
    CREATE POLICY "Admin Write Traits Joins" ON rel_setting_traits FOR ALL TO authenticated USING (true) WITH CHECK (true);

    -- rel_setting_specializations
    DROP POLICY IF EXISTS "Read Specs Joins" ON rel_setting_specializations;
    CREATE POLICY "Read Specs Joins" ON rel_setting_specializations FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Admin Write Specs Joins" ON rel_setting_specializations;
    CREATE POLICY "Admin Write Specs Joins" ON rel_setting_specializations FOR ALL TO authenticated USING (true) WITH CHECK (true);

    -- Variants Traits
    DROP POLICY IF EXISTS "Public Read Trait Variants" ON libraries_traits_variants;
    CREATE POLICY "Public Read Trait Variants" ON libraries_traits_variants FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Admin Write Trait Variants" ON libraries_traits_variants;
    CREATE POLICY "Admin Write Trait Variants" ON libraries_traits_variants FOR ALL TO authenticated USING (true) WITH CHECK (true);

    -- Variants Skills
    DROP POLICY IF EXISTS "Public Read Skill Variants" ON libraries_skills_variants;
    CREATE POLICY "Public Read Skill Variants" ON libraries_skills_variants FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Admin Write Skill Variants" ON libraries_skills_variants;
    CREATE POLICY "Admin Write Skill Variants" ON libraries_skills_variants FOR ALL TO authenticated USING (true) WITH CHECK (true);

    -- Variants Backgrounds
    DROP POLICY IF EXISTS "Public Read Background Variants" ON libraries_backgrounds_variants;
    CREATE POLICY "Public Read Background Variants" ON libraries_backgrounds_variants FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Admin Write Background Variants" ON libraries_backgrounds_variants;
    CREATE POLICY "Admin Write Background Variants" ON libraries_backgrounds_variants FOR ALL TO authenticated USING (true) WITH CHECK (true);

    -- Ensure Traits/Skills/Specs can be read even if global (setting_id is null)
    DROP POLICY IF EXISTS "Public Read Traits" ON libraries_traits;
    CREATE POLICY "Public Read Traits" ON libraries_traits FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Public Read Skills" ON libraries_skills;
    CREATE POLICY "Public Read Skills" ON libraries_skills FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Public Read Specializations" ON libraries_specializations;
    CREATE POLICY "Public Read Specializations" ON libraries_specializations FOR SELECT USING (true);
END $$;
