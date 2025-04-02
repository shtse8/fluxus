# Product Context: Fluxus

**Problem:** Existing TypeScript state management libraries often require
boilerplate (like pre-registering state atoms/stores), can have suboptimal
tree-shaking, might lack strong functional programming ergonomics, or present
challenges with complex asynchronous logic and fine-grained updates. Riverpod in
the Dart ecosystem offers compelling ideas like provider composition and
implicit dependency management that are less common in the JS/TS world.

**Solution:** Fluxus aims to provide a TypeScript-native state management
solution that:

- **Eliminates Registration:** Providers are functions, usable anywhere without
  prior setup in a central store. This inherently solves tree-shaking issues
  related to unused state.
- **Embraces Functional Composition:** Offers a clean, composable API using
  functions (like `pipe`) for creating derived state, handling side effects, and
  managing lifecycles.
- **Optimizes Reactivity:** Implements a highly granular dependency tracking
  system to minimize re-renders and computations.
- **Simplifies Async:** Provides first-class support for asynchronous operations
  within providers using functional patterns.
- **Prioritizes Type Safety:** Leverages TypeScript's advanced features for
  end-to-end type safety.
- **Framework Agnostic Core:** Designs the core logic independently of UI
  frameworks, with dedicated adapters (starting with React).

**User Experience Goals:**

- **Developer Experience (DX):** Intuitive API, minimal boilerplate, excellent
  type inference, easy debugging.
- **Performance:** Efficient updates, low memory overhead.
- **Flexibility:** Easily composable and adaptable to various application
  architectures.
