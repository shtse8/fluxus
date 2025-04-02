# Tech Context: Fluxus

**Core Language:** TypeScript

- Targeting modern TS features for strong type safety and inference.
- Strict mode enabled.

**Development Environment:**

- Node.js (LTS version recommended)
- Package Manager: `npm` (or `yarn`/`pnpm` as preferred by contributors)

**Build System:**

- **Compiler:** `tsc` (TypeScript compiler) for type checking and potentially
  basic builds.
- **Bundler:** `tsup` (using esbuild) is used for bundling into ESM and CJS
  formats (`tsup.config.ts`).
- **Target:** Modern JavaScript environments (ES2020+), potentially with
  down-leveling for wider compatibility if needed, but prioritizing modern
  targets initially.

**Testing:**

- **Framework:** `vitest` is used (`vitest.config.ts`).
- **React Testing:** `@testing-library/react` and `jsdom` are used for testing
  React components/hooks (`vitest.setup.ts`).
- **Stream Testing:** `rxjs` (specifically `Subject`) is used as a dev
  dependency to simulate streams in tests.
- **Assertions:** Integrated `vitest` assertions (`expect`) are used, extended
  with `@testing-library/jest-dom` matchers.

**Linting/Formatting:**

- **Linter:** ESLint with standard TypeScript plugins
  (`@typescript-eslint/eslint-plugin`).
- **Formatter:** Prettier for consistent code style.
- Configuration files (`.eslintrc.js`, `.prettierrc.js`) have not been added
  yet. (Optional TODO)

**Framework Adapters:**

- **Initial Focus:** React. Adapter will likely use React Hooks (`useState`,
  `useEffect`, `useRef`, `useSyncExternalStore`).
- **Future:** Plan for adapters for Vue, Svelte, Angular, potentially SolidJS.
  The core must remain framework-agnostic.

**Dependencies:**

- **Core:** Zero runtime dependencies.
- **React Adapter:** Peer dependency on `react`.
- **Dev Dependencies:** Include `typescript`, `tsup`, `vitest`,
  `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `rxjs`,
  `vitepress`, `typedoc`, `typedoc-plugin-markdown`, `replace-in-file`.

**Constraints:**

- Maintain high performance and low overhead.
- Ensure excellent type safety and developer experience.
- Keep the core library lean and framework-agnostic.
