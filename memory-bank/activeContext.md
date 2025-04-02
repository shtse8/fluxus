# Active Context: Fluxus (Post-Vue Integration)

**Current Focus:** Refining documentation, potentially adding more Vue
examples/tests, and planning the next major feature (e.g., Angular adapter).

**Recent Changes:**

- Completed initial project setup (`package.json`, `tsconfig.json`,
  `tsup.config.ts`).
- Created all core Memory Bank files.
- Defined core types (`Provider`, `ScopeReader`, `Dispose`, `Disposable`) in
  `src/types.ts` (including `AsyncProviderOptions`).
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
  - **Added `keepPreviousDataOnError` option:**
    - Defined `AsyncProviderOptions` in `types.ts`.
    - Updated `asyncProvider` factory to accept options.
    - Updated `Scope._executeAsyncProvider` to store `lastSuccessfulData` and
      use it in `AsyncError` and `AsyncLoading` states based on the option.
    - Added tests for the new option.
    - Updated documentation (`docs/guide/async-provider.md`).
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
- **Linting (`no-explicit-any`) Resolution:**
  - Replaced most `any` types with `unknown` or more specific types across the
    codebase.
  - Replaced the problematic `as any` cast in `scope.test.ts` (line 73) with a
    `// @ts-expect-error` directive on the preceding line to handle the
    intentional type error for testing.
  - Updated `eslint.config.js` to set the `@typescript-eslint/no-explicit-any`
    rule to `'error'`.
  - Ran `npm run format` to fix Prettier warnings.
  - Removed unused `ProviderOptions` import from `asyncProvider.ts`.
  - Confirmed the codebase passes `npm run lint` with zero warnings/errors.
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
    - Streams depending on state (e.g., dynamic WebSocket subscription).
- Updated `docs/.vitepress/config.mts` sidebar to include the new guide.
- **Documentation (API Sidebar):**
- Restructured the API sidebar in `docs/.vitepress/config.mts` to mirror the
  TypeDoc generated file structure (`docs/api/generated/`), grouping items by
  Core/React Adapter and then by type (Class, Function, Interface, etc.).
- **ESLint Fix:** Resolved the `no-explicit-any` issue by using
  `@ts-expect-error` in tests and setting the rule to `error` in
  `eslint.config.js`. Ran format and lint checks successfully.
- **Vue Adapter (Initial Implementation):**
  - Created `vue-adapter/` directory and core files (`index.ts`, `hooks.ts`,
    `context.ts`, `ProviderScope.vue`).
  - Implemented `ProviderScope.vue` component for scope creation and provision
    using `provide`/`inject` with `scopeSymbol`.
  - Implemented `useProvider` composable using `inject`, `ref`, `scope.watch`,
    `onScopeDispose`.
  - Implemented `useProviderUpdater` composable, wrapping `scope.updater` to
    provide a simplified API.
  - Added `vue`, `@vue/test-utils`, `@vitejs/plugin-vue` dev dependencies.
  - Configured `vitest.config.ts` with `@vitejs/plugin-vue`.
  - Created initial test suite `vue-adapter/hooks.test.ts`.
  - **Refined Core for Overrides:** Updated `Scope._trackDependency` and
    `Scope.watch` to correctly resolve provider overrides, ensuring dependent
    providers update correctly when dependencies change via overrides.
  - Achieved passing tests for `useProvider` and `useProviderUpdater` with state
    and computed providers, including override scenarios.
- **Vue Adapter (Integration & Docs):**
  - Verified Vue adapter integration into build process (`tsup.config.ts`).
  - Verified Vue adapter exports in `package.json`.
  - Created Vue adapter usage guide (`docs/guide/vue.md`).
  - Verified Vue guide link in documentation sidebar
    (`docs/.vitepress/config.mts`).

**Next Steps (Potential):**

1. **Refinement:**
   - ~~Add `keepPreviousDataOnError` option to `asyncProvider`.~~ (Done)
   - Further refine `asyncProvider`/`streamProvider` (e.g., advanced
     re-fetch/re-subscribe options).
   - Refine Vue adapter tests/features (e.g., more complex scenarios, edge
     cases).
2. **New Features:**
   - ~~Add utility functions (e.g., `pipe`, `debounce`).~~ (Done)
3. **Framework Adapters:**
   - ~~Plan/Implement Vue adapter.~~ (Basic implementation done)
   - ~~Integrate Vue adapter into build process (`tsup.config.ts`).~~ (Done)
   - ~~Add Vue adapter exports to `package.json`.~~ (Done)
   - ~~Add documentation for Vue adapter usage.~~ (Done)
   - Plan/Implement Angular adapter.
4. **Documentation:**
   - ~~Add "Comparison with Riverpod" page.~~ (Done)
   - Add more examples and advanced guides (Started: Combining Providers).
   - Improve API documentation presentation (Sidebar structure improved).

**Active Decisions/Considerations:**

- Core library remains zero-dependency.
- Auto-disposal is the default lifecycle; no explicit `keepAlive`.
- Provider definition primarily function-based.
- `ScopeReader` provides capabilities (`read`, `watch`, `onDispose`, optional
  `signal`) via arguments.
- Documentation uses VitePress, deployed via GitHub Actions.
- ESLint and Prettier are used for code quality and formatting.
- The `@typescript-eslint/no-explicit-any` rule is now set to `error` and
  enforced. Intentional type errors in tests are handled with
  `@ts-expect-error`.
