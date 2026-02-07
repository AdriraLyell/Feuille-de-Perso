
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function debugImportTraits() {
    console.log("\n--- Debugging importTraits Error ---");
    const payload = [{
        setting_id: "00000000-0000-0000-0000-000000000000", // Dummy ID
        id: "00000000-0000-0000-0000-000000000001",
        type: 'avantage',
        name: 'Debug Trait',
        cost: '0',
        description: 'Test',
        tags: ['test'],
        is_variable: false,
        effects: []
    }];

    const { error } = await supabase.from('libraries_traits').insert(payload);
    if (error) {
        console.log("Full Error Object for Traits:");
        console.log(JSON.stringify(error, null, 2));
    } else {
        console.log("Insert succeeded (unexpectedly)! cleaning up...");
        await supabase.from('libraries_traits').delete().eq('id', payload[0].id);
    }
}

async function debugImportSkills() {
    console.log("\n--- Debugging importSkills Error ---");
    const payload = [{
        setting_id: "00000000-0000-0000-0000-000000000000",
        id: "00000000-0000-0000-0000-000000000002",
        name: 'Debug Skill',
        description: 'Test',
        default_category: 'Col_Comp_1',
        is_variable: false
    }];

    const { error } = await supabase.from('libraries_skills').insert(payload);
    if (error) {
        console.log("Full Error Object for Skills:");
        console.log(JSON.stringify(error, null, 2));
    } else {
        console.log("Insert succeeded (unexpectedly)! cleaning up...");
        await supabase.from('libraries_skills').delete().eq('id', payload[0].id);
    }
}

async function run() {
    await debugImportTraits();
    await debugImportSkills();
}

run();
