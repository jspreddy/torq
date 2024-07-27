import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import jestPlugin from 'eslint-plugin-jest';
import globals from 'globals';

// WTF is tseslint.config(): https://typescript-eslint.io/packages/typescript-eslint#config
// It is there to provide typed and autocompleted experience for editing configs.

// How to use it: https://typescript-eslint.io/packages/typescript-eslint#usage-with-other-plugins
// Still needed to disable some type checking rules to get the config to not throw type errors for jest plugin.

const config = tseslint.config(
    {
        // global ignores for eslint.
        ignores: [
            ".github/",
            ".idea/",
            ".vscode/",
            "dist/",
            "reference_material/",
        ],
    },
    {
        plugins: {
            '@typescript-eslint': tseslint.plugin,
        },
        extends: [
            eslint.configs.recommended,
            ...tseslint.configs.recommended,
        ],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: true,
                tsconfigRootDir: import.meta.dirname,
            },
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            globals: {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                ...globals.node,
            }
        },
        rules: {
            '@typescript-eslint/no-unsafe-argument': 'error',
            '@typescript-eslint/no-unsafe-assignment': 'error',
            '@typescript-eslint/no-unsafe-call': 'error',
            '@typescript-eslint/no-unsafe-member-access': 'error',
            '@typescript-eslint/no-unsafe-return': 'error',
        },
    },

    {
        files: ['src/**/*.js'],
        ...tseslint.configs.disableTypeChecked, // disable type-aware linting on JS files
    },

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    {
        // enable jest rules on test files
        files: [
            'tests/**',
            '**/*.test.js'
        ],
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        ...jestPlugin.configs['flat/recommended'],
    },
);

// Run this config using node eslint.config.mjs to see what the it resolves to.
// console.log(config);

export default config;
