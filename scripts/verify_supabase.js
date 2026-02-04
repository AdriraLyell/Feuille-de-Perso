
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log("--- DEBUG INFO ---");
if (supabaseUrl) {
    const masked = supabaseUrl.length > 10 ? `${supabaseUrl.substring(0, 10)}...` : supabaseUrl;
    console.log(`URL: ${masked} (Length: ${supabaseUrl.length})`);

    if (!supabaseUrl.startsWith('http')) {
        console.error("❌ ERROR: URL does not start with http/https! Check your .env file.");
    }
} else {
    console.log("URL is MISSING");
}

if (supabaseAnonKey) {
    console.log(`Key: ${supabaseAnonKey.substring(0, 5)}... (Length: ${supabaseAnonKey.length})`);
} else {
    console.log("Key is MISSING");
}

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing environment variables!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    console.log('\nTesting Supabase Connection (Query)...');
    try {
        const { data, error } = await supabase.from('game_settings').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Supabase Error:', error.message, error.code);
            if (error.code === '42P01') console.error("💡 Hint: Table 'game_settings' does not exist. Did you run the SQL script?");
        } else {
            console.log('✅ Connection Successful!');
        }
    } catch (e) {
        console.error('❌ Network/Client Error Cause:', e.cause || e.message);
        console.error('Full Error:', e);
    }
}

check();
