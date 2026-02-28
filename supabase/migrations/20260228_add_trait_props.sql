-- Migration to add new persistence columns for Trait properties

ALTER TABLE public.libraries_traits 
ADD COLUMN IF NOT EXISTS has_auto_counter BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_counter_name TEXT,
ADD COLUMN IF NOT EXISTS is_xp_upgradeable BOOLEAN DEFAULT false;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
