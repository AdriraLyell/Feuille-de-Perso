
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkColumns(tableName) {
    console.log(`\n--- Columns in ${tableName} ---`);
    const { data, error } = await supabase.rpc('check_columns', { t_name: tableName });

    // If RPC doesn't exist, we'll try a raw query via a temporary function or just assume RPC exists for this test
    if (error) {
        // Fallback: try to use a select from information_schema if the user has a custom RPC or just try to get column names via postgrest if possible
        // Actually, Supabase doesn't allow direct selection from information_schema via PostgREST by default.
        // We'll try to insert a "dummy" row and see the error or just assume our migration script had an issue.
        console.error(`Error for ${tableName}:`, error.message);
        return;
    }
    console.log(data);
}

async function run() {
    // We'll try to just check if we can get ANY info.
    // Since I can't create an RPC easily without the user's manual help, 
    // I'll try to insert a malformed object to see the specific "missing column" error from Supabase.

    const tables = ['libraries_traits', 'libraries_skills', 'libraries_specializations'];
    for (const table of tables) {
        console.log(`\n--- Testing ${table} with a dummy insert ---`);
        const { error } = await supabase.from(table).insert({ id: '00000000-0000-0000-0000-000000000000', non_existent_column_test: true });
        if (error) {
            console.log(`Response for ${table}:`, error.message);
        }
    }
}

run();
