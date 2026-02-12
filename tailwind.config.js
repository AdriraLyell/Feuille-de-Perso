/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./admin.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // App Backgrounds
                'mystic-stone': '#1c1917', // Stone 900
                'mystic-deep': '#0c0a09',  // Stone 950
                'mystic-surface': '#292524', // Stone 800
                'paper-cream': '#fdfbf7', // Original Paper

                // Accents
                'amber-gold': '#d97706', // Primary Action
                'amber-glow': '#f59e0b',
                'crimson-blood': '#9f1239', // Rose 800
                'void-indigo': '#312e81', // Indigo 900
            },
            fontFamily: {
                serif: ['"Cinzel"', '"Playfair Display"', 'serif'],
                sans: ['"Inter"', '"Lato"', 'sans-serif'],
                hand: ['"Patrick Hand"', 'cursive'],
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                'paper': '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
                'glow-gold': '0 0 15px rgba(217, 119, 6, 0.3)',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'spin-slow': 'spin 3s linear infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
