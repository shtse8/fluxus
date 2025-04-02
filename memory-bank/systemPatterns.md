# System Patterns: Fluxus

**Core Components:**

1. **`Provider<T>`:**
   - A function (or potentially an object with a creation function) that defines
     how to create a value `T`.
   - Takes a `ScopeReader` argument to access other providers.
   - Crucially, **Providers are values**, not registered identifiers. They can
     be created dynamically, passed around, and composed.
   - Implemented provider types: `stateProvider`, `computedProvider`,
     `asyncProvider`, `streamProvider`.

2. **`Scope`:**
   - An isolated container holding the state of providers instantiated within
     it.
   - Manages the lifecycle of provider states.
   - Provides the mechanism to read provider values (`scope.read(provider)`).
   - Scopes can be nested. Overriding providers is supported by passing
     `ProviderOverride[]` to the `Scope` constructor (or `ProviderScope`
     component).
   - Responsible for tracking dependencies between providers.

3. **`ScopeReader`:**
   - An interface passed to provider creation functions.
   - Provides methods like `read(provider)` to access dependencies and
     `watch(provider)` to subscribe to changes.
   - Also provides access to lifecycle management functions (`onDispose`).

**Reactivity Model:**

- **Pull-based with Push Notifications:** When a provider is read
  (`scope.read`), its value is computed if needed and cached. Dependencies are
  tracked during this computation.
- **Subscription:** UI components or other providers can subscribe
  (`scope.watch` or framework-specific hooks like `useProvider`) to a provider.
- **Change Propagation:** When a provider's state changes (e.g.,
  `stateProvider`'s value is updated), it notifies its direct dependents
  (listeners) and marks dependent providers as stale.
- **Lazy Computation:** Providers are generally computed only when first read or
  watched within a scope.
- **Automatic Disposal:** When a scope is disposed of, or when a provider's
  listener count drops to zero, its state is automatically disposed (calling
  `onDispose` callbacks). There is currently no explicit `keepAlive` flag to
  prevent this auto-disposal.

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
  stale. Depending on the provider type, this may trigger:
  - Recomputation (`computedProvider`) on next read.
  - Re-execution (`asyncProvider`) immediately.
  - Re-subscription (`streamProvider`) on next read.
