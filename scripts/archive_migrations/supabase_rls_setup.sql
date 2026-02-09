-- Enable Row Level Security (RLS) on all tables (Best Practice, even if permissive)
ALTER TABLE game_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE libraries_traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE libraries_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE libraries_specializations ENABLE ROW LEVEL SECURITY;

-- 1. Policies for 'game_settings'
DROP POLICY IF EXISTS "Anon Select Settings" ON game_settings;
CREATE POLICY "Anon Select Settings" ON game_settings FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Anon Insert Settings" ON game_settings;
CREATE POLICY "Anon Insert Settings" ON game_settings FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Anon Update Settings" ON game_settings;
CREATE POLICY "Anon Update Settings" ON game_settings FOR UPDATE TO anon USING (true);

DROP POLICY IF EXISTS "Anon Delete Settings" ON game_settings;
CREATE POLICY "Anon Delete Settings" ON game_settings FOR DELETE TO anon USING (true);


-- 2. Policies for 'libraries_traits'
DROP POLICY IF EXISTS "Anon Full Access Traits" ON libraries_traits;
CREATE POLICY "Anon Full Access Traits" ON libraries_traits FOR ALL TO anon USING (true) WITH CHECK (true);


-- 3. Policies for 'libraries_skills'
DROP POLICY IF EXISTS "Anon Full Access Skills" ON libraries_skills;
CREATE POLICY "Anon Full Access Skills" ON libraries_skills FOR ALL TO anon USING (true) WITH CHECK (true);


-- 4. Policies for 'libraries_specializations'
DROP POLICY IF EXISTS "Anon Full Access Specializations" ON libraries_specializations;
CREATE POLICY "Anon Full Access Specializations" ON libraries_specializations FOR ALL TO anon USING (true) WITH CHECK (true);


-- WARNING: This setup allows ANYONE with your Anon Key to read/write/delete data.
-- Since this is for a local tool or controlled environment (Admin panel hidden), it's acceptable for Development.
-- For Production, you should implement Authentication and restrict Write access to authenticated users only.
