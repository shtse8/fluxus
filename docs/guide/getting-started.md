# Getting Started

This guide will walk you through installing Fluxus and setting up a basic
example using the React adapter.

## Installation

You can install Fluxus and its React adapter using your preferred package
manager:

```bash
# Using npm
npm install @shtse8/fluxus react

# Using yarn
yarn add @shtse8/fluxus react

# Using pnpm
pnpm add @shtse8/fluxus react
```

> **Note:** Fluxus requires `react` as a peer dependency when using the
> `fluxus/react-adapter`. Ensure you have React installed in your project.

## Your First Fluxus App (React)

Let's build a simple counter application.

**1. Define a Provider:**

Providers are the heart of Fluxus. They define how to create and manage a piece
of state. For simple mutable state, we use `stateProvider`. Create a file (e.g.,
`src/providers.ts`) or define it where needed:

```typescript
// src/providers.ts
import { stateProvider } from '@shtse8/fluxus';

// Create a provider for a counter state, initialized to 0
export const counterProvider = stateProvider(0);
```

That's it! No complex setup or registration is needed. `counterProvider` is just
a value you can import and use.

**2. Provide a Scope:**

Fluxus needs a `Scope` to store the actual state of your providers. The React
adapter provides the `ProviderScope` component for this. Wrap your application
or the relevant part of your component tree with it, typically near the root:

```tsx
// src/App.tsx
import React from 'react';
import { ProviderScope } from '@shtse8/fluxus/react-adapter';
import CounterDisplay from './CounterDisplay';
import CounterControls from './CounterControls';

function App() {
  return (
    // ProviderScope creates and manages the Scope for components below it
    <ProviderScope>
      <h1>Fluxus Counter</h1>
      <CounterDisplay />
      <CounterControls />
    </ProviderScope>
  );
}

export default App;
```

**3. Use the Provider in Components:**

Now, you can access the provider's state and updater function in your components
using hooks.

- **Reading State (`useProvider`):** This hook reads the current value of a
  provider and subscribes the component to its updates.

  ```tsx
  // src/CounterDisplay.tsx
  import React from 'react';
  import { useProvider } from '@shtse8/fluxus/react-adapter';
  import { counterProvider } from './providers';

  function CounterDisplay() {
    // Read the current value of counterProvider
    // This component will re-render when the counter changes
    const count = useProvider(counterProvider);

    return <div>Count: {count}</div>;
  }

  export default CounterDisplay;
  ```

- **Updating State (`useProviderUpdater`):** This hook gets the function to
  update a `stateProvider`. Using this hook _does not_ cause the component to
  subscribe to state changes, which is useful for components that only trigger
  updates.

  ```tsx
  // src/CounterControls.tsx
  import React from 'react';
  import { useProviderUpdater } from '@shtse8/fluxus/react-adapter';
  import { counterProvider } from './providers';

  function CounterControls() {
    // Get the updater function for counterProvider
    // This component won't re-render when the counter changes
    const updateCounter = useProviderUpdater(counterProvider);

    const increment = () => updateCounter((currentCount) => currentCount + 1);
    const decrement = () => updateCounter((currentCount) => currentCount - 1);

    return (
      <div>
        <button onClick={increment}>Increment</button>
        <button onClick={decrement}>Decrement</button>
      </div>
    );
  }

  export default CounterControls;
  ```

**That's the basic setup!** You now have a reactive counter application powered
by Fluxus.

Next, let's explore the different types of [Providers](./providers.md) in more
detail.
