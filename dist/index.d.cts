import { S as ScopeReader, P as Provider } from './scope-CW2T5Ey7.cjs';
export { b as Disposable, D as Dispose, a as Scope, e as StateProviderInstance, f as StateUpdater, c as createScope, i as isProvider, d as isStateProviderInstance, s as stateProvider } from './scope-CW2T5Ey7.cjs';

/**
 * Represents the internal state associated with a specific {@link ComputedProviderInstance}
 * within a particular {@link Scope}. Computed providers typically don't have listeners
 * themselves but rely on dependencies notifying them to become stale.
 *
 * @template T The type of the computed state value.
 */
/** A unique symbol to identify ComputedProvider instances. */
declare const $computedProvider: unique symbol;
/**
 * Represents an instance of a ComputedProvider.
 * It acts as a Provider<T> for reading the computed value. It carries metadata
 * via a symbol to distinguish it during initialization.
 *
 * @template T The type of the computed value.
 * @extends {Provider<T>}
 */
interface ComputedProviderInstance<T> extends Provider<T> {
    /** @internal A unique symbol used to identify ComputedProvider instances. */
    [$computedProvider]: {
        /**
         * @internal The computation function provided when the provider was created.
         * This function is called by the Scope during initialization or recomputation.
         * @param {ScopeReader} reader - The reader for the current scope.
         * @returns {T} The computed value.
         */
        compute: (reader: ScopeReader) => T;
    };
    /** @internal A read-only property for easier type narrowing if needed. */
    readonly _fluxus_provider_type: 'ComputedProvider';
}
/**
 * Type guard to check if a given value is a {@link ComputedProviderInstance}.
 *
 * @template T The potential type of the computed value.
 * @param {unknown} provider The value to check.
 * @returns {provider is ComputedProviderInstance<T>} True if the value is a ComputedProviderInstance, false otherwise.
 */
declare function isComputedProviderInstance<T>(provider: unknown): provider is ComputedProviderInstance<T>;
/**
 * Creates a {@link ComputedProviderInstance} which derives its state by computing
 * a value based on other providers.
 *
 * The computation function is executed lazily when the provider is first read
 * within a scope, and its result is cached. The computed value is automatically
 * re-evaluated when any of the providers it `read` or `watch`ed during the
 * computation change their state.
 *
 * @template T The type of the computed value.
 * @param {(reader: ScopeReader) => T} compute - The function that computes the
 *   derived state. It receives a {@link ScopeReader} to access other providers.
 *   It's crucial to use `reader.watch` or `reader.read` within this function
 *   to establish dependencies correctly for automatic recomputation.
 * @returns {ComputedProviderInstance<T>} The created ComputedProvider instance.
 *
 * @example
 * const countProvider = stateProvider(0);
 * const doubleCountProvider = computedProvider((reader) => {
 *   const count = reader.watch(countProvider); // Establish dependency
 *   const count = reader.watch(countProvider); // Establish dependency
 *   return count * 2;
 * });
 *
 * @see {@link stateProvider} for creating mutable state.
 * @see {@link ScopeReader} for how to access dependencies.
 * });
 */
declare function computedProvider<T>(compute: (reader: ScopeReader) => T): ComputedProviderInstance<T>;

export { type ComputedProviderInstance, Provider, ScopeReader, computedProvider, isComputedProviderInstance };
