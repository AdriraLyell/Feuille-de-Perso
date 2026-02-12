
/**
 * UI Theme Constants - "Mystic & Victorian"
 * Centralized colors and styling tokens for the Lord of Mysteries aesthetic.
 */
export const THEME = {
    colors: {
        primary: {
            main: '#d97706', // Amber-600 (Gold/Brass)
            light: '#f59e0b', // Amber-500
            dark: '#b45309', // Amber-700
            contrastText: '#ffffff'
        },
        secondary: {
            main: '#4338ca', // Indigo-700 (Night/Mystic)
            light: '#6366f1', // Indigo-500
            dark: '#312e81', // Indigo-900 (Deep Void)
            contrastText: '#ffffff'
        },
        tertiary: {
            main: '#9f1239', // Rose-800 (Blood/Crimson)
            light: '#be123c', // Rose-700
            dark: '#881337', // Rose-900
        },
        background: {
            app: '#1c1917', // Stone-900 (Dark background for immersion)
            paper: '#fdfbf7', // Warm Cream (The physical sheet)
            surface: '#292524', // Stone-800 (Cards/Modals in dark mode)
            surfaceLight: '#ffffff', // Cards in light mode
            overlay: 'rgba(12, 10, 9, 0.85)' // Stone-950 alpha
        },
        text: {
            primary: '#1c1917', // Stone-900 (Ink on Paper)
            secondary: '#57534e', // Stone-600 (Muted Ink)
            onDark: '#f5f5f4', // Stone-100 (Text on App BG)
            mutedOnDark: '#a8a29e', // Stone-400
            accent: '#d97706' // Gold text
        },
        status: {
            success: '#15803d', // Green-700
            error: '#b91c1c', // Red-700 (Blood)
            warning: '#b45309', // Amber-700
            info: '#1d4ed8', // Blue-700
            successBg: '#dcfce7',
            errorBg: '#fee2e2',
            warningBg: '#fef3c7',
            infoBg: '#dbeafe'
        },
        grey: {
            50: '#f9fafb',
            100: '#f3f4f6',
            200: '#e5e7eb',
            300: '#d1d5db',
            400: '#9ca3af',
            500: '#6b7280',
            600: '#4b5563',
            700: '#374151',
            800: '#1f2937',
            900: '#111827',
        }
    },
    fonts: {
        heading: '"Cinzel", "Playfair Display", serif',
        body: '"Inter", "Lato", sans-serif',
        hand: '"Patrick Hand", cursive',
        mono: '"Fira Code", monospace'
    },
    spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem',
    },
    borderRadius: {
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
        full: '9999px',
    },
    shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        paper: '0 25px 50px -12px rgba(0, 0, 0, 0.35)', // Deep shadow for floating sheet
        glow: '0 0 15px rgba(217, 119, 6, 0.3)' // Golden glow
    },
    transitions: {
        default: 'all 0.3s ease-in-out',
        fast: 'all 0.15s ease-out',
        slow: 'all 0.5s ease-in-out'
    }
};
