# Active Context: Fluxus (Core Implementation & React Adapter)

**Current Focus:** Idle / Awaiting Next Task.

**Recent Changes:**

- Completed initial project setup (`package.json`, `tsconfig.json`,
  `tsup.config.ts`).
- Created all core Memory Bank files.
- Defined core types (`Provider`, `ScopeReader`, `Dispose`, `Disposable`) in
  `src/types.ts`.
- Implemented `Scope` class (`src/scope.ts`) including:
  - Provider state management (`providerStates` Map).
  - `read()` method for accessing provider values.
  - `initializeProviderState()` for lazy initialization.
  - `updater()` method for retrieving `StateProvider` updaters.
  - `watch()` method for subscribing to provider changes (used by React
    adapter).
  - `dispose()` method for scope cleanup.
  - Basic dependency tracking (for disposal).
- Implemented `stateProvider` factory (`src/providers/stateProvider.ts`)
  including:
  - `StateProviderInstance` type and type guard.
  - `StateProviderState` internal structure (value, updater, listeners).
  - Notification logic in the updater.
- Renamed React adapter directory from `react` to `react-adapter` to avoid
  import conflicts.
- Implemented basic React adapter (`react-adapter/`) including:
  - `ProviderScope` component for providing the scope via context.
  - `useScope` hook.
  - `useProvider` hook using `useSyncExternalStore` for reactivity.
  - `useProviderUpdater` hook.
- Resolved various TypeScript configuration issues related to module resolution
  (`NodeNext`), JSX, and type inference. Ensured `npm run typecheck` passes.
  - Added testing dependencies (`vitest`, `@testing-library/react`, `jsdom`).
  - Configured `vitest` for React testing (`vitest.config.ts`,
    `vitest.setup.ts`).
  - Wrote and passed unit tests for `Scope` (`src/scope.test.ts`).
  - Wrote and passed unit tests for `stateProvider`
    (`src/providers/stateProvider.test.ts`).
  - Wrote and passed integration tests for React hooks (`useProvider`,
    `useProviderUpdater`) ensuring compatibility with React StrictMode
    (`react-adapter/hooks.test.tsx`).
  - Refactored `ProviderScope` to use `useRef` for stable scope instance across
    StrictMode cycles.
  - Refactored `Scope.updater` and `useProviderUpdater` to handle state lookups
    correctly within closures.
  - Enhanced dependency tracking in `Scope` (`reader.watch`) and implemented
    stale-checking and re-computation logic in `Scope.read`.
  - Implemented `markDependentsStale` method in `Scope` to propagate staleness
    and notify listeners of dependent providers.
  - Implemented auto-disposal of provider state in `Scope.watch` when listener
    count drops to zero.
  - Added tests for auto-disposal behavior.
  - Implemented `computedProvider` factory
    (`src/providers/computedProvider.ts`).
  - Integrated `computedProvider` into `Scope` logic for initialization and
    re-computation.
  - Added tests for `computedProvider`, including dependency tracking and
    re-computation (`src/providers/computedProvider.test.ts`).
  - Added TSDoc comments to core files (`types.ts`, `scope.ts`,
    `stateProvider.ts`, `computedProvider.ts`) and React adapter files
    (`context.ts`, `ProviderScope.tsx`, `hooks.ts`).
  - Created basic `README.md`.
  - Updated main entry point (`src/index.ts`) to export `computedProvider`.

**Next Steps:**

1. **New Features (Lower Priority):**
   - Implement `FutureProvider` / `StreamProvider` (for async operations).
   - Implement provider overrides.
   - Add utility functions (e.g., `pipe`, `debounce`).
2. **Further Refinement/Considerations:**
   - Generalize listener handling in `Scope.watch` beyond just `StateProvider`?
   - Optimize dependency cleanup in `_computeAndCacheValue`?
   - Add provider names/IDs for better debugging.

**Active Decisions/Considerations:**

- Testing Framework: `vitest` confirmed and implemented.
- Auto-Disposal: Implemented based on listener count dropping to zero.
