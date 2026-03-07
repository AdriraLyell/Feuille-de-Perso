-- MIGRATION: Add missing columns for counter library persistence
-- These columns are used by the code but were never added to the DB schema.
-- Run this in the Supabase SQL Editor.

-- 1. Add formula_id to libraries_counters (for formula-based counters like reserves)
ALTER TABLE libraries_counters ADD COLUMN IF NOT EXISTS formula_id UUID;

-- 2. Add default_category to rel_setting_counters (for counter placement in skill columns)
ALTER TABLE rel_setting_counters ADD COLUMN IF NOT EXISTS default_category TEXT;
