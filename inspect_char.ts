
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

async function inspectLastCharacters() {
    console.log("Fetching characters...");
    const { data: characters, error } = await supabase
        .from('characters_sheets')
        .select('id, name, data, updated_at')
        .order('updated_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error fetching characters:", error);
        return;
    }

    if (!characters || characters.length === 0) {
        console.log("No characters found.");
        return;
    }

    for (const char of characters) {
        console.log(`\n--- Character: ${char.name} (${char.id}) updated at ${char.updated_at} ---`);
        const data = char.data as any;

        // 1. Check in skills (categories)
        let found = false;
        Object.keys(data.skills || {}).forEach(catId => {
            const list = data.skills[catId];
            if (Array.isArray(list)) {
                list.forEach((s: any) => {
                    if (s.name?.toLowerCase().includes('test')) {
                        console.log(`[Skills/${catId}] ${s.name}: val=${s.value}, creationValue=${s.creationValue}, id=${s.id}`);
                        found = true;
                    }
                });
            }
        });

        // 2. Check in data.counters.custom
        if (data.counters?.custom) {
            data.counters.custom.forEach((c: any) => {
                if (c.name?.toLowerCase().includes('test')) {
                    console.log(`[Counters/Custom] ${c.name}: val=${c.value}, creationValue=${c.creationValue}, id=${c.id}`);
                    found = true;
                }
            });
        }
        if (!found) console.log("No 'test' counters found on this sheet.");
    }
}

await inspectLastCharacters();
