# System Patterns: Fluxus (Initial Design)

**Core Components:**

1. **`Provider<T>`:**

   - A function (or potentially an object with a creation function) that defines
     how to create a value `T`.
   - Takes a `ScopeReader` argument to access other providers.
   - Crucially, **Providers are values**, not registered identifiers. They can
     be created dynamically, passed around, and composed.
   - Different types of providers will exist (e.g., `StateProvider`,
     `FutureProvider`, `StreamProvider`, `Computed`).

2. **`Scope`:**

   - An isolated container holding the state of providers instantiated within
     it.
   - Manages the lifecycle of provider states.
   - Provides the mechanism to read provider values (`scope.read(provider)`).
   - Scopes can be nested, allowing for overriding providers locally.
   - Responsible for tracking dependencies between providers.

3. **`ScopeReader`:**
   - An interface passed to provider creation functions.
   - Provides methods like `read(provider)` to access dependencies and
     `watch(provider)` to subscribe to changes (for reactive providers).
   - Also provides access to lifecycle management functions (`onDispose`).

**Reactivity Model:**

- **Pull-based with Push Notifications:** When a provider is read
  (`scope.read`), its value is computed if needed and cached. Dependencies are
  tracked during this computation.
- **Subscription:** UI components or other providers can subscribe
  (`scope.watch` or framework-specific hooks like `useProvider`) to a provider.
- **Change Propagation:** When a provider's state changes (e.g.,
  `StateProvider`'s value is updated), it notifies its direct dependents
  (subscribers).
- **Lazy Computation:** Providers are generally computed only when first read or
  watched within a scope.
- **Automatic Disposal:** When a scope is disposed of, or if a provider is no
  longer watched/needed (configurable), its state is cleaned up via `onDispose`
  callbacks.

**Functional Composition:**

- Providers themselves are composable (a provider can read others).
- Utility functions (potentially using `pipe` or similar) will be provided to
  add features like debouncing, caching strategies, or transformations to
  providers without modifying the core provider definition. Example:
  `const debouncedUserProvider = pipe(userProvider, debounce(300));`

**Dependency Tracking:**

- When `reader.read(depProvider)` or `reader.watch(depProvider)` is called
  within a provider's creation function, a dependency edge is created from
  `depProvider` to the current provider.
- When `depProvider` changes, the current provider is marked as potentially
  stale. If it has active subscribers, it will recompute.
