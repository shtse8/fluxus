# React Adapter: `useProviderUpdater`

While `useProvider` is used to read a provider's value and subscribe to its
changes, the `useProviderUpdater` hook serves a different, specific purpose:
retrieving the **update function** for a mutable provider (like `stateProvider`)
_without_ subscribing the component to its value changes.

## Purpose

- **Get Updater:** Retrieves the function that allows you to modify the state of
  a `stateProvider` (or a similar future provider type that allows external
  updates).
- **Avoid Re-renders:** Crucially, using this hook **does not** cause the
  component to re-render when the provider's value changes.

## Usage

This hook is ideal for components that only need to trigger actions or updates
but don't need to display the state itself. A common example is a button panel
or control component.

```tsx
import React from "react";
import { useProviderUpdater } from "@shtse8/fluxus/react-adapter";
import { counterProvider } from "./providers"; // Assuming counterProvider is a stateProvider

function CounterControls() {
    // Get the updater function for counterProvider
    // This component will NOT re-render when the counter value changes
    const updateCounter = useProviderUpdater(counterProvider);

    // Define actions using the updater
    const increment = () => {
        // The updater function receives the current state and returns the new state
        updateCounter((currentValue) => currentValue + 1);
    };

    const decrement = () => {
        updateCounter((currentValue) => currentValue - 1);
    };

    const reset = () => {
        // You can also set the state directly
        updateCounter(0);
    };

    return (
        <div>
            <button onClick={increment}>Increment</button>
            <button onClick={decrement}>Decrement</button>
            <button onClick={reset}>Reset</button>
        </div>
    );
}

export default CounterControls;
```

**Syntax:**

```typescript
// For stateProvider<T>
const updateFn = useProviderUpdater<T>(provider: StateProvider<T>): (updater: T | ((prev: T) => T)) => void;
```

- `provider`: The `stateProvider` (or similar mutable provider) whose update
  function you want.
- Returns the update function associated with that provider instance within the
  current scope.

## Why Use It? Performance Optimization

Consider the `CounterControls` example above. If we had used `useProvider`
instead:

```tsx
// Less optimal example
function CounterControls() {
    const count = useProvider(counterProvider); // Component now subscribes!
    const updateCounter = useProviderUpdater(counterProvider);

    // ... same buttons ...
}
```

Even though the `count` variable isn't used in the component's JSX output,
calling `useProvider` subscribes the component. Every time the counter value
changes (e.g., when the user clicks Increment/Decrement), this `CounterControls`
component would unnecessarily re-render.

By using only `useProviderUpdater`, we get the function we need to _cause_
updates without paying the performance cost of subscribing to those updates in
components that don't display the changing value.

This concludes the basic guide to the React adapter hooks. You now know how to
provide a scope, read state reactively, and update state efficiently.
