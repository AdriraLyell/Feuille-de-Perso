
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '.env') });

const supabaseUrl: string = process.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey: string = process.env.VITE_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase Environment Variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAll() {
    const { data, error } = await supabase
        .from('libraries_counters')
        .select('*')
        .ilike('name', 'test%');

    if (error) console.error("Error:", error);
    else {
        console.log("ALL_COUNTERS_START");
        console.log(JSON.stringify(data, null, 2));
        console.log("ALL_COUNTERS_END");
    }
}

checkAll();
