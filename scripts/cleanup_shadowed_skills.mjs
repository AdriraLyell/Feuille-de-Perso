
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dgzehhjmibmnokkreric.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnemVoaGptaWJtbm9ra3JlcmljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMDQwOTYsImV4cCI6MjA4NTc4MDA5Nn0._311QQ1JCbtiYbSzmQgmvVdw76T0qGPPhosIqcGyRGc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function cleanup() {
    console.log("--- STARTING DB CLEANUP ---");

    // 1. Fetch All Data
    const { data: allSkills, error } = await supabase
        .from('libraries_skills')
        .select('id, name, setting_id');

    if (error) {
        console.error("Error fetching data:", error);
        return;
    }

    const globals = allSkills.filter(s => s.setting_id === null);
    const locals = allSkills.filter(s => s.setting_id !== null);

    const globalMap = new Map(); // name -> id
    globals.forEach(s => globalMap.set(s.name.trim().toLowerCase(), s.id));

    console.log(`Analyzing ${locals.length} local skills against ${globals.length} global skills...`);

    const linksToCreate = [];
    const idsToDelete = [];

    for (const local of locals) {
        const name = local.name.trim().toLowerCase();
        if (globalMap.has(name)) {
            const globalId = globalMap.get(name);

            // It's a shadow! We should link to global and delete local.
            linksToCreate.push({
                setting_id: local.setting_id,
                skill_id: globalId,
                is_active: true
            });
            idsToDelete.push(local.id);
        }
    }

    if (linksToCreate.length === 0) {
        console.log("No cleanups needed. Database is already optimal.");
        return;
    }

    console.log(`Found ${linksToCreate.length} shadowed skills to convert.`);

    // 2. Insert Links (Ignore duplicates if any constraint, but we act safely)
    // We'll insert in batches or one by one to avoid huge payload, but 100 is fine.

    // Check existing links first to avoid unique constraint violations if unique(setting_id, skill_id) exists
    const { data: existingLinks } = await supabase.from('rel_setting_skills').select('setting_id, skill_id');
    const existingSet = new Set(existingLinks.map(l => `${l.setting_id}:${l.skill_id}`));

    const filteredLinks = linksToCreate.filter(l => !existingSet.has(`${l.setting_id}:${l.skill_id}`));

    if (filteredLinks.length > 0) {
        console.log(`Inserting ${filteredLinks.length} new links...`);
        const { error: insertErr } = await supabase.from('rel_setting_skills').insert(filteredLinks);
        if (insertErr) {
            console.error("Error inserting links:", insertErr);
            return;
        }
    } else {
        console.log("All necessary links already existed.");
    }

    // 3. Delete Shadows
    console.log(`Deleting ${idsToDelete.length} redundant local records...`);
    const { error: deleteErr } = await supabase
        .from('libraries_skills')
        .delete()
        .in('id', idsToDelete);

    if (deleteErr) {
        console.error("Error deleting records:", deleteErr);
    } else {
        console.log("Cleanup Success!");
    }
}

cleanup();
