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
   It might optionally contain `previousData` if the provider is re-fetching
   after having previously succeeded.
   ```typescript
   { state: 'loading', previousData?: T } // Contains last successful data during re-fetch
   ```
2. **Data (`AsyncData<T>`):** The state when the promise resolves successfully.
   It contains the resolved `data`.
   ```typescript
   { state: 'data', data: T }
   ```
3. **Error (`AsyncError`):** The state when the promise rejects. It contains the
   `error` object. It might optionally contain `previousData` if the
   `keepPreviousDataOnError` option is enabled and the provider had previously
   succeeded.
   ```typescript
   { state: 'error', error: unknown, stackTrace?: string, previousData?: T } // Contains last successful data if option enabled
   ```

Fluxus also exports type guards (`isLoading`, `hasData`, `hasError`) to easily
check the current state of an `AsyncValue`.

## Usage

Define an `asyncProvider` by passing it an asynchronous function that accepts a
`ScopeReader` and returns a `Promise`.

## Options (`AsyncProviderOptions`)

You can pass an optional second argument to `asyncProvider` with configuration:

```typescript
interface AsyncProviderOptions extends ProviderOptions {
  /** An optional name for debugging. */
  name?: string;
  /**
   * If true, when the async operation fails after having previously succeeded,
   * the provider will continue to expose the last successful data in the
   * `AsyncError` state's `previousData` field. Defaults to false.
   */
  keepPreviousDataOnError?: boolean;
}
```

## Usage Example

Define an `asyncProvider` by passing it an asynchronous function that accepts a
`ScopeReader` and returns a `Promise`. You can optionally provide a name and set
`keepPreviousDataOnError`.

```typescript
import { asyncProvider } from "@shtse8/fluxus";
import { userIdProvider } from "./otherProviders"; // Assume this exists

interface User {
  id: number;
  name: string;
  email: string;
}

export const userProvider = asyncProvider<User>(
  async (read) => {
    const userId = read.read(userIdProvider); // Read dependency

    // Perform the async operation (e.g., API call)
    // Note: The `read.signal` can be used for cancellation (see Cancellation guide)
    const response = await fetch(`/api/users/${userId}`, {
      signal: read.signal,
    });

    if (!response.ok) {
      // Throw an error to transition to AsyncError state
      throw new Error(`Failed to fetch user ${userId}: ${response.statusText}`);
    }

    // Return the data to transition to AsyncData state
    const data = await response.json();
    return data as User;
  },
  {
    name: "userDetails", // Optional name for debugging
    keepPreviousDataOnError: true, // Keep showing old data if fetch fails
  },
);
```

## Handling `AsyncValue` in Components (React)

You typically use `useProvider` to get the current `AsyncValue` and render
different UI based on its state:

```tsx
import React from "react";
import { useProvider } from "@shtse8/fluxus/react-adapter";
import { hasData, hasError, isLoading } from "@shtse8/fluxus"; // Import type guards
import { userProvider } from "./providers";

function UserProfile() {
  const userAsyncValue = useProvider(userProvider);

  if (isLoading(userAsyncValue)) {
    // Optionally show previous data while loading new data
    const previousName = userAsyncValue.previousData?.name;
    return (
      <div>
        Loading user... {previousName ? `(Previously: ${previousName})` : ""}
      </div>
    );
  }

  if (hasError(userAsyncValue)) {
    return (
      <div style={{ color: "red" }}>
        Error loading user: {String(userAsyncValue.error)}
        {/* Show previous data on error if keepPreviousDataOnError was true */}
        {userAsyncValue.previousData?.name && (
          <p style={{ fontStyle: "italic" }}>
            (Previous data: {userAsyncValue.previousData.name})
          </p>
        )}
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

The `asyncProvider` simplifies managing loading, data, and error states for
asynchronous operations, making your component logic cleaner and more robust. It
also automatically re-fetches when its dependencies change and supports
cancellation.
