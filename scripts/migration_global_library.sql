-- MIGRATION: GLOBAL SKILL LIBRARY
-- Run this in the Supabase SQL Editor

-- 1. Allow Global Skills (setting_id = NULL)
ALTER TABLE libraries_skills ALTER COLUMN setting_id DROP NOT NULL;

-- 2. Create Selection Table (Link between Campaign and Skill)
CREATE TABLE IF NOT EXISTS rel_setting_skills (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_id uuid REFERENCES game_settings(id) ON DELETE CASCADE,
    skill_id uuid REFERENCES libraries_skills(id) ON DELETE CASCADE,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    UNIQUE(setting_id, skill_id)
);

-- 3. Enable Security
ALTER TABLE rel_setting_skills ENABLE ROW LEVEL SECURITY;

-- 4. Update Policies for libraries_skills (Read Global + Local)
DROP POLICY IF EXISTS "Public Read Skills" ON libraries_skills;
CREATE POLICY "Public Read Skills" ON libraries_skills
FOR SELECT TO anon, authenticated
USING (
    setting_id IS NULL                                -- 1. Global Skills
    OR
    setting_id IN (                                   -- 2. Skills from Public Settings
        SELECT id FROM game_settings WHERE is_public = true
    )
    OR
    auth.role() = 'authenticated'                     -- 3. Admin Access
);

-- 5. Policies for new Join Table (Simple for now)
-- Allow Reading everything (since visibility is controlled by the skill/setting)
CREATE POLICY "Read Joins" ON rel_setting_skills FOR SELECT TO anon, authenticated USING (true);
-- Allow Admin to Write
CREATE POLICY "Write Joins" ON rel_setting_skills FOR ALL TO authenticated USING (true) WITH CHECK (true);
