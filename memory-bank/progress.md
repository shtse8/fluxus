# Progress: Fluxus (Refactoring Complete)

**Current Status:** Core provider implementations (`state`, `computed`, `async`,
`stream`) and basic React adapter are functional. Documentation site with
auto-deployment is set up. Initial refactoring phase addressing known issues and
setting up linting/formatting is complete. Focus can now shift towards further
refinement, features, or documentation.

**What Works:**

- Project setup complete (`package.json`, `tsconfig.json`, `tsup.config.ts`).
- Core types defined (`src/types.ts`), including `AsyncValue`,
  `ProviderOverride`, and `ProviderOptions`.
- `Scope` class implemented (`src/scope.ts`) with:
  - State management for different provider types.
  - `read()` method supporting overrides and improved error messages (with
    provider names).
  - `updater()` method supporting overrides and improved error messages.
  - `watch()` method for subscriptions with improved warnings.
  - `dispose()` method for scope cleanup.
  - Dependency tracking for re-computation/re-execution.
  - Auto-disposal based on listener count (fixed related test failure).
  - Improved error/warning messages using provider names.
- `stateProvider` factory implemented, tested, and updated to accept
  `ProviderOptions`.
- `computedProvider` factory implemented, tested (all tests passing), and
  updated to accept `ProviderOptions`.
- `asyncProvider` factory implemented (including re-execution on dependency
  change), tested, and updated to accept `ProviderOptions`.
- `streamProvider` factory implemented (including re-subscription on dependency
  change), tested, and updated to accept `ProviderOptions`.
- Provider Overrides implemented and tested.
- React adapter (`react-adapter/`) implemented with:
  - `ProviderScope` component (supports overrides).
  - `useProvider` hook (using `useSyncExternalStore`).
  - `useProviderUpdater` hook.
  - Integration tests passing (TypeScript errors resolved).
- Testing setup complete (`vitest`, `jsdom`, `@testing-library/react`, `rxjs`).
  All tests passing.
- TSDoc comments added to core files.
- Basic `README.md` created.
- Documentation site using VitePress created (`docs/`).
  - Includes homepage, guide pages for core concepts, providers, lifecycle,
    overrides.
  - TypeDoc integration generates API docs (`docs/api/generated`).
  - Build process includes TypeDoc generation and markdown fixes
    (`replace-in-file`).
- GitHub Actions workflow set up for automatic deployment to GitHub Pages.
- `.gitignore` configured.
- ESLint and Prettier set up and configured (`eslint.config.js`,
  `.prettierrc.cjs`).
- Codebase passes formatting (`npm run format`) and linting (`npm run lint`)
  checks (with `no-explicit-any` rule temporarily disabled).

**What's Left To Build (Next Steps - Potential):**

1. **Refinement:**
   - Address remaining `no-explicit-any` warnings and re-enable the
     corresponding ESLint rule.
   - Refine `asyncProvider`/`streamProvider` (cancellation, advanced options).
2. **New Features:**
   - Utility functions (`pipe`, `debounce`, etc.).
3. **Framework Adapters:**
   - Plan/Implement Vue adapter.
   - Plan/Implement Angular adapter.
4. **Documentation:**
   - Add "Comparison with Riverpod" page.
   - Add more examples and advanced usage guides.
   - Improve API documentation presentation (e.g., better sidebar generation).

**Known Issues:**

- The `@typescript-eslint/no-explicit-any` ESLint rule is currently disabled in
  `eslint.config.js` due to numerous warnings (approx. 50). These should be
  addressed incrementally to improve type safety.

**Blockers:**

- None currently.
