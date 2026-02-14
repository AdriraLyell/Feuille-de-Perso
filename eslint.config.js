import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        languageOptions: {
            parserOptions: {
                project: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: {
            'jsx-a11y': jsxA11y,
        },
        rules: {
            'no-unreachable': 'error',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            ...jsxA11y.configs.recommended.rules,
            'jsx-a11y/label-has-associated-control': ['warn', {
                assert: 'either',
                depth: 3,
                controlComponents: ['input', 'select', 'textarea'],
            }],
            'jsx-a11y/no-static-element-interactions': 'warn',
            'jsx-a11y/click-events-have-key-events': 'warn',
            'jsx-a11y/no-autofocus': 'warn',
        },
    },
    {
        ignores: [
            'dist/**',
            'node_modules/**',
            'scripts/**',
            '*.config.js',
            '*.config.ts',
        ],
    }
);
