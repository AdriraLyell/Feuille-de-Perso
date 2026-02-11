import { createClient } from '@supabase/supabase-js';
import { ErrorService } from './ErrorService';
import { TABLE_GAME_SETTINGS } from '../constants/db';

// Access environment variables (Vite prefix is required)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Throw early if config is missing
if (!supabaseUrl || !supabaseAnonKey) {
    const missing: string[] = [];
    if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
    if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');

    throw new Error(
        `❌ Missing Supabase environment variables: ${missing.join(', ')}\n` +
        `Please add these to your .env file or environment configuration.`
    );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


// Helper to check connection
export const checkSupabaseConnection = async () => {
    try {
        const { error } = await supabase.from(TABLE_GAME_SETTINGS).select('count', { count: 'exact', head: true });
        if (error) throw error;
        return true;
    } catch (e) {
        ErrorService.handleError(e, { context: 'SupabaseConnection' });
        return false;
    }
};
