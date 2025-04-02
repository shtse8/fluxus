# Combining Providers

Fluxus shines when you start combining different provider types to build complex
state logic in a declarative and maintainable way. This guide explores common
patterns for combining providers.

## Computed State from Async Data

A frequent use case is deriving synchronous state from asynchronous data. For
example, filtering a list fetched from an API.

```typescript
import {
    asyncProvider,
    AsyncValue,
    computedProvider,
    stateProvider,
} from "fluxus";

interface User {
    id: number;
    name: string;
}

// 1. Provider to fetch users
const usersProvider = asyncProvider<User[]>(async ({ signal }) => {
    const response = await fetch("/api/users", { signal });
    if (!response.ok) {
        throw new Error("Failed to fetch users");
    }
    return response.json();
}, { name: "usersProvider" });

// 2. Provider for the search term
const userSearchQueryProvider = stateProvider("", {
    name: "userSearchQueryProvider",
});

// 3. Computed provider for filtered users
const filteredUsersProvider = computedProvider<User[]>((reader) => {
    const searchQuery = reader.read(userSearchQueryProvider).toLowerCase();
    const usersResult = reader.read(usersProvider); // Read the AsyncValue

    // Handle loading/error states from the async provider
    if (usersResult.state !== "data") {
        return []; // Return empty list while loading or if there's an error
    }

    // Filter the data based on the search query
    const allUsers = usersResult.data;
    if (!searchQuery) {
        return allUsers; // No query? Return all users.
    }

    return allUsers.filter((user) =>
        user.name.toLowerCase().includes(searchQuery)
    );
}, { name: "filteredUsersProvider" });

// --- In your React component ---
// import { useProvider, useProviderUpdater } from '@fluxus/react-adapter';
//
// function UserSearch() {
//   const filteredUsers = useProvider(filteredUsersProvider);
//   const usersResult = useProvider(usersProvider); // To show loading/error states
//   const setSearchQuery = useProviderUpdater(userSearchQueryProvider);
//
//   return (
//     <div>
//       <input
//         type="text"
//         placeholder="Search users..."
//         onChange={(e) => setSearchQuery(e.target.value)}
//       />
//       {usersResult.state === 'loading' && <p>Loading users...</p>}
//       {usersResult.state === 'error' && <p>Error: {usersResult.error.message}</p>}
//       {usersResult.state === 'data' && (
//         <ul>
//           {filteredUsers.map(user => <li key={user.id}>{user.name}</li>)}
//         </ul>
//       )}
//     </div>
//   );
// }
```

## Async Operations Triggered by State Changes

You might want to trigger an API call or another async task whenever a piece of
state changes.

```typescript
import { asyncProvider, scope, stateProvider } from "fluxus";

interface FormData {
    name: string;
    email: string;
}

// 1. Provider for the form data
const formDataProvider = stateProvider<FormData>({ name: "", email: "" }, {
    name: "formDataProvider",
});

// 2. Provider to handle the auto-save operation
//    We use an asyncProvider that *watches* the form data.
//    When formDataProvider changes, this provider re-runs.
const autoSaveProvider = asyncProvider<void, { debounceMs?: number }>(
    async (reader, { debounceMs = 500 }) => {
        // Read the current form data. This establishes the dependency.
        const currentData = reader.read(formDataProvider);

        // Simple debounce implementation (in a real app, use a robust debounce function)
        await new Promise((resolve) => setTimeout(resolve, debounceMs));

        // Check if data actually changed since debounce started (optional but good practice)
        // This requires reading the state *again* after the debounce.
        // Note: This simple example doesn't handle race conditions perfectly.
        const latestData = reader.read(formDataProvider);
        if (JSON.stringify(currentData) !== JSON.stringify(latestData)) {
            console.log(
                "Data changed during debounce, skipping save for this trigger.",
            );
            return; // Don't save if data changed rapidly
        }

        if (latestData.name || latestData.email) { // Only save if there's data
            console.log("Auto-saving data:", latestData);
            try {
                const response = await fetch("/api/save-form", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(latestData),
                    signal: reader.signal, // Pass the signal for cancellation
                });
                if (!response.ok) {
                    throw new Error("Auto-save failed");
                }
                console.log("Auto-save successful");
            } catch (error) {
                if (error.name !== "AbortError") {
                    console.error("Auto-save error:", error);
                    // Handle error appropriately (e.g., show notification)
                } else {
                    console.log("Auto-save aborted.");
                }
                // Re-throw to potentially mark the provider as errored,
                // though in this case, we might just log and continue.
                // throw error;
            }
        } else {
            console.log("No data to auto-save.");
        }
    },
    { name: "autoSaveProvider" },
);

// --- How to use it ---
// You typically wouldn't *read* the autoSaveProvider directly in the UI,
// as its value (void) isn't usually displayed. Instead, you ensure it's
// active within the scope so it runs when its dependencies change.

// 1. Instantiate the scope
// const appScope = scope();

// 2. Ensure the provider is initialized (e.g., by reading it once, though
//    this isn't ideal as it returns AsyncValue<void>). A better approach
//    might be needed in the core library for "fire-and-forget" providers
//    that just need to react. For now, reading it works to activate it.
// appScope.read(autoSaveProvider);

// 3. Update the form data provider elsewhere in your app
// const updateFormData = appScope.updater(formDataProvider);
// updateFormData(prev => ({ ...prev, name: 'New Name' }));
// --> This change will trigger the autoSaveProvider to re-run after debounce.
```

## Using Utilities like `pipe` or `debounce`

You can compose utility functions with your providers to add behaviors like
debouncing.

```typescript
import { computedProvider, stateProvider } from "fluxus";
import { debounce } from "fluxus/utils"; // Assuming utils export debounce
// Or: import { debounce } from '../../src/utils/debounce'; // Adjust path if needed

// 1. Provider for raw input
const rawInputProvider = stateProvider("", { name: "rawInputProvider" });

// 2. Debounced version of the input provider
//    This example demonstrates debouncing a *side effect* triggered by a provider,
//    rather than debouncing the provider's value itself, which is more complex.
//    See the 'Async Operations Triggered by State Changes' example for a similar pattern.

const debouncedLoggingProvider = computedProvider<string>((reader) => {
    const rawInput = reader.read(rawInputProvider); // Read to establish dependency

    // Create a debounced logging function.
    // IMPORTANT CAVEAT: In this simple computedProvider example, this debounced
    // function is recreated every time the rawInput changes and the provider
    // recomputes. This means the debounce timer resets on *every keystroke*.
    // This is generally NOT the desired behavior for debouncing input effects.
    //
    // A more robust solution would involve:
    //   a) A stateful provider that holds the debounced function internally.
    //   b) Using the `onDispose` mechanism within a provider to clean up timers.
    //   c) Potentially a dedicated `debouncedEffectProvider` or similar utility.
    //
    // This example primarily shows the *concept* of using the debounce utility
    // in the context of providers, highlighting the challenges with simple computed.
    const debouncedLog = debounce((value: string) => {
        if (value) { // Only log if there's input
            console.log(
                "Debounced input (logged from computedProvider):",
                value,
            );
        }
    }, 750); // 750ms debounce

    // Call the debounced function with the current input
    debouncedLog(rawInput);

    // The computed provider itself just returns the raw input immediately.
    // The *side effect* (logging) is what's being debounced (though imperfectly here).
    return rawInput;
}, { name: "debouncedLoggingProvider" });

// --- Using the raw input and triggering the debounced log ---
// import { useProvider, useProviderUpdater } from '@fluxus/react-adapter';
//
// function DebouncedLoggerComponent() {
//   // Read the computed provider primarily to activate its computation logic
//   // which includes the debounced side effect. We might not use its return value directly.
//   useProvider(debouncedLoggingProvider);
//   const setRawInput = useProviderUpdater(rawInputProvider);
//
//   console.log('Rendering DebouncedLoggerComponent'); // See how often this renders
//
//   return (
//     <input
//       type="text"
//       placeholder="Type here for debounced log..."
//       onChange={(e) => setRawInput(e.target.value)}
//     />
//   );
// }

// --- Using pipe (Conceptual - requires pipe implementation for providers) ---
/*
import { pipe } from 'fluxus/utils'; // Assuming pipe exists and works on providers

const numberProvider = stateProvider(0);

// Conceptual: Create a provider that doubles the number
const doubleProvider = pipe(
  numberProvider,
  mapProvider(n => n * 2) // Assuming a 'mapProvider' operator exists
);

// Conceptual: Create a provider that debounces updates to the value
const debouncedValueProvider = pipe(
  numberProvider,
  debounceProviderValue(500) // Assuming a value debounce operator exists
);
*/
// Note: Implementing `pipe` and operators like `mapProvider` or `debounceProviderValue`
// that transform providers themselves requires careful design. The existing `pipe`
// utility is likely for general function composition. The `debounce` utility is
// for debouncing function calls, often used for side effects as shown above.
```

_(More examples to come...)_
