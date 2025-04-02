# Active Context: Fluxus (Core Providers & Docs Implemented)

**Current Focus:** Updating Memory Bank after implementing core providers and
documentation site. Awaiting next task.

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
- Resolved various TypeScript configuration issues and test failures during
  development.

**Next Steps (Potential):**

1. **Refinement:**
   - Refine `asyncProvider`/`streamProvider` (e.g., cancellation, advanced
     re-fetch/re-subscribe options).
   - Investigate remaining test failure (`computedProvider` auto-dispose
     scenario).
   - Investigate persistent TypeScript errors in `hooks.test.tsx`
     (`toHaveTextContent`).
   - Add provider names/IDs for better debugging.
2. **New Features:**
   - Add utility functions (e.g., `pipe`, `debounce`).
3. **Framework Adapters:**
   - Plan/Implement Vue adapter.
   - Plan/Implement Angular adapter.
4. **Documentation:**
   - Add "Comparison with Riverpod" page.
   - Add more examples and advanced guides.
   - Improve API documentation generation/presentation.

**Active Decisions/Considerations:**

- Core library remains zero-dependency.
- Auto-disposal is the default lifecycle; no explicit `keepAlive`.
- Provider definition primarily function-based.
- `ScopeReader` provides capabilities (`read`, `watch`, `onDispose`) via
  arguments.
- Documentation uses VitePress, deployed via GitHub Actions.
