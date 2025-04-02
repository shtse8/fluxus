# Providers: `asyncProvider`

Handling asynchronous operations like API calls is a fundamental part of most
applications. Fluxus provides the `asyncProvider` to manage the state associated
with these operations cleanly.

## Purpose

`asyncProvider` is designed to wrap a function that returns a `Promise`. It
automatically manages the lifecycle of this asynchronous operation and exposes
its state through a special type called `AsyncValue<T>`.

## `AsyncValue<T>` States

Instead of just returning the final data `T`, an `asyncProvider` returns an
`AsyncValue<T>` object, which represents the current state of the operation:

1. **Loading (`AsyncLoading`):** The initial state while the promise is pending.
   It might optionally contain `previousData` if the provider is re-fetching.
   ```typescript
   { state: 'loading', previousData?: T }
   ```
2. **Data (`AsyncData<T>`):** The state when the promise resolves successfully.
   It contains the resolved `data`.
   ```typescript
   { state: 'data', data: T }
   ```
3. **Error (`AsyncError`):** The state when the promise rejects. It contains the
   `error` object and might optionally contain `previousData`.
   ```typescript
   { state: 'error', error: unknown, stackTrace?: string, previousData?: T }
   ```

Fluxus also exports type guards (`isLoading`, `hasData`, `hasError`) to easily
check the current state of an `AsyncValue`.

## Usage

Define an `asyncProvider` by passing it an asynchronous function that accepts a
`ScopeReader` and returns a `Promise`.

```typescript
import { asyncProvider } from '@shtse8/fluxus';
import { userIdProvider } from './otherProviders'; // Assume this exists

interface User {
  id: number;
  name: string;
  email: string;
}

export const userProvider = asyncProvider<User>(async (read) => {
  const userId = read.read(userIdProvider); // Read dependency

  // Perform the async operation (e.g., API call)
  const response = await fetch(`/api/users/${userId}`);

  if (!response.ok) {
    // Throw an error to transition to AsyncError state
    throw new Error(`Failed to fetch user ${userId}: ${response.statusText}`);
  }

  // Return the data to transition to AsyncData state
  const data = await response.json();
  return data as User;
});
```

## Handling `AsyncValue` in Components (React)

You typically use `useProvider` to get the current `AsyncValue` and render
different UI based on its state:

```tsx
import React from 'react';
import { useProvider } from '@shtse8/fluxus/react-adapter';
import { hasData, hasError, isLoading } from '@shtse8/fluxus'; // Import type guards
import { userProvider } from './providers';

function UserProfile() {
  const userAsyncValue = useProvider(userProvider);

  if (isLoading(userAsyncValue)) {
    // Optionally show previous data while loading new data
    const previousName = userAsyncValue.previousData?.name;
    return <div>Loading user... {previousName ? `(Previously: ${previousName})` : ''}</div>;
  }

  if (hasError(userAsyncValue)) {
    return (
      <div style={{ color: 'red' }}>
        Error loading user: {String(userAsyncValue.error)}
        {/* Optionally show previous data on error */}
        {userAsyncValue.previousData?.name &&
          ` (Previous data: ${userAsyncValue.previousData.name})`}
      </div>
    );
  }

  // We know it's AsyncData here, but check for safety (or use ! operator)
  if (hasData(userAsyncValue)) {
    const user = userAsyncValue.data;
    return (
      <div>
        <h2>{user.name}</h2>
        <p>Email: {user.email}</p>
      </div>
    );
  }

  // Fallback case (should ideally not be reached with AsyncValue)
  return <div>Unknown user state.</div>;
}

export default UserProfile;
```

The `asyncProvider` simplifies managing loading, data, and error states for
asynchronous operations, making your component logic cleaner and more robust.

_(Note: Features like automatic re-fetching when dependencies change are planned
for future refinement.)_
