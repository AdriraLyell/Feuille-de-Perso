-- REPAIR & ALIGN MIGRATION (v2.23.0)
-- Run this if you still have 400/404 errors during Library Imports or Sync.

-- 1. NULLABILITY & BASE COLUMNS (Ensure Master Reserve support)
DO $$ 
BEGIN
    -- Traits
    ALTER TABLE libraries_traits ALTER COLUMN setting_id DROP NOT NULL;
    ALTER TABLE libraries_traits ADD COLUMN IF NOT EXISTS is_variable BOOLEAN DEFAULT false;
    ALTER TABLE libraries_traits ADD COLUMN IF NOT EXISTS effects JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE libraries_traits ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::text[];
    ALTER TABLE libraries_traits ADD COLUMN IF NOT EXISTS description TEXT;

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
    ALTER TABLE libraries_backgrounds ADD COLUMN IF NOT EXISTS description TEXT;

    -- Counters
    ALTER TABLE libraries_counters ALTER COLUMN setting_id DROP NOT NULL;
    ALTER TABLE libraries_counters ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE libraries_counters ADD COLUMN IF NOT EXISTS max_value INTEGER DEFAULT 10;
    ALTER TABLE libraries_counters ADD COLUMN IF NOT EXISTS default_value INTEGER DEFAULT 0;
    ALTER TABLE libraries_counters ADD COLUMN IF NOT EXISTS xp_cost INTEGER DEFAULT 0;
END $$;


-- 2. ENSURE VARIANT TABLES EXIST
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


-- 3. FIX RLS POLICIES (Full Write for Admin, Public Read for All)
-- We use a loop for cleanup and fresh creation to avoid "policy already exists" errors
DO $$ 
DECLARE
    t_name TEXT;
    tables TEXT[] := ARRAY[
        'libraries_traits', 'libraries_skills', 'libraries_specializations', 
        'libraries_backgrounds', 'libraries_counters',
        'rel_setting_traits', 'rel_setting_skills', 'rel_setting_specializations',
        'rel_setting_backgrounds', 'rel_setting_counters',
        'libraries_traits_variants', 'libraries_skills_variants', 'libraries_backgrounds_variants'
    ];
BEGIN
    FOREACH t_name IN ARRAY tables LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t_name);
        
        -- Drop old policies (guessing common names)
        EXECUTE format('DROP POLICY IF EXISTS "Public Read" ON %I', t_name);
        EXECUTE format('DROP POLICY IF EXISTS "Admin Write" ON %I', t_name);
        EXECUTE format('DROP POLICY IF EXISTS "Read all" ON %I', t_name);
        EXECUTE format('DROP POLICY IF EXISTS "Admin all" ON %I', t_name);
        
        -- Create Absolute Policies
        -- Policy 1: Everyone can read
        EXECUTE format('CREATE POLICY "Public Read %s" ON %I FOR SELECT USING (true)', t_name, t_name);
        
        -- Policy 2: Authenticated (Admin) can do EVERYTHING
        EXECUTE format('CREATE POLICY "Admin Write %s" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t_name, t_name);
    END LOOP;
END $$;
