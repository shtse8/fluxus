# Core Concepts: Scope

If Providers are the _recipes_ for state, the **Scope** is the _kitchen_ where
these recipes are prepared and the resulting dishes (states) are stored and
managed.

## What is a Scope?

A `Scope` is a runtime container object that holds the actual, instantiated
state of the providers used within it. When you ask to `read` a provider, you
always do so within the context of a specific `Scope`.

Key responsibilities of a `Scope`:

1. **State Storage:** It maintains a map of providers to their currently
   computed state (value, listeners, dependencies, etc.).
2. **Lazy Initialization:** When a provider is read for the first time within a
   scope, the scope invokes the provider's recipe function to compute its
   initial state.
3. **Caching:** The computed value of a provider is cached within the scope.
   Subsequent reads of the same provider within that scope will return the
   cached value (unless it needs recomputation due to dependency changes).
4. **Dependency Tracking:** The scope tracks which providers read which other
   providers during their computation. This graph is crucial for reactivity.
5. **Lifecycle Management:** When a scope is no longer needed (e.g., the
   component using `ProviderScope` unmounts), it disposes of the states it
   holds, calling any `onDispose` cleanup functions registered by the providers.
   It also handles automatic disposal of provider state when it's no longer
   being watched (e.g., no active subscribers).
6. **Providing the `ScopeReader`:** The scope creates and passes the
   `ScopeReader` (`read`, `watch`, `onDispose`) argument to the provider
   functions when they are initialized.

## Providing a Scope

You typically don't interact with the `Scope` class directly. Instead, framework
adapters provide components or mechanisms to manage scopes implicitly.

In the React adapter (`fluxus/react-adapter`), the `<ProviderScope>` component
creates a `Scope` instance and makes it available to all descendant components
via React context. Hooks like `useProvider` then access this implicit scope
behind the scenes.

```tsx
import { ProviderScope } from "@shtse8/fluxus/react-adapter";

function App() {
    return (
        // This component creates a Scope instance
        <ProviderScope>
            {/* Components inside here can use Fluxus hooks */}
            <MyFeature />
        </ProviderScope>
    );
}
```

## Nested Scopes & Overrides (Conceptual)

While not fully implemented in the initial version, the design allows for nested
scopes. This means you could potentially have a `<ProviderScope>` inside another
one.

Nested scopes are useful for:

- **Overriding Providers:** A nested scope could provide a different
  implementation or initial value for a provider, affecting only the components
  within that nested scope. This is powerful for testing (mocking dependencies)
  or theming.
- **Isolating State:** Creating temporary or feature-specific scopes to manage
  state independently from the main application scope.

The `Scope` is the engine that makes Fluxus work at runtime, managing the state,
dependencies, and lifecycle of your providers.

Next, let's dive into [Reactivity](./reactivity.md), explaining how Fluxus
handles state changes and updates.
