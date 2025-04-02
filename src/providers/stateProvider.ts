import { ScopeReader, Provider, ProviderOptions } from '../types.js'; // Removed unused Dispose
import { Scope } from '../scope.js'; // Need Scope to add the updater method later

// --- Type Definitions ---

/**
 * Defines the shape of the function used to update the state of a {@link StateProviderInstance}.
 * This function is retrieved via `scope.updater(provider)`.
 *
 * @template T The type of the state.
 * @param {Scope} scope The scope instance in which the update occurs.
 * @param {StateProviderInstance<T>} provider The specific provider instance being updated.
 * @param {T | ((prev: T) => T)} newValueOrFn The new value or a function that receives the previous value and returns the new value.
 * @returns {void}
 */
export type StateUpdater<T> = (
  scope: Scope,
  provider: StateProviderInstance<T>,
  newValue: T | ((prev: T) => T)
) => void;

/**
 * Represents the internal state associated with a specific {@link StateProviderInstance}
 * within a particular {@link Scope}.
 *
 * @template T The type of the state value.
 */
export interface StateProviderState<T> {
  /** The current value of the state. */
  value: T;
  /** A set of listener callbacks subscribed to changes in this state within the scope. */
  listeners: Set<() => void>;
}

export // Using a unique symbol allows us to identify StateProvider instances
// without relying on instanceof checks or specific properties.
const $stateProvider = Symbol.for('fluxus.stateProvider');

/**
 * A specialized {@link Provider} that manages a mutable piece of state.
 *
 * It provides the current state value when read and allows the state to be
 * updated via an updater function obtained from the {@link Scope}.
 * StateProviders are the primary way to introduce mutable state into the Fluxus system.
 *
 * @template T The type of the state value.
 * @extends {Provider<T>}
 */
export interface StateProviderInstance<T> extends Provider<T> {
  /** @internal A unique symbol used to identify StateProvider instances. */
  [$stateProvider]: {
    /**
     * @internal The function called by the Scope to create the initial state
     * for this provider instance within that scope.
     * @param {ScopeReader} reader - The reader for the initializing scope.
     * @param {number} internalId - A unique ID assigned by the scope for debugging.
     * @returns {StateProviderState<T>} The initial internal state.
     */
    initializeState: (reader: ScopeReader, internalId: number) => StateProviderState<T>;
    /** An optional name for debugging. */
    name?: string;
  };
  /** @internal A read-only property for easier type narrowing if needed. */
  // Add a property for easier type narrowing if needed, though symbol is preferred
  readonly _fluxus_provider_type: 'StateProvider';
}

/**
 * @internal Internal type combining Provider<T> with internal properties.
 */
type InternalStateProvider<T> = Provider<T> & {
  [$stateProvider]: {
    initializeState: (reader: ScopeReader, internalId: number) => StateProviderState<T>;
    name?: string;
  };
  _fluxus_provider_type: 'StateProvider';
};

/**
 * Type guard to check if a given value is a {@link StateProviderInstance}.
 *
 * @template T The potential type of the state managed by the provider.
 * @param {unknown} provider The value to check.
 * @returns {provider is StateProviderInstance<T>} True if the value is a StateProviderInstance, false otherwise.
 */
export function isStateProviderInstance<T>(
  provider: unknown
): provider is StateProviderInstance<T> {
  // Check if it's a function, not null, and has the internal symbol identifier.
  return typeof provider === 'function' && provider !== null && $stateProvider in provider;
}

// --- Factory Function ---

/**
 * Creates a {@link StateProviderInstance} which manages a mutable piece of state.
 *
 * @template T The type of the state value.
 * @param {T | ((reader: ScopeReader) => T)} initialValue - The initial value for the state,
 *   or a function that computes the initial value using a {@link ScopeReader}.
 *   If a function is provided, it will be called once per scope when the provider
 *   is first initialized within that scope.
 * @returns {StateProviderInstance<T>} The created StateProvider instance.
 *
 * @example
 * // Simple counter state provider
 * const counterProvider = stateProvider(0);
 *
 * // State provider with initial value computed from another provider
 * const userProvider = stateProvider<{ name: string; id: number } | null>(null);
 * const userIdProvider = stateProvider((reader) => reader.read(userProvider)?.id ?? -1);
 */
export function stateProvider<T>(
  initialValue: T | ((reader: ScopeReader) => T),
  options?: ProviderOptions
): StateProviderInstance<T> {
  // This is the core function that Scope will call to initialize the provider's state.
  // Accept internalId from Scope
  const initializeState = (reader: ScopeReader, _internalId: number): StateProviderState<T> => {
    // Mark internalId as unused
    let currentValue =
      typeof initialValue === 'function'
        ? (initialValue as (reader: ScopeReader) => T)(reader)
        : initialValue;

    const state: StateProviderState<T> = {
      value: currentValue,
      listeners: new Set(),
      // Updater is no longer defined here
    };

    // No specific disposal needed for the value itself unless initialValue function uses onDispose
    // reader.onDispose(() => { console.log('Disposing state provider state'); });

    return state;
  };

  // This function represents the Provider<T> interface.
  // When scope.read(stateProviderInstance) is called, the Scope internally
  // handles retrieving the actual state value from its map using the
  // stateProviderInstance as the key. This function itself doesn't need
  // to contain the read logic directly.
  const providerFn: Provider<T> = () => {
    // This function body is effectively unused at runtime because the Scope's
    // read/initializeProviderState methods handle the logic based on the
    // presence of the [$stateProvider] symbol.
    // Throwing an error here helps catch incorrect direct invocation.
    throw new Error(
      'StateProvider function should not be called directly. Use scope.read(provider).'
    );
  };

  // Cast to internal type to attach metadata without using 'any'
  const internalProvider = providerFn as InternalStateProvider<T>;
  internalProvider[$stateProvider] = { initializeState, name: options?.name };
  internalProvider._fluxus_provider_type = 'StateProvider';

  // The final cast is safe because InternalStateProvider has all properties of StateProviderInstance
  return internalProvider as StateProviderInstance<T>;
}

// --- Scope Extension (Conceptual - needs integration into Scope class) ---

// We need to modify the Scope class to:
// 1. Recognize StateProviderInstance when initializing state.
// 2. Store the *entire* StateProviderState (value + updater + listeners) internally.
// 3. Return only the `value` when `scope.read(stateProviderInstance)` is called.
// 4. Provide a new method `scope.updater(stateProviderInstance)` to retrieve the updater.

/*
// Example of how Scope might be extended:

declare module '../scope' {
  interface Scope {
    updater<T>(provider: StateProviderInstance<T>): StateUpdater<T>;
    // Internal method might be needed
    // getStateProviderState<T>(provider: StateProviderInstance<T>): StateProviderState<T> | undefined;
  }
}

// Implementation within Scope class would involve checking the symbol
// during initialization and read, and adding the `updater` method.
*/
