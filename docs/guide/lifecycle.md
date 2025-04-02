# Core Concepts: Lifecycle Management

Managing the lifecycle of state—when it's created, when it's updated, and
crucially, when it's destroyed—is essential for preventing memory leaks and
ensuring efficient resource usage. Fluxus provides mechanisms for handling this,
primarily through the `Scope` and the `onDispose` callback.

## Provider State Lifecycle

The state associated with a specific provider instance exists only within a
`Scope`.

1. **Initialization:** A provider's state is typically initialized lazily when
   it's first read (`read()` or `watch()`) within a `Scope`. The provider's
   recipe function is executed to compute the initial value.
2. **Active State:** While the provider is being actively used (e.g., watched by
   components via `useProvider` or read by other active providers), its state is
   kept in the `Scope`.
3. **Disposal:** The state needs to be cleaned up eventually. Disposal happens
   in two main scenarios:
   - **Scope Disposal:** When the `Scope` itself is destroyed (e.g., the
     `<ProviderScope>` component unmounts), all provider states within it are
     disposed of.
   - **Automatic Disposal (Default Behavior):** Fluxus automatically tracks
     "listeners" or "watchers" for each provider's state within a scope. When
     the listener count for a provider drops to zero (meaning no component via
     `useProvider` or other provider via `watch` is actively observing it),
     Fluxus will automatically dispose of that provider's state to conserve
     resources.

## Cleaning Up Resources: `onDispose`

Providers often manage resources that need explicit cleanup, such as closing
network connections, clearing timers, or unsubscribing from external event
sources.

The `ScopeReader` (passed as the argument to provider recipe functions) provides
an `onDispose` method for this purpose. You register a callback function with
`onDispose`, and Fluxus guarantees this callback will be executed when the
provider's state is disposed of (either through scope disposal or automatic
disposal).

```typescript
import { stateProvider } from '@shtse8/fluxus';
import { someExternalService } from './externalService';

const dataProvider = stateProvider<string | null>(null, (read, update, onDispose) => {
  console.log('Initializing dataProvider state...');
  const subscription = someExternalService.subscribe((newData) => {
    update(newData); // Update the provider's state
  });

  // Register cleanup logic
  onDispose(() => {
    console.log('Disposing dataProvider state, unsubscribing...');
    subscription.unsubscribe();
  });

  // Optional: Return initial value or perform initial fetch
  // update(someExternalService.getInitialData());
  return null; // Initial value if not updated immediately
});
```

In this example, when the `dataProvider` state is disposed of, the `onDispose`
callback runs, ensuring the external subscription is properly cleaned up.

## Automatic Disposal vs. Riverpod's `keepAlive`

Fluxus's default behavior is **automatic disposal** based on listener count. If
a provider's state is no longer being actively watched, it's considered eligible
for cleanup. This helps keep memory usage minimal by default.

This differs from Riverpod's default behavior, where provider state is typically
kept alive for the lifetime of the scope unless explicitly configured otherwise
(e.g., using `.autoDispose`). Riverpod also offers a `keepAlive: true` option
(primarily with code generation) to explicitly prevent disposal even if there
are no listeners.

**Fluxus currently does not have an equivalent `keepAlive: true` flag.** The
design philosophy prioritizes automatic cleanup by default. If you need state to
persist even when not actively watched by the UI, you might consider:

1. Ensuring it's watched by another "longer-lived" provider within the same
   scope.
2. Managing the state outside of Fluxus if its lifecycle is truly independent of
   the UI or other providers.
3. (Future Possibility): Fluxus might introduce configuration options for
   disposal behavior in the future if strong use cases emerge.

Understanding this lifecycle behavior is key to managing resources effectively
in your Fluxus application.

Next, let's look at the specifics of the [React Adapter](./react/setup.md).
