import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import boundaries from 'eslint-plugin-boundaries'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      boundaries,
    },
    settings: {
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**/*' },
        {
          type: 'feature',
          pattern: 'src/features/*',
          mode: 'folder',
          capture: ['name'],
        },
        { type: 'shared', pattern: 'src/shared/**/*' },
        { type: 'root', pattern: 'src/{main,vite-env}.{ts,tsx,d.ts}' },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          rules: [
            {
              from: { type: 'root' },
              allow: [
                { to: { type: 'root' } },
                { to: { type: 'app' } },
                { to: { type: 'feature' } },
                { to: { type: 'shared' } },
              ],
            },
            {
              from: { type: 'app' },
              allow: [
                { to: { type: 'app' } },
                { to: { type: 'shared' } },
                { to: { type: 'feature', internalPath: 'index.{ts,tsx}' } },
              ],
            },
            {
              from: { type: 'feature' },
              allow: [
                { to: { type: 'shared' } },
                { to: { type: 'feature', internalPath: 'index.{ts,tsx}' } },
              ],
            },
            {
              from: { type: 'shared' },
              allow: [{ to: { type: 'shared' } }],
            },
          ],
        },
      ],
    },
  },
])
