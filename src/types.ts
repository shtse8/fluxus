/**
 * Represents a function that can be called to clean up resources or subscriptions.
 * @returns {void}
 */
export type Dispose = () => void;

/**
 * Represents an object that holds a disposable resource or manages a lifecycle
 * that requires explicit cleanup.
 */
export interface Disposable {
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
export interface ScopeReader {
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
  watch<T>(provider: Provider<T>): T; // Implementation detail: watching implies reading

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
export type Provider<T> = (reader: ScopeReader) => T;

/** A unique symbol to identify providers internally. */
export const $provider = Symbol.for('fluxus.provider');

/**
 * A basic type guard to check if an unknown value is potentially a Fluxus provider.
 * Note: This is a very basic check and might need refinement if provider
 * structures become more complex (e.g., objects with specific methods).
 * @template T The potential type provided by the provider.
 * @param obj The value to check.
 * @returns True if the value is a function (the basic form of a provider), false otherwise.
 */
export function isProvider<T>(obj: unknown): obj is Provider<T> {
    return typeof obj === 'function';
}

// More specific provider types (like StateProvider, ComputedProvider) will extend or utilize this base concept.