
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testColumns(tableName, columns) {
    console.log(`\n--- Testing ${tableName} ---`);
    for (const col of columns) {
        const payload = { id: '00000000-0000-0000-0000-000000000000' };
        payload[col] = (col === 'effects' || col === 'tags' || col === 'skill_ids') ? [] : (col === 'is_variable' ? false : 'test');

        const { error } = await supabase.from(tableName).insert(payload);
        if (error && error.message.includes('Could not find the column')) {
            console.log(`❌ Column [${col}] is MISSING in ${tableName}`);
        } else if (error && error.code === '23505') {
            console.log(`✅ Column [${col}] exists in ${tableName} (Duplicate ID error is fine)`);
        } else if (error) {
            console.log(`❓ Column [${col}] in ${tableName} returned error: ${error.message} (${error.code})`);
        } else {
            console.log(`✅ Column [${col}] exists in ${tableName} (Insert succeeded)`);
            // Cleanup the dummy insert if it succeeded
            await supabase.from(tableName).delete().eq('id', '00000000-0000-0000-0000-000000000000');
        }
    }
}

async function run() {
    await testColumns('libraries_traits', ['type', 'name', 'cost', 'description', 'tags', 'is_variable', 'effects']);
    await testColumns('libraries_skills', ['name', 'description', 'default_category', 'is_variable']);
    await testColumns('libraries_specializations', ['name', 'description', 'skill_ids', 'default_min_level']);
}

run();
