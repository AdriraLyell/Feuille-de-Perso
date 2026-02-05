
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dgzehhjmibmnokkreric.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnemVoaGptaWJtbm9ra3JlcmljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMDQwOTYsImV4cCI6MjA4NTc4MDA5Nn0._311QQ1JCbtiYbSzmQgmvVdw76T0qGPPhosIqcGyRGc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function analyze() {
    console.log("--- STARTING DB ANALYSIS ---");

    // 1. Get Total Count
    const { count, error: countErr } = await supabase
        .from('libraries_skills')
        .select('*', { count: 'exact', head: true });

    if (countErr) {
        console.error("Error getting count:", countErr);
        return;
    }
    console.log(`Total Skills in DB: ${count}`);

    // 2. Fetch All Data (Chunks if huge, but let's try all for <1000)
    const { data, error } = await supabase
        .from('libraries_skills')
        .select('id, name, setting_id');

    if (error) {
        console.error("Error fetching data:", error);
        return;
    }

    const globals = data.filter(s => s.setting_id === null);
    const locals = data.filter(s => s.setting_id !== null);

    console.log(`Global Skills: ${globals.length}`);
    console.log(`Local Skills: ${locals.length}`);

    // 3. Analyze Global Duplicates
    const globalNames = new Map();
    const globalDuplicates = [];
    globals.forEach(s => {
        const name = s.name.trim().toLowerCase();
        if (globalNames.has(name)) {
            globalDuplicates.push({ name: s.name, id: s.id, existingId: globalNames.get(name) });
        } else {
            globalNames.set(name, s.id);
        }
    });

    if (globalDuplicates.length > 0) {
        console.log(`\n!!! FOUND ${globalDuplicates.length} GLOBAL DUPLICATES !!!`);
        // console.log(globalDuplicates.map(d => d.name).join(', '));
    } else {
        console.log("\nNo Global Duplicates found.");
    }

    // 4. Analyze Local Duplicates (per setting)
    const settingsMap = new Map(); // setting_id -> { name -> id }
    let localDupCount = 0;

    locals.forEach(s => {
        if (!settingsMap.has(s.setting_id)) {
            settingsMap.set(s.setting_id, new Set());
        }
        const seen = settingsMap.get(s.setting_id);
        const name = s.name.trim().toLowerCase();
        if (seen.has(name)) {
            localDupCount++;
        } else {
            seen.add(name);
        }
    });

    if (localDupCount > 0) {
        console.log(`\n!!! FOUND ${localDupCount} LOCAL DUPLICATES (within same setting) !!!`);
    } else {
        console.log("\nNo Local Context Duplicates found.");
    }

    // 5. Check Global vs Local Redundancy (Shadowing)
    // A local skill that has the same name as a global skill is technically a "Shadow/Override"
    // Which is allowed, but we want to know how many.
    let shadowCount = 0;
    locals.forEach(s => {
        const name = s.name.trim().toLowerCase();
        if (globalNames.has(name)) {
            shadowCount++;
        }
    });
    console.log(`\nLocal Skills shadowing Global Skills: ${shadowCount}`);

    console.log("--- ANALYSIS COMPLETE ---");
}

analyze();
