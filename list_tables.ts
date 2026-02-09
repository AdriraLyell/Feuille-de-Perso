
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listTables() {
    try {
        console.log("Querying RPC for tables...");
        // Some supabase setups have a common RPC for this
        const { data, error } = await supabase.rpc('get_tables');
        if (error) {
            console.log("RPC get_tables failed, trying direct select from pg_catalog if possible (often restricted)...");
            console.log("Error:", error.message);

            // Try standard project tables to see which ones work
            const tables = ['game_settings', 'libraries_counters', 'characters_sheets', 'profiles'];
            for (const t of tables) {
                const { error: e } = await supabase.from(t).select('id').limit(1);
                console.log(`Table '${t}': ${e ? 'ERROR: ' + e.message : 'OK'}`);
            }
        } else {
            console.log("Tables:", data);
        }
    } catch (e: any) {
        console.error("Catch:", e.message);
    }
}

listTables();
