/**
 * ESLint (Phase 4-d, QA audit E-3) — flat config, TypeScript-first.
 *
 * The repo's quality bar was tsc-only before this; the stray
 * `eslint-disable react-hooks/exhaustive-deps` comments around the codebase
 * were aspirational no-ops. This config starts at the recommended
 * typescript-eslint level (not strict-type-checked — that lands as a
 * follow-up once the codebase is clean under it) plus the react-hooks rules
 * that actually protect this codebase's correctness.
 *
 * CI runs `pnpm lint` after typecheck (see .github/workflows/ci.yml).
 */

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  // Ignore build output, deps, and generated files.
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',
      // wrangler-dev generated bundles (gitignored) — 2026-10-19: scanning them yields ~2000 false errors after any local boot
      '**/.wrangler/**',
      'apps/web/public/**',
      'legacy/**',
      'legacy-captures/**',
    ],
  },

  // Base JS + TS recommended for every source file.
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // The browser SPA.
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // eslint-plugin-react-hooks v6 ships React-compiler-grade rules that
      // error by default. Two classes here:
      //  - rules-of-hooks stays an ERROR (it catches real crash bugs — it
      //    found NextUpStrip's conditional useMemo in this very session).
      //  - The compiler-grade advisories below flag the app's DESIGNED
      //    patterns: effects that hydrate from localStorage and setState
      //    synchronously (the standard SPA-hydration shape used across the
      //    routes), refs read during render in event plumbing, and
      //    memoization-preservation notices. Restructuring ~20 hydration
      //    effects is behavior-adjacent churn — out of scope for a hygiene
      //    pass. They stay VISIBLE as warnings; promoting them to errors is
      //    the documented follow-up (docs/QA/audit-2026-10-14.md §E-3).
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/memo-dependencies': 'warn',
      'react-hooks/use-memo': 'warn',
      'react-hooks/void-use-memo': 'warn',
    },
  },

  // The Workers + shared packages (Node tooling + Workers runtime globals).
  {
    files: ['apps/api/src/**/*.ts', 'apps/markets/src/**/*.ts', 'packages/*/src/**/*.ts', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // Test files: vitest globals where used, and deliberately loose on
  // no-console (tests log expectations on purpose).
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/fixtures/**'],
    rules: {
      'no-console': 'off',
    },
  },

  // House rules: the codebase keeps console.* for Workers observability —
  // lint never blocks an operator-visible log line.
  {
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          // Deliberate API-shape parameters (e.g. buildDollarMeasure's
          // source/runDate signature parity) are documented, not accidental.
          // (A duplicate argsIgnorePattern:'^_' key was removed by the lint
          // pass — the later key already won at runtime, so effective
          // behavior is unchanged; unused _-prefixed args must be removed.)
          argsIgnorePattern: '^(?:source|runDate)$',
          varsIgnorePattern: '^_',
          caughtErrors: 'none',
        },
      ],
    },
  },
);
