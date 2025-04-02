# React Adapter: Setup

To use Fluxus effectively within a React application, you need to integrate it
with React's component lifecycle and rendering system. The
`fluxus/react-adapter` package provides the necessary tools, primarily the
`<ProviderScope>` component and hooks like `useProvider`.

## The `ProviderScope` Component

As explained in the [Scope](./../scope.md) concept page, a `Scope` is required
to hold the runtime state of your providers. The `<ProviderScope>` component is
the standard way to create and manage this `Scope` within a React application.

**Purpose:**

- Creates a Fluxus `Scope` instance when the component mounts.
- Makes this `Scope` instance available to all descendant components via React
  Context.
- Automatically disposes of the `Scope` (and cleans up all provider states
  within it) when the `<ProviderScope>` component unmounts.

**Usage:**

You should wrap your entire application, or at least the part of your component
tree that needs access to Fluxus providers, with `<ProviderScope>`. Often, this
is done near the root of your application, for example, in your `App.tsx` or
`main.tsx` file.

```tsx {3,8}
// src/App.tsx
import React from 'react';
import { ProviderScope } from '@shtse8/fluxus/react-adapter';
import MyFeatureComponent from './MyFeatureComponent';

function App() {
  return (
    // Wrap the relevant part of your app
    <ProviderScope>
      {/* Components inside can now use Fluxus hooks */}
      <MyFeatureComponent />
      {/* ... other components */}
    </ProviderScope>
  );
}

export default App;
```

**Multiple Scopes:**

While less common for entire applications, you _can_ nest `<ProviderScope>`
components. Each `<ProviderScope>` creates its own independent `Scope`.
Components will interact with the _nearest_ ancestor `<ProviderScope>`. This can
be useful for isolating state for specific features or potentially for
overriding providers in tests or specific subtrees (though provider overriding
is a more advanced topic).

```tsx
<ProviderScope>
  {/* Outer Scope */}
  <UserProfile />
  <FeatureSection>
    {/* Inner Scope - components inside here use this scope */}
    <ProviderScope>
      <FeatureSpecificComponent />
    </ProviderScope>
  </FeatureSection>
</ProviderScope>
```

With `<ProviderScope>` in place, you're ready to start reading and interacting
with providers in your components using hooks.

Next, learn how to read provider values with [useProvider](./use-provider.md).
