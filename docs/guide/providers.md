# Core Concepts: Providers

Providers are the most fundamental concept in Fluxus. Think of them as
**declarations** or **recipes** for computing, exposing, and managing a piece of
state.

## What is a Provider?

At its core, a provider is typically a function (or an object containing a
function) that tells Fluxus _how_ to create a value. Crucially, **providers
themselves are just values**.

- **They are not registered:** Unlike many state management libraries where you
  register atoms or stores in a central place, Fluxus providers are defined and
  used directly. You can create them dynamically, pass them around as arguments,
  and import/export them like any other JavaScript value.
- **They are lazy:** The "recipe" defined by a provider is usually only executed
  when the provider's value is first requested within a specific `Scope`.
- **They are composable:** A provider's recipe function often receives a
  `ScopeReader` argument, allowing it to read the values of _other_ providers,
  thus creating dependencies and enabling composition.

```typescript
import { computedProvider, stateProvider } from '@shtse8/fluxus';

// Provider for a simple configuration value (could come from anywhere)
const apiUrlProvider = () => 'https://api.example.com';

// Provider for mutable user preferences
const themeProvider = stateProvider<'light' | 'dark'>('light');

// Provider that computes derived data by reading other providers
const userSettingsProvider = computedProvider((read) => {
  // Read the current values of other providers
  const apiUrl = read(apiUrlProvider);
  const theme = read(themeProvider);

  return {
    apiUrl,
    theme,
    // ... other settings
  };
});
```

## The `ScopeReader`

When a provider's recipe function is executed by Fluxus (within a `Scope`), it
receives a `ScopeReader` object as its argument (often named `read`, `get`, or
`ref` by convention). This reader is the key to interacting with the Fluxus
system from within the provider:

- `read(otherProvider)`: Accesses the current value of another provider. This
  establishes a dependency; if `otherProvider` changes, this provider might
  recompute (depending on the provider type).
- `watch(otherProvider)`: Similar to `read`, but specifically used by reactive
  providers (like `computedProvider`) to subscribe to changes in dependencies.
- `onDispose(callback)`: Registers a cleanup function that will be called when
  the provider's state is destroyed within its `Scope`.

## Types of Providers

Fluxus offers different types of providers tailored for specific use cases:

- **`stateProvider(initialValue)`:** Creates a provider for simple, mutable
  state that can be updated from the UI or other logic. (You saw this in Getting
  Started).
- **`computedProvider(computeFn)`:** Creates a provider whose value is derived
  by reading other providers. It automatically recomputes its value when its
  dependencies change.
- **(Plain Function Providers):** Simple functions can act as providers for
  constant values or values that don't change, like configuration.
- **(Future/Async Providers - Planned):** Providers specifically designed to
  handle asynchronous operations (like API calls) and expose their loading,
  error, and data states.
- **(Stream Providers - Planned):** Providers for managing state based on
  streams or WebSockets.

Understanding providers is key to leveraging Fluxus effectively. They provide a
declarative and composable way to manage your application's state.

Next, let's look at the [Scope](./scope.md), the container where provider states
live.
