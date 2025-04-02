# Active Context: Fluxus (Docs: Combining Providers Guide Added)

**Current Focus:** Updating Memory Bank after adding the "Combining Providers"
documentation guide.

**Recent Changes:**

- Completed initial project setup (`package.json`, `tsconfig.json`,
  `tsup.config.ts`).
- Created all core Memory Bank files.
- Defined core types (`Provider`, `ScopeReader`, `Dispose`, `Disposable`) in
  `src/types.ts`.
- Implemented `Scope` class (`src/scope.ts`) including:
  - Provider state management (`providerStates` Map).
  - `read()` method for accessing provider values.
  - `_createProviderStateStructure()` for lazy initialization.
  - `updater()` method for retrieving `StateProvider` updaters.
  - `watch()` method for subscribing to provider changes.
  - `dispose()` method for scope cleanup.
  - Dependency tracking (`_trackDependency`).
  - Staleness propagation (`markDependentsStale`).
  - Auto-disposal based on listener count in `watch`.
  - Refactored listener handling to `BaseInternalState`.
- Implemented `stateProvider` factory (`src/providers/stateProvider.ts`).
- Implemented `computedProvider` factory (`src/providers/computedProvider.ts`).
- Implemented `asyncProvider` factory (`src/providers/asyncProvider.ts`)
  including:
  - `AsyncValue` type definition (in `types.ts`).
  - Integration into `Scope` for execution and state management
    (loading/data/error).
  - Re-execution on dependency change logic in `Scope`.
  - Unit tests (`asyncProvider.test.ts`).
- Implemented `streamProvider` factory (`src/providers/streamProvider.ts`)
  including:
  - Integration into `Scope` for subscription management and state updates.
  - Re-subscription logic on dependency change in `Scope`.
  - Unit tests (`streamProvider.test.ts`), using `rxjs` as dev dependency.
- Implemented Provider Overrides:
  - Defined `ProviderOverride` type (in `types.ts`).
  - Updated `Scope` constructor to accept overrides.
  - Updated `Scope.read` and `Scope.updater` to respect overrides.
  - Updated `ProviderScope` component (`react-adapter/ProviderScope.tsx`) to
    accept `overrides` prop.
  - Added unit tests (`scope.test.ts`).
- Implemented React adapter (`react-adapter/`) including:
  - `ProviderScope` component (now with override support).
  - `useProvider` hook using `useSyncExternalStore`.
  - `useProviderUpdater` hook.
- Set up testing with `vitest`, `@testing-library/react`, `jsdom`. Wrote
  unit/integration tests for core providers and React hooks.
- Added TSDoc comments to core files and React adapter.
- Created basic `README.md`.
- Set up documentation site using VitePress (`docs/`, `.vitepress/`).
  - Configured basic site structure, theme, sidebar.
  - Added initial guide pages (Introduction, Getting Started, Core Concepts,
    Async, Stream, Lifecycle, Overrides).
  - Added TypeDoc (`typedoc`, `typedoc-plugin-markdown`) to generate API docs
    from TSDoc comments into `docs/api/generated`.
  - Integrated TypeDoc generation into `docs:build` script.
  - Added `replace-in-file` to build script to fix TypeDoc markdown output
    issues.
- Added `.gitignore`.
- Set up GitHub Actions workflow (`.github/workflows/deploy-docs.yml`) to
  automatically build and deploy docs site to GitHub Pages.
- **Refactoring Phase 1:**
  - Fixed failing `computedProvider` auto-dispose test by enabling
    `markDependentsStale` during disposal in `Scope`.
  - Fixed TypeScript errors in `react-adapter/hooks.test.tsx` by updating
    `tsconfig.json` include patterns.
  - Added optional `name` property to providers (`ProviderOptions` in
    `types.ts`, updated factories).
  - Integrated provider names into `Scope` error messages and logs for better
    debugging.
  - Set up ESLint and Prettier: installed dependencies, created config files
    (`eslint.config.js`, `.prettierrc.cjs`), added `lint` and `format` scripts
    to `package.json`.
  - Ran formatter and linter, fixing initial warnings/errors.
- **Linting (`no-explicit-any`):**
  - Replaced most `any` types with `unknown` or more specific types across the
    codebase (`scope.ts`, `types.ts`, provider files, test files).
  - Used `eslint-disable-line` comments in test files (`hooks.test.tsx`,
    `scope.test.ts`) for intentional `any` casts used to test error handling.
  - Set the `@typescript-eslint/no-explicit-any` rule back to `'warn'` in
    `eslint.config.js` due to persistent issues with ESLint/Prettier correctly
    handling the disable comments in `scope.test.ts`.
- **Cancellation Features:**
  - Added optional `signal?: AbortSignal` to `ScopeReader` (`types.ts`).
  - Updated `Scope` (`scope.ts`) to:
    - Pass the `AbortSignal` to `asyncProvider` creation function.
    - Abort previous async operations on re-execution due to dependency changes.
    - Ensure `streamProvider` subscriptions are reliably cancelled via
      `disposeCallbacks`.
  - Updated `asyncProvider` documentation/example (`asyncProvider.ts`).
  - Added cancellation tests to `asyncProvider.test.ts`.
  - Fixed related test assertion failures in multiple files.
- **Documentation (Riverpod Comparison):**
  - Created `docs/guide/comparison-riverpod.md` with initial content.
  - Updated `docs/.vitepress/config.mts` sidebar to include the new comparison
  - **Utilities:**
  - Implemented `pipe` utility function (`src/utils/pipe.ts`) and tests
    (`pipe.test.ts`).
  - Implemented `debounce` utility function (`src/utils/debounce.ts`) and tests
    (`debounce.test.ts`).
- **Documentation (Combining Providers):**
  - Created `docs/guide/combining-providers.md`.
  - Added examples for:
    - Computed state from async data.
    - Async operations triggered by state changes.
    - Using utilities (`debounce`) with providers (conceptual/side-effect
      focus).
  - Updated `docs/.vitepress/config.mts` sidebar to include the new guide.

1. **Refinement:**
   - Refine `asyncProvider`/`streamProvider` (e.g., advanced
     re-fetch/re-subscribe options). Cancellation is now implemented.
2. **New Features:**
   - ~~Add utility functions (e.g., `pipe`, `debounce`).~~ (Done)
3. **Framework Adapters:**
   - Plan/Implement Vue adapter.
   - Plan/Implement Angular adapter.
4. **Documentation:**
   - ~~Add "Comparison with Riverpod" page.~~ (Done)
   - Add more examples and advanced guides (Started: Combining Providers).
   - Improve API documentation generation/presentation.

**Active Decisions/Considerations:**

- Core library remains zero-dependency.
- Auto-disposal is the default lifecycle; no explicit `keepAlive`.
- Provider definition primarily function-based.
- `ScopeReader` provides capabilities (`read`, `watch`, `onDispose`, optional
  `signal`) via arguments.
- Documentation uses VitePress, deployed via GitHub Actions.
- ESLint and Prettier are used for code quality and formatting.
- The `@typescript-eslint/no-explicit-any` rule is set to `warn` due to issues
  disabling it for specific test cases.
