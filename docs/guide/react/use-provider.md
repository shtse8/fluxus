# React Adapter: `useProvider`

The `useProvider` hook is the primary way to access the **value** of a provider
within your React components and subscribe to its updates.

## Purpose

- **Read State:** Retrieves the current value of the specified provider from the
  nearest ancestor `<ProviderScope>`.
- **Subscribe to Updates:** Automatically subscribes the component to changes in
  the provider's value. If the provider's value changes, the component will
  re-render with the new value.

## Usage

```tsx
import React from 'react';
import { useProvider } from '@shtse8/fluxus/react-adapter';
import { themeProvider, userProvider } from './providers'; // Assuming these exist

function UserProfile() {
  // Read the user object from userProvider
  // This component will re-render if the user object changes
  const user = useProvider(userProvider);

  // Read the theme string from themeProvider
  // This component will also re-render if the theme changes
  const theme = useProvider(themeProvider);

  if (!user) {
    return <div>Loading user...</div>;
  }

  return (
    <div className={`profile theme-${theme}`}>
      <h2>{user.name}</h2>
      <p>Email: {user.email}</p>
    </div>
  );
}

export default UserProfile;
```

**Syntax:**

```typescript
const value = useProvider<T>(provider: Provider<T>): T;
```

- `provider`: The provider value (e.g., `counterProvider`, `userProvider`) you
  want to read.
- Returns the current value (`T`) of the provider within the current scope.

## Reactivity Integration

`useProvider` seamlessly integrates Fluxus's reactivity with React's rendering:

1. **Initial Read:** On the first render, it reads the provider's value from the
   `Scope`.
2. **Subscription:** It subscribes to the provider within the `Scope` using
   React's `useSyncExternalStore` hook.
3. **Updates:** When the provider's state changes in the `Scope`, the `Scope`
   notifies its subscribers. `useSyncExternalStore` receives this notification
   and schedules a re-render for the component.
4. **Re-render:** The component re-renders, and `useProvider` now returns the
   updated value from the `Scope`.

This ensures that your component always displays the latest state from the
provider it depends on.

## When Not to Use `useProvider`

If your component _only_ needs to **trigger updates** to a `stateProvider` (or
similar mutable provider) and doesn't actually need to _read_ its value for
rendering, using `useProvider` can cause unnecessary re-renders.

In such cases, you should use the
[`useProviderUpdater`](./use-provider-updater.md) hook instead, which provides
the update function without subscribing the component to changes.

Next, learn about the hook for updating state:
[`useProviderUpdater`](./use-provider-updater.md).
