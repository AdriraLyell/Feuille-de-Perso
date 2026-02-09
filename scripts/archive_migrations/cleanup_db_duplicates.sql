-- 1. Create Links for Shadowed Skills
-- This finds all local skills that have the same name as a global skill.
-- It creates a "Selection" link for them in rel_setting_skills.
INSERT INTO rel_setting_skills (setting_id, skill_id, is_active)
SELECT 
    local_skill.setting_id, 
    global_skill.id, 
    true
FROM libraries_skills local_skill
JOIN libraries_skills global_skill 
    ON lower(trim(local_skill.name)) = lower(trim(global_skill.name))
WHERE local_skill.setting_id IS NOT NULL 
  AND global_skill.setting_id IS NULL
ON CONFLICT (setting_id, skill_id) DO NOTHING;

-- 2. Delete the Redundant Local Skills
-- Now that links are created, we remove the local "Shadow" copies.
DELETE FROM libraries_skills
WHERE id IN (
    SELECT local_skill.id
    FROM libraries_skills local_skill
    JOIN libraries_skills global_skill 
        ON lower(trim(local_skill.name)) = lower(trim(global_skill.name))
    WHERE local_skill.setting_id IS NOT NULL 
      AND global_skill.setting_id IS NULL
);
