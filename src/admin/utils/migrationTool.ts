import { supabase } from '../../services/supabase';
import { INITIAL_DATA } from '../../data/initialState';
import { LibrarySkillEntry } from '../../types';
import { ErrorService } from '../../services/ErrorService';
import { logger } from '../../utils/logger';

export const migrateGlobalSkills = async () => {
    logger.log("Starting Migration of Global Skills...");
    const skills = INITIAL_DATA.skillLibrary || [];

    if (skills.length === 0) {
        return { success: false, message: "No initial skills items found." };
    }



    // 1. Check if we already have global skills (safety check)
    const { count, error: countError } = await supabase
        .from('libraries_skills')
        .select('*', { count: 'exact', head: true })
        .is('setting_id', null);

    if (countError) {
        return { success: false, message: "Error checking DB: " + countError.message };
    }

    if (count && count > 0) {
        return { success: true, message: `Skipped: ${count} global skills already exist.` };
    }

    // 2. Insert Skills in Batches
    // We map internal ID -> new UUID if needed, but initialState uses string factories. 
    // Supabase needs UUIDs for the ID column.

    const payload = skills.map((s: LibrarySkillEntry) => ({
        id: crypto.randomUUID(), // Force new UUIDs for the DB
        name: s.name,
        description: s.description || "",
        default_category: s.defaultCategory,
        is_variable: s.isVariable,
        setting_id: null // Explicitly Global
    }));

    const { error: insertError } = await supabase
        .from('libraries_skills')
        .insert(payload);

    if (insertError) {
        ErrorService.handleError(insertError, { context: 'migrationTool.migrateGlobalSkills', userMessage: "Erreur lors de la migration des compétences globales." });
        return { success: false, message: insertError.message };
    }

    return { success: true, message: `Successfully inserted ${payload.length} global skills.` };
};
