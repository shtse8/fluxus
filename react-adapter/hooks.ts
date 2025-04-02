import * as React from 'react';
import { useScope } from './context.js';
import { Provider } from '../src/types.js';
import {
  StateProviderInstance,
  // StateUpdater, // Unused import
  // isStateProviderInstance, // Unused import
} from '../src/providers/stateProvider.js';

/**
 * A React hook that reads a provider's value from the current {@link Scope}
 * and subscribes to updates.
 *
 * The component calling this hook will re-render whenever the provider's
 * state changes in the scope. It uses `useSyncExternalStore` internally
 * to ensure compatibility with concurrent rendering features in React.
 *
 * Must be used within a {@link ProviderScope}.
 *
 * @template T The type of the value provided by the provider.
 * @param {Provider<T>} provider The provider whose value is to be read and watched.
 * @returns {T} The current value of the provider.
 * @throws {Error} If used outside of a `ProviderScope`.
 * @throws {Error} If the provider state has been disposed.
 * @throws {Error} If a circular dependency is detected during initialization.
 */
export function useProvider<T>(provider: Provider<T>): T {
  const scope = useScope();

  // Store the last known value to handle potential reads after scope disposal
  const lastValueRef = React.useRef<T | undefined>(undefined);

  // Subscribe to provider updates
  const subscribe = React.useCallback(
    (onStoreChange: () => void) => {
      // Renamed callback for clarity
      try {
        // scope.watch returns the unsubscribe function
        return scope.watch(provider, () => {
          onStoreChange(); // Call the callback provided by useSyncExternalStore
        });
      } catch (error: any) {
        // If scope is disposed during subscribe, return a no-op unsubscribe
        // Check for disposal errors more broadly
        if (error instanceof Error && error.message.includes('disposed')) {
          return () => {};
        }
        throw error; // Re-throw other errors
      }
    },
    [scope, provider]
  ); // Add scope and provider back as dependencies

  // Get the current value (snapshot) of the provider
  const getSnapshot = React.useCallback(() => {
    try {
      const currentValue = scope.read(provider);
      lastValueRef.current = currentValue; // Cache the latest value
      return currentValue;
    } catch (error: any) {
      // If scope is disposed, return the last known value if available
      if (error.message === 'Scope has been disposed') {
        if (lastValueRef.current !== undefined) {
          // console.warn('useProvider: Scope disposed, returning last known value.');
          return lastValueRef.current;
        } else {
          // This case should be rare (disposed before first successful read)
          // Re-throwing might be better, but could crash the app.
          // Depending on requirements, returning undefined or a specific error value might be options.
          // For now, re-throw to make the issue visible during testing.
          throw error;
        }
      }
      // Re-throw other errors
      throw error;
    }
  }, [scope, provider]); // Add scope and provider back as dependencies

  // Initialize ref with the first snapshot if it's undefined
  if (lastValueRef.current === undefined) {
    try {
      lastValueRef.current = scope.read(provider);
    } catch {
      // Ignore errors here, getSnapshot will handle them
    }
  }

  // Optional: Define getServerSnapshot for SSR/server components.
  // It should return the initial state on the server.
  // const getServerSnapshot = React.useCallback(() => {
  //   return scope.read(provider);
  // }, [scope, provider]);

  // Use useSyncExternalStore to manage the subscription and state updates.
  return React.useSyncExternalStore(
    subscribe,
    getSnapshot
    // getServerSnapshot // Uncomment if supporting SSR
  );
}

/**
 * A React hook that returns the updater function for a {@link StateProviderInstance}.
 *
 * This hook allows components to update the state of a `StateProvider` without
 * needing to subscribe to its value (and thus avoiding re-renders when the
 * value changes if the component doesn't display it).
 *
 * The returned function has a stable identity across re-renders as long as the
 * provider and scope remain the same, making it safe to use in dependency arrays
 * of other hooks like `useEffect` or `useCallback`.
 *
 * Must be used within a {@link ProviderScope}.
 *
 * @template T The type of the state managed by the StateProvider.
 * @param {StateProviderInstance<T>} provider The StateProvider instance whose updater is needed.
 * @returns {(newValueOrFn: T | ((prev: T) => T)) => void} A stable function to update the provider's state.
 * @throws {Error} If used outside of a `ProviderScope`.
 * @throws {Error} If the provider is not a valid, initialized StateProvider in the scope.
 */
// Return type is now the simplified version for the user: (newValueOrFn) => void
export function useProviderUpdater<T>(
  provider: StateProviderInstance<T>
): (newValueOrFn: T | ((prev: T) => T)) => void {
  const scope = useScope();

  // Get the internal updater function from the scope.
  // Fetch it directly to avoid stale closures related to the scope instance.
  const internalUpdater = scope.updater(provider);

  // Return a stable function that calls the internal updater with scope and provider.
  // Use useCallback to ensure the returned function identity is stable if scope/provider don't change.
  const stableUpdater = React.useCallback(
    (newValueOrFn: T | ((prev: T) => T)) => {
      // Call the internal updater, passing the current scope and provider instance.
      internalUpdater(scope, provider, newValueOrFn);
    },
    [scope, provider, internalUpdater]
  ); // internalUpdater dependency ensures if scope.updater changes behavior, we update

  return stableUpdater;
}

// Example of a combined hook (less common, usually separate value/updater)
// export function useAtom<T>(provider: StateProviderInstance<T>): [T, StateUpdater<T>] {
//   const value = useProvider(provider);
//   const updater = useProviderUpdater(provider);
//   return [value, updater];
// }
