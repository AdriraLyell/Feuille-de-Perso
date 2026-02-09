
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase Environment Variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    try {
        console.log("Checking characters table...");
        const { data, error, count } = await supabase
            .from('characters_sheets')
            .select('id, name', { count: 'exact' })
            .limit(5);

        if (error) {
            console.error("Supabase Error:", error.message);
            return;
        }

        console.log(`Found ${count} characters.`);
        console.log(JSON.stringify(data, null, 2));
    } catch (e: any) {
        console.error("Catch error:", e.message);
    }
}

check();
