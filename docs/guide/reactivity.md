# Core Concepts: Reactivity

Reactivity is the mechanism by which Fluxus automatically updates parts of your
application when the underlying state changes. Fluxus aims for fine-grained
reactivity, meaning only the necessary computations and UI updates occur.

## How it Works: Dependency Tracking

The foundation of Fluxus reactivity is **automatic dependency tracking**.

1. **Tracking Reads:** When a provider's recipe function is executed within a
   `Scope`, any calls to `read(otherProvider)` or `watch(otherProvider)` using
   the `ScopeReader` are recorded by the `Scope`. This creates a dependency
   graph where the `Scope` knows that the current provider depends on
   `otherProvider`.
2. **Building the Graph:** As providers are read across your application, the
   `Scope` builds up a directed graph representing these dependencies. For
   example, if `providerC` reads `providerB`, and `providerB` reads `providerA`,
   the graph looks like `A -> B -> C`.

```typescript
import { computedProvider, stateProvider } from "@shtse8/fluxus";

const providerA = stateProvider(10);
const providerB = computedProvider((read) => read(providerA) * 2); // B depends on A
const providerC = computedProvider((read) => read(providerB) + 5); // C depends on B
```

## Change Propagation

When the state managed by a provider changes (e.g., a `stateProvider` is
updated), the following happens:

1. **Notification:** The provider whose state changed notifies the `Scope`.
2. **Marking Dependents:** The `Scope` looks up the dependents of the changed
   provider in its dependency graph. It marks these direct dependents as
   "stale".
3. **Recursive Staleness:** If a dependent provider is itself a reactive
   provider (like `computedProvider`), the staleness check propagates further up
   the graph. In our example, if `providerA` changes, `providerB` is marked
   stale. Since `providerC` depends on `providerB`, `providerC` is also marked
   stale.
4. **Re-computation (Lazy):** A stale provider doesn't immediately recompute its
   value. Re-computation only happens when:
   - The stale provider is explicitly `read()` again.
   - The stale provider has active subscribers (e.g., a component using
     `useProvider` is mounted).
5. **Notifying Subscribers:** If a stale provider recomputes and its value
   changes, or if a `stateProvider` is updated directly, the `Scope` notifies
   any active subscribers (like UI components connected via `useProvider`).

## UI Updates (React Adapter)

The React adapter (`fluxus/react-adapter`) bridges Fluxus reactivity with
React's rendering cycle.

- The `useProvider(myProvider)` hook subscribes the component to changes in
  `myProvider` within the current `Scope`.
- It uses React's `useSyncExternalStore` hook internally. This hook is designed
  specifically for subscribing to external stores in a way that's safe for
  concurrent rendering features in React.
- When the `Scope` notifies the hook that `myProvider`'s state has changed,
  `useSyncExternalStore` triggers a re-render of the component with the new
  value.

## Key Characteristics

- **Automatic:** You don't manually declare dependencies; they are tracked
  implicitly via `read`/`watch` calls.
- **Fine-grained:** Only providers and components affected by a change are
  updated.
- **Lazy:** Computations are generally deferred until the value is actually
  needed.
- **Pull-based Computation, Push-based Notification:** Values are "pulled" via
  `read` (triggering computation if needed), while updates are "pushed" to
  active subscribers.

This reactive system allows you to write declarative code focusing on _how_
state is derived, letting Fluxus handle the complexities of keeping everything
synchronized efficiently.

Now that you understand the core concepts, let's look specifically at the
[React Adapter](./react/setup.md).
