# Progress: Fluxus (Core Providers & Docs Implemented)

**Current Status:** Core provider implementations (`state`, `computed`, `async`,
`stream`) and basic React adapter are functional. Documentation site with
auto-deployment is set up. Focus is shifting towards refinement, further
documentation, and potentially new framework adapters.

**What Works:**

- Project setup complete (`package.json`, `tsconfig.json`, `tsup.config.ts`).
- Core types defined (`src/types.ts`), including `AsyncValue` and
  `ProviderOverride`.
- `Scope` class implemented (`src/scope.ts`) with:
  - State management for different provider types.
  - `read()` method supporting overrides.
  - `updater()` method supporting overrides.
  - `watch()` method for subscriptions.
  - `dispose()` method for scope cleanup.
  - Dependency tracking for re-computation/re-execution.
  - Auto-disposal based on listener count.
- `stateProvider` factory implemented and tested.
- `computedProvider` factory implemented and tested (except for one auto-dispose
  scenario).
- `asyncProvider` factory implemented (including re-execution on dependency
  change) and tested.
- `streamProvider` factory implemented (including re-subscription on dependency
  change) and tested.
- Provider Overrides implemented and tested.
- React adapter (`react-adapter/`) implemented with:
  - `ProviderScope` component (supports overrides).
  - `useProvider` hook (using `useSyncExternalStore`).
  - `useProviderUpdater` hook.
  - Integration tests passing (ignoring TS errors).
- Testing setup complete (`vitest`, `jsdom`, `@testing-library/react`, `rxjs`).
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

**What's Left To Build (Next Steps - Potential):**

1. **Refinement:**
   - Investigate and fix failing `computedProvider` auto-dispose test.
   - Investigate and fix persistent TypeScript errors in `hooks.test.tsx`.
   - Refine `asyncProvider`/`streamProvider` (cancellation, advanced options).
   - Add provider names/IDs for debugging.
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

- One test failure in `src/providers/computedProvider.test.ts` related to
  reading a computed provider after its dependency auto-disposes
  (`should fail read if dependency was auto-disposed`). The underlying `read`
  logic seems correct, but the test expectation isn't met.
- Persistent TypeScript errors in `react-adapter/hooks.test.tsx` regarding
  `@testing-library/jest-dom` matchers (`toHaveTextContent`) not being
  recognized by the type checker, despite being present at runtime.

**Blockers:**

- None currently.
