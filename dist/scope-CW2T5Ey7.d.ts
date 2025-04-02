/**
 * Represents a function that can be called to clean up resources or subscriptions.
 * @returns {void}
 */
type Dispose = () => void;
/**
 * Represents an object that holds a disposable resource or manages a lifecycle
 * that requires explicit cleanup.
 */
interface Disposable {
    /**
     * Disposes of the resource or ends the lifecycle managed by this object.
     * Calling dispose multiple times should be safe (idempotent).
     */
    dispose: Dispose;
}
/**
 * Provides read access to other providers within the current scope and methods
 * for managing the lifecycle of the current provider's state.
 * Passed to the provider's creation function.
 */
interface ScopeReader {
    /**
     * Reads the current value of a provider without subscribing to updates.
     * If the provider is not yet initialized in the scope, it will be created.
     * @param provider The provider to read.
     * @template P The type of the value provided by the dependency provider.
     * @param provider The dependency provider to read.
     * @returns The current value of the dependency provider within the current scope.
     */
    read<T>(provider: Provider<T>): T;
    /**
     * Watches the value of a provider and subscribes to updates.
     * This is typically used by reactive providers or UI bindings.
     * @template P The type of the value provided by the dependency provider.
     * @param provider The dependency provider to watch.
     * @returns The current value of the provider.
     */
    watch<T>(provider: Provider<T>): T;
    /**
     * Adds a cleanup function to be called when the provider's state
     * associated with the current scope is disposed.
     * @param callback The cleanup function to be executed.
     */
    onDispose(callback: Dispose): void;
}
/**
 * The core building block of Fluxus. A Provider defines how to create a value
 * within a specific scope. Providers are functions or objects that encapsulate
 * state creation logic.
 *
 * Providers are typically created using factory functions like `stateProvider`,
 * `computedProvider`, etc.
 *
 * They are identified by object identity, meaning you don't register them
 * with strings; you use the provider function/object itself as the key.
 *
 * @template T The type of the value created by the provider.
 * @param reader A {@link ScopeReader} instance to interact with the scope.
 * @returns The created value of type T.
 */
type Provider<T> = (reader: ScopeReader) => T;
/**
 * A basic type guard to check if an unknown value is potentially a Fluxus provider.
 * Note: This is a very basic check and might need refinement if provider
 * structures become more complex (e.g., objects with specific methods).
 * @template T The potential type provided by the provider.
 * @param obj The value to check.
 * @returns True if the value is a function (the basic form of a provider), false otherwise.
 */
declare function isProvider<T>(obj: unknown): obj is Provider<T>;

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
type StateUpdater<T> = (scope: Scope, provider: StateProviderInstance<T>, newValue: T | ((prev: T) => T)) => void;
/**
 * Represents the internal state associated with a specific {@link StateProviderInstance}
 * within a particular {@link Scope}.
 *
 * @template T The type of the state value.
 */
interface StateProviderState<T> {
    /** The current value of the state. */
    value: T;
    /** A set of listener callbacks subscribed to changes in this state within the scope. */
    listeners: Set<() => void>;
}
declare const $stateProvider: unique symbol;
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
interface StateProviderInstance<T> extends Provider<T> {
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
    };
    /** @internal A read-only property for easier type narrowing if needed. */
    readonly _fluxus_provider_type: 'StateProvider';
}
/**
 * Type guard to check if a given value is a {@link StateProviderInstance}.
 *
 * @template T The potential type of the state managed by the provider.
 * @param {unknown} provider The value to check.
 * @returns {provider is StateProviderInstance<T>} True if the value is a StateProviderInstance, false otherwise.
 */
declare function isStateProviderInstance<T>(provider: unknown): provider is StateProviderInstance<T>;
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
declare function stateProvider<T>(initialValue: T | ((reader: ScopeReader) => T)): StateProviderInstance<T>;

/**
 * Manages the state and lifecycle of providers within a specific context.
 * Scopes can be nested to allow for overriding providers in different parts
 * of an application. Each scope maintains its own instance of provider states.
 *
 * @implements {Disposable}
 */
declare class Scope implements Disposable {
    /** Stores the state associated with each provider within this scope. */
    private providerStates;
    /** Optional parent scope for provider overrides and nesting. */
    private parent;
    /** Flag indicating if the scope itself has been disposed. */
    private _isDisposed;
    /**
     * Indicates whether the scope has been disposed. Once disposed, a scope
     * cannot be used to read or initialize providers.
     * @returns {boolean} True if the scope is disposed, false otherwise.
     */
    get isDisposed(): boolean;
    /**
     * Creates a new Scope instance.
     * @param {Scope | null} [parent=null] - An optional parent scope. If provided,
     *        this scope can potentially inherit or override providers from the parent
     *        (behavior depends on specific provider implementations and future features).
     */
    constructor(parent?: Scope | null);
    /** Checks if the scope or its ancestors have been disposed. */
    private checkDisposed;
    /**
     * Reads the current value of a given provider within this scope.
     *
     * If the provider has already been initialized in this scope, its cached value
     * is returned. If the provider's state is marked as stale (due to a dependency change),
     * it will be recomputed before returning the value.
     *
     * If the provider has not been initialized, its creation function will be executed,
     * its dependencies tracked, and the resulting value cached and returned.
     *
     * Throws an error if the scope or the specific provider state has been disposed,
     * or if a circular dependency is detected during initialization.
     *
     * @template T The type of the value provided.
     * @param {Provider<T>} provider The provider function/object to read.
     * @returns {T} The current value of the provider.
     * @throws {Error} If the scope or provider state is disposed.
     * @throws {Error} If a circular dependency is detected.
     */
    read<T>(provider: Provider<T>): T;
    /**
    * Creates the internal state structure for a given provider within this scope,
    * but does not compute the initial value unless it's a StateProvider.
    * Sets up internal state tracking (dependencies, dependents, lifecycle callbacks).
    * This method is called internally by `read` when a provider is accessed
    * for the first time.
    *
    * @template T The type of the value provided.
    * @param {Provider<T>} provider The provider to initialize the state structure for.
    * @returns {InternalState<T>} The created internal state structure.
    * @private
    */
    private _createProviderStateStructure;
    /**
     * Computes or recomputes the value for a generic or computed provider,
     * updates its state, and returns the new value.
     *
     * @template T The type of the value provided.
     * @param {Provider<T>} provider The provider being computed.
     * @param {GenericProviderState<T>} state The internal state object for the provider.
     * @returns {T} The computed value.
     * @private
     */
    private _computeAndCacheValue;
    /**
     * Retrieves the specialized updater function for a {@link StateProviderInstance}.
     *
     * This method ensures the provider is initialized and is indeed a `StateProvider`.
     * It returns a function that, when called, will update the provider's state
     * within this specific scope and notify listeners and dependents.
     *
     * Throws an error if the scope is disposed, the provider is not a `StateProviderInstance`,
     * or the provider state is disposed or inconsistent.
     *
     * @template T The type of the state managed by the StateProvider.
     * @param {StateProviderInstance<T>} provider The StateProviderInstance whose updater is needed.
     * @returns {StateUpdater<T>} The updater function bound to this scope and provider.
     * @throws {Error} If the scope is disposed.
     * @throws {Error} If the provider is not a valid, initialized StateProvider in this scope.
     */
    updater<T>(provider: StateProviderInstance<T>): StateUpdater<T>;
    /**
     * Recursively marks dependents of a given provider as stale and notifies
     * any listeners attached to those dependents (primarily for UI updates via `watch`).
     * This is called when a provider's state changes.
     *
     * Uses a Set to track visited providers in the current propagation chain
     * to prevent infinite loops in potential (though ideally non-existent)
     * circular dependency scenarios during notification.
     *
     * @param {Provider<any>} provider The provider whose dependents should be marked stale.
     * @param {Set<Provider<any>>} visited Set of providers already visited in this notification chain.
     * @private
     */
    private markDependentsStale;
    /**
     * Subscribes a listener function to changes in a specific provider's state within this scope.
     *
     * Currently, only {@link StateProviderInstance} actively supports notifications. Watching
     * other provider types might read the initial value but won't trigger the callback
     * on changes (unless they are dependents of a changing StateProvider, triggering staleness).
     *
     * Ensures the provider is initialized before attempting to add the listener.
     * Implements auto-disposal: when the last listener for a provider unsubscribes,
     * the provider's internal state is disposed.
     *
     * @template T The type of the value provided.
     * @param {Provider<T>} provider The provider to watch.
     * @param {() => void} callback The function to call when the provider's state changes.
     * @returns {Dispose} A function to call to unsubscribe the listener.
     */
    watch<T>(provider: Provider<T>, callback: () => void): Dispose;
    /**
     * Disposes of the scope, cleaning up all provider states created within it.
     *
     * This involves:
     * - Marking the scope itself as disposed.
     * - Iterating through all active provider states in the scope.
     * - Calling the `dispose` method on each provider state, which in turn:
     *   - Clears internal listeners (for StateProviders).
     *   - Executes any `onDispose` callbacks registered during provider initialization.
     *   - Cleans up dependency/dependent links.
     * - Clearing the internal map of provider states.
     *
     * Once disposed, the scope and its provider states should not be used further.
     */
    dispose(): void;
}
/**
 * Factory function to create a new {@link Scope}.
 * @param {Scope | null} [parent=null] - An optional parent scope.
 * @returns {Scope} A new Scope instance.
 */
declare function createScope(parent?: Scope | null): Scope;

export { type Dispose as D, type Provider as P, type ScopeReader as S, Scope as a, type Disposable as b, createScope as c, isStateProviderInstance as d, type StateProviderInstance as e, type StateUpdater as f, isProvider as i, stateProvider as s };
