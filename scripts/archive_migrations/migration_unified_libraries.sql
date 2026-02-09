-- 1. Backgrounds Library
CREATE TABLE IF NOT EXISTS libraries_backgrounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_id UUID REFERENCES game_settings(id) ON DELETE CASCADE, -- NULL = Global
    name TEXT NOT NULL,
    description TEXT,
    is_variable BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Active Selection for Backgrounds
CREATE TABLE IF NOT EXISTS rel_setting_backgrounds (
    setting_id UUID REFERENCES game_settings(id) ON DELETE CASCADE,
    background_id UUID REFERENCES libraries_backgrounds(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    PRIMARY KEY (setting_id, background_id)
);

-- 2. Counters Library
CREATE TABLE IF NOT EXISTS libraries_counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_id UUID REFERENCES game_settings(id) ON DELETE CASCADE, -- NULL = Global
    name TEXT NOT NULL,
    max_value INTEGER DEFAULT 10,
    default_value INTEGER DEFAULT 0,
    xp_cost INTEGER DEFAULT 0, -- Cost per point
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Active Selection for Counters
CREATE TABLE IF NOT EXISTS rel_setting_counters (
    setting_id UUID REFERENCES game_settings(id) ON DELETE CASCADE,
    counter_id UUID REFERENCES libraries_counters(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    PRIMARY KEY (setting_id, counter_id)
);

-- 3. RLS Policies
ALTER TABLE libraries_backgrounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE rel_setting_backgrounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE libraries_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE rel_setting_counters ENABLE ROW LEVEL SECURITY;

-- Public Read (Global) / Private Read (Local)
CREATE POLICY "Public Read Backgrounds" ON libraries_backgrounds FOR SELECT USING (true);
CREATE POLICY "Private Write Backgrounds" ON libraries_backgrounds FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public Read Rel Backgrounds" ON rel_setting_backgrounds FOR SELECT USING (true);
CREATE POLICY "Private Write Rel Backgrounds" ON rel_setting_backgrounds FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public Read Counters" ON libraries_counters FOR SELECT USING (true);
CREATE POLICY "Private Write Counters" ON libraries_counters FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public Read Rel Counters" ON rel_setting_counters FOR SELECT USING (true);
CREATE POLICY "Private Write Rel Counters" ON rel_setting_counters FOR ALL USING (auth.role() = 'authenticated');
