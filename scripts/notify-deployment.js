
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function notifyDeployment() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('❌ VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing from environment.');
        process.exit(1);
    }

    // Get version from package.json
    const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
    const version = packageJson.version;

    console.log(`🚀 Notifying deployment of version ${version} via Supabase Realtime...`);

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const channel = supabase.channel('app-deployments');

    // Safety timeout to prevent the script from hanging forever
    const timeout = setTimeout(() => {
        console.error('⌛ Timeout: Broadcast took too long. Exiting...');
        process.exit(1);
    }, 15000);

    console.log('📡 Connecting to Supabase Realtime...');

    channel.subscribe(async (status) => {
        console.log(`📡 Subscription status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
            console.log('📤 Sending broadcast message...');
            const result = await channel.send({
                type: 'broadcast',
                event: 'new-version',
                payload: { version },
            });

            if (result === 'ok') {
                console.log('✅ Broadcast sent successfully.');
                clearTimeout(timeout);
                // Give a little time for the message to be sent before exiting
                setTimeout(() => process.exit(0), 2000);
            } else {
                console.error('❌ Failed to send broadcast:', result);
                process.exit(1);
            }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error(`❌ Subscription failed with status: ${status}`);
            process.exit(1);
        }
    });
}

notifyDeployment().catch(err => {
    console.error('💥 Fatal error during deployment notification:', err);
    process.exit(1);
});
