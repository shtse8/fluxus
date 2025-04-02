import { ref, onScopeDispose, inject, type Ref } from 'vue';
import type { Provider, Scope } from '../src/index.js';
import { scopeSymbol } from './context.js';

/**
 * Subscribes to a Fluxus provider within a Vue component setup.
 *
 * @template T The type of the value provided by the provider.
 * @param provider The Fluxus provider to subscribe to.
 * @returns A Vue Ref containing the current value of the provider.
 */
export function useProvider<T>(provider: Provider<T>): Ref<T> {
  const scope = inject<Scope>(scopeSymbol);
  if (!scope) {
    throw new Error(
      'useProvider must be used within a ProviderScope component (or ensure a scope is provided)',
    );
  }

  // Initialize a ref with the initial value from the scope
  // Note: scope.read() might compute the value if not already computed
  const providerValue = ref<T>(scope.read(provider)) as Ref<T>;

  // Watch the provider for changes
  const disposeWatcher = scope.watch(provider, () => {
    // When notified, re-read the value from the scope
    providerValue.value = scope.read(provider);
  });

  // Clean up the watcher when the component using the hook is unmounted
  onScopeDispose(() => {
    disposeWatcher();
  });

  return providerValue;
}

import type { StateProviderInstance, StateUpdater } from '../src/index.js';

/**
 * Gets the updater function for a StateProvider within a Vue component setup.
 *
 * @template T The type of the state managed by the provider.
 * @param provider The StateProviderInstance to get the updater for.
 * @returns The updater function for the specified state provider.
 * @returns The updater function `(newValueOrFn: T | ((prev: T) => T)) => void` for the specified state provider.
 */
// Define a simpler type for the hook's return value
type SimpleStateUpdater<T> = (newValueOrFn: T | ((prev: T) => T)) => void;

export function useProviderUpdater<T>(
  provider: StateProviderInstance<T>,
): SimpleStateUpdater<T> {
  const scope = inject<Scope>(scopeSymbol);
  if (!scope) {
    throw new Error(
      'useProviderUpdater must be used within a ProviderScope component (or ensure a scope is provided)',
    );
  }
  // Get the raw updater from the scope
  const rawUpdater = scope.updater(provider);
  // Return a new function that calls the raw updater with the captured scope and provider
  return (newValueOrFn: T | ((prev: T) => T)): void => {
    // Pass the correct scope and provider instance to the raw updater
    rawUpdater(scope, provider, newValueOrFn);
  };
}