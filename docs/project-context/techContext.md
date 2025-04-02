# Tech Context: Fluxus (Initial Setup)

**Core Language:** TypeScript

- Targeting modern TS features for strong type safety and inference.
- Strict mode enabled.

**Development Environment:**

- Node.js (LTS version recommended)
- Package Manager: `npm` (or `yarn`/`pnpm` as preferred by contributors)

**Build System:**

- **Compiler:** `tsc` (TypeScript compiler) for type checking and potentially
  basic builds.
- **Bundler:** Likely `tsup` (uses esbuild) for efficient bundling into multiple
  formats (ESM, CJS). This simplifies configuration compared to raw `tsc` or
  more complex bundlers like Webpack/Rollup for library development.
- **Target:** Modern JavaScript environments (ES2020+), potentially with
  down-leveling for wider compatibility if needed, but prioritizing modern
  targets initially.

**Testing:**

- **Framework:** `vitest` is a strong candidate due to its speed, compatibility
  with Vite ecosystem, and modern features. `jest` is another possibility.
- **Assertions:** Use the assertion library integrated with the chosen test
  framework.

**Linting/Formatting:**

- **Linter:** ESLint with standard TypeScript plugins
  (`@typescript-eslint/eslint-plugin`).
- **Formatter:** Prettier for consistent code style.
- Configuration files (`.eslintrc.js`, `.prettierrc.js`) will be added.

**Framework Adapters:**

- **Initial Focus:** React. Adapter will likely use React Hooks (`useState`,
  `useEffect`, `useSyncExternalStore`).
- **Future:** Plan for adapters for Vue, Svelte, Angular, potentially SolidJS.
  The core must remain framework-agnostic.

**Dependencies (Anticipated Core - Minimal):**

- None initially. The goal is a zero-dependency core library. Framework adapters
  will have peer dependencies on the respective frameworks (e.g., `react`).

**Constraints:**

- Maintain high performance and low overhead.
- Ensure excellent type safety and developer experience.
- Keep the core library lean and framework-agnostic.
