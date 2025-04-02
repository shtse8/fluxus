# Progress: Fluxus (Docs: API Sidebar Improvement)

**Current Status:** Core provider implementations (`state`, `computed`, `async`,
`stream`), basic React adapter, and core utilities (`pipe`, `debounce`) are
functional. Cancellation features for async and stream providers have been
implemented and tested. Added `keepPreviousDataOnError` option to
`asyncProvider`. Documentation site with auto-deployment is set up, including
pages for Riverpod comparison and a guide on combining providers (with
examples). **The API documentation sidebar structure has been improved to mirror
the generated TypeDoc output.** Initial refactoring phase addressing known
issues and setting up linting/formatting is complete. Most `no-explicit-any`
ESLint warnings have been addressed. Memory Bank is updated. Focus can shift
towards further refinement, features, or documentation.

**What Works:**

- Project setup complete (`package.json`, `tsconfig.json`, `tsup.config.ts`).
- Core types defined (`src/types.ts`), including `AsyncValue`,
  `ProviderOverride`, `ProviderOptions`, and **`AsyncProviderOptions`**.
  `ScopeReader` now includes optional `signal`. Most `any` types replaced.
- `Scope` class implemented (`src/scope.ts`) with:
  - State management for different provider types.
  - `read()` method supporting overrides and improved error messages (with
    provider names).
  - `updater()` method supporting overrides and improved error messages.
  - `watch()` method for subscriptions with improved warnings.
  - `dispose()` method for scope cleanup.
  - Dependency tracking for re-computation/re-execution.
  - Auto-disposal based on listener count (fixed related test failure).
  - **Cancellation:** `dispose()` reliably triggers `streamProvider` unsubscribe
    via callbacks. `_executeAsyncProvider` passes `AbortSignal` via
    `ScopeReader`, handles cancellation/re-execution correctly, and **now stores
    `lastSuccessfulData` to implement `keepPreviousDataOnError`**.
  - Improved error/warning messages using provider names.
  - Most `any` types replaced with `unknown` or specific types.
- `stateProvider` factory implemented, tested, updated to accept
  `ProviderOptions`, and internal `any` types removed.
- `computedProvider` factory implemented, tested (all tests passing), updated to
  accept `ProviderOptions`, and internal `any` types removed.
- `asyncProvider` factory implemented (including re-execution on dependency
  change), tested, updated to accept **`AsyncProviderOptions`**, **supports
  cancellation via `AbortSignal`**, and **implements
  `keepPreviousDataOnError`**. All tests passing.
- `streamProvider` factory implemented (including re-subscription on dependency
  change), tested, updated to accept `ProviderOptions`, and **now reliably
  cancels subscription on disposal**.
- Provider Overrides implemented and tested.
- React adapter (`react-adapter/`) implemented with:
  - `ProviderScope` component (supports overrides).
  - `useProvider` hook (using `useSyncExternalStore`), `any` types removed.
  - `useProviderUpdater` hook.
  - Integration tests passing (TypeScript errors resolved).
- Testing setup complete (`vitest`, `jsdom`, `@testing-library/react`, `rxjs`).
  All tests passing (including cancellation and `keepPreviousDataOnError`
  tests). `any` types removed or disabled where intentional. Test assertion
  failures fixed.
- TSDoc comments added to core files.
- Basic `README.md` created.
- Documentation site using VitePress created (`docs/`).
  - Includes homepage, guide pages for core concepts, providers, lifecycle,
    overrides, Riverpod comparison, and a guide on Combining Providers (with
    examples). **`asyncProvider` guide updated with `keepPreviousDataOnError`
    option.**
  - Sidebar configuration (`.vitepress/config.mts`) updated for new pages and
    **restructured for improved API documentation navigation**.
  - TypeDoc integration generates API docs (`docs/api/generated`).
  - Build process includes TypeDoc generation and markdown fixes
    (`replace-in-file`).
- GitHub Actions workflow set up for automatic deployment to GitHub Pages.
- `.gitignore` configured.
- ESLint and Prettier set up and configured (`eslint.config.js`,
  `.prettierrc.cjs`).
- Codebase passes formatting (`npm run format`) and linting (`npm run lint`)
  checks (with `no-explicit-any` rule set to `warn`).
- **Utilities:**
  - `pipe` utility function implemented and tested (`src/utils/pipe.ts`).
  - `debounce` utility function implemented and tested
    (`src/utils/debounce.ts`).

**What's Left To Build (Next Steps - Potential):**

1. **Refinement:**
   - ~~Add `keepPreviousDataOnError` option to `asyncProvider`.~~ (Done)
   - Further refine `asyncProvider`/`streamProvider` (advanced options like
     re-fetch/re-subscribe strategies).
2. **New Features:**
   - ~~Utility functions (`pipe`, `debounce`, etc.).~~ (Done)
3. **Framework Adapters:**
   - Plan/Implement Vue adapter.
   - Plan/Implement Angular adapter.
4. **Documentation:**
   - ~~Add "Comparison with Riverpod" page.~~ (Done)
   - Add more examples and advanced usage guides (Started: Combining Providers).
   - Improve API documentation presentation (Sidebar structure improved, further
     enhancements like better generation possible).

**Known Issues:**

- The `@typescript-eslint/no-explicit-any` ESLint rule is currently set to
  `warn` in `eslint.config.js`. This is due to persistent difficulties in
  reliably disabling the rule for specific intentional `any` casts in test files
  (`scope.test.ts`) using `eslint-disable-line` comments, which seem to conflict
  with Prettier formatting or ESLint parsing. The remaining warnings correspond
  to these intentional test cases.

**Blockers:**

- None currently.
