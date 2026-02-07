
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkTable(tableName) {
    console.log(`\n--- Checking ${tableName} ---`);
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    if (error) {
        console.error(`Error reading ${tableName}:`, error.message);
    } else {
        const columns = data[0] ? Object.keys(data[0]) : "No data to check columns";
        console.log(`Columns in ${tableName}:`, columns);
    }
}

async function run() {
    await checkTable('libraries_traits');
    await checkTable('libraries_skills');
    await checkTable('libraries_specializations');
    await checkTable('libraries_backgrounds');
    await checkTable('libraries_counters');
    await checkTable('rel_setting_traits');
}

run();
