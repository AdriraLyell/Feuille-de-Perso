
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testColumns(tableName, columns) {
    console.log(`\n--- Audit of ${tableName} ---`);
    for (const col of columns) {
        const payload = { id: '00000000-0000-0000-0000-000000000000' };

        // Match expected types to avoid "invalid syntax" errors giving false positives
        if (col === 'effects' || col === 'tags' || col === 'skill_ids') payload[col] = [];
        else if (col === 'is_variable') payload[col] = false;
        else if (col === 'default_min_level' || col === 'max_value' || col === 'default_value' || col === 'xp_cost') payload[col] = 1;
        else payload[col] = 'test';

        const { error } = await supabase.from(tableName).insert(payload);

        if (!error) {
            console.log(`[OK]   ${col}`);
            await supabase.from(tableName).delete().eq('id', '00000000-0000-0000-0000-000000000000');
        } else if (error.message.includes('Could not find the column')) {
            console.log(`[MISS] ${col} <---- !!`);
        } else if (error.code === '23505') {
            console.log(`[OK]   ${col} (exists)`);
        } else {
            console.log(`[ERR]  ${col}: ${error.message} (${error.code})`);
        }
    }
}

async function run() {
    await testColumns('libraries_traits', ['type', 'name', 'cost', 'description', 'tags', 'is_variable', 'effects']);
    await testColumns('libraries_skills', ['name', 'description', 'default_category', 'is_variable']);
    await testColumns('libraries_specializations', ['name', 'description', 'skill_ids', 'default_min_level']);
}

run();
