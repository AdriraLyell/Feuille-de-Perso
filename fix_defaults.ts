
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

async function fix() {
    console.log("Attempting to reset defaults with anon key...");
    const { data, error, count } = await supabase
        .from('libraries_counters')
        .update({ default_value: 0 })
        .in('name', ['testa', 'testb', 'testc'])
        .select();

    if (error) {
        console.error("Error:", error.message);
    } else {
        console.log(`Update completed. Rows affected: ${data?.length || 0}`);
        console.log("Updated data:", data);
    }
}

fix();
