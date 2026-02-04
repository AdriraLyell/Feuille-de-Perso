
import { createClient } from '@supabase/supabase-js';

// Access environment variables (Vite prefix is required)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase Environment Variables. Please check .env file.');
}


export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
);


// Helper to check connection
export const checkSupabaseConnection = async () => {
    try {
        const { error } = await supabase.from('game_settings').select('count', { count: 'exact', head: true });
        if (error) throw error;
        return true;
    } catch (e) {
        console.error('Supabase Connection Error:', e);
        return false;
    }
};
