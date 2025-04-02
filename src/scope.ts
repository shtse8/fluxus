import { Provider, ScopeReader, Dispose, Disposable, isProvider } from './types.js';
import {
  StateProviderInstance,
  isStateProviderInstance,
  StateUpdater,
  StateProviderState,
  $stateProvider
} from './providers/stateProvider.js';
import {
    ComputedProviderInstance,
    isComputedProviderInstance,
    $computedProvider
} from './providers/computedProvider.js';

// --- Internal State Types ---

/** Common fields for all internal provider states within a scope. */
let internalStateIdCounter = 0; // Counter for unique IDs

interface BaseInternalState extends Disposable {
  /** Unique ID for debugging state instances */
  readonly internalId: number;
  /** Explicitly add dispose signature to help TS inference */
  dispose: Dispose;
  /** List of functions to call when this state is disposed. */
  disposeCallbacks: Set<Dispose>;
  /** Set of providers that this provider depends on. */
  dependencies: Set<Provider<any>>;
  /** Set of providers that depend on this provider. */
  dependents: Set<Provider<any>>;
  /** Flag indicating if the value is currently being computed (to detect circular dependencies). */
  isComputing: boolean;
  /** Flag indicating if the state has been disposed. */
  isDisposed: boolean;
  /** Flag indicating if the provider's value might be outdated due to dependency changes. */
  isStale: boolean;
}

/** Internal state for regular (non-StateProvider) providers. */
interface GenericProviderState<T> extends BaseInternalState {
  type: 'generic';
  /** The computed value of the provider. */
  value: T;
}

/** Internal state specific to StateProviders. */
interface StateProviderInternalState<T> extends BaseInternalState {
  type: 'state';
  /** The specific state managed by the StateProvider (value, updater, listeners). */
  stateProviderState: StateProviderState<T>;
}

/** Union type for all possible internal states stored in the scope. */
type InternalState<T> = GenericProviderState<T> | StateProviderInternalState<T>;

// Type guard for StateProviderInternalState
function isStateProviderInternalState<T>(
  state: InternalState<any> | undefined
): state is StateProviderInternalState<any> { // Use <any> here
  return state?.type === 'state';
}

/**
 * Manages the state and lifecycle of providers within a specific context.
 * Scopes can be nested to allow for overriding providers in different parts
 * of an application. Each scope maintains its own instance of provider states.
 *
 * @implements {Disposable}
 */
export class Scope implements Disposable {
  /** Stores the state associated with each provider within this scope. */
  private providerStates = new Map<Provider<any>, InternalState<any>>();
  /** Optional parent scope for provider overrides and nesting. */
  private parent: Scope | null;
  /** Flag indicating if the scope itself has been disposed. */
  private _isDisposed = false; // Renamed internal flag

  /**
   * Indicates whether the scope has been disposed. Once disposed, a scope
   * cannot be used to read or initialize providers.
   * @returns {boolean} True if the scope is disposed, false otherwise.
   */
  public get isDisposed(): boolean {
      return this._isDisposed;
  }

  /**
   * Creates a new Scope instance.
   * @param {Scope | null} [parent=null] - An optional parent scope. If provided,
   *        this scope can potentially inherit or override providers from the parent
   *        (behavior depends on specific provider implementations and future features).
   */
  constructor(parent: Scope | null = null) {
    this.parent = parent;
  }

  /** Checks if the scope or its ancestors have been disposed. */
  private checkDisposed(): void {
    if (this._isDisposed) { // Use internal flag
      throw new Error('Scope has been disposed');
    }
    // Recursively check parent scopes if necessary, though direct check might suffice
    // if disposal propagates correctly.
  }

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
  public read<T>(provider: Provider<T>): T {
    this.checkDisposed();

    // 1. Check local cache
    let state = this.providerStates.get(provider) as InternalState<T> | undefined;

    if (state) {
      // State exists in cache
      if (state.isComputing) {
        throw new Error('Circular dependency detected');
      }
      if (state.isDisposed) {
        throw new Error('Cannot read provider: its state has been disposed');
      }
      if (state.isStale) {
        // State is stale, recompute (only applicable to GenericProviderState)
        if (isStateProviderInternalState(state)) {
          // Should not happen for StateProvider, but return value if it does
          return state.stateProviderState.value;
        } else {
          // Recompute Generic/Computed provider
          return this._computeAndCacheValue(provider, state as GenericProviderState<T>);
        }
      } else {
        // State is valid and not stale, return cached value
        if (isStateProviderInternalState(state)) {
          return state.stateProviderState.value;
        } else {
          return (state as GenericProviderState<T>).value;
        }
      }
    } else {
      // State not found in cache, initialize structure and compute value
      const newState = this._createProviderStateStructure(provider);
      if (isStateProviderInternalState(newState)) {
        // StateProvider value was already computed during structure creation
        return newState.stateProviderState.value;
      } else {
        // For Generic/Computed, compute the value now using the newly created state structure
        return this._computeAndCacheValue(provider, newState as GenericProviderState<T>);
      }
    }
  }

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
  private _createProviderStateStructure<T>(provider: Provider<T>): InternalState<T> {
    // --- Common setup for reader and base state ---
    const dependencies = new Set<Provider<any>>();
    const dependents = new Set<Provider<any>>();
    const disposeCallbacks = new Set<Dispose>();

    // Create and store a placeholder state immediately to detect cycles
    const internalId = internalStateIdCounter++; // Assign unique ID
    const placeholderState: InternalState<any> = {
        internalId,
        type: 'generic', // Placeholder type
        value: undefined,
        isComputing: true,
        isDisposed: false,
        isStale: false,
        dependencies,
        dependents,
        disposeCallbacks,
        dispose: () => { /* Placeholder dispose, real one set later */ }
    };
    this.providerStates.set(provider, placeholderState);

    // Define the base disposal logic here, capturing necessary variables
    const baseDisposeLogic = (stateRef: InternalState<any>, providerKey: Provider<any>) => {
        if (stateRef.isDisposed) return;

        // Mark dependents as stale *before* cleaning up this state
        this.markDependentsStale(providerKey, new Set());

        stateRef.isDisposed = true; // Mark as disposed

        if (isStateProviderInternalState(stateRef)) {
            stateRef.stateProviderState.listeners.clear();
        }
        stateRef.disposeCallbacks.forEach(cb => { try { cb() } catch (e) { console.error("Error during dispose callback:", e)} });
        stateRef.disposeCallbacks.clear();

        // Clean up dependency links *before* clearing local dependencies set
        stateRef.dependencies.forEach(depProvider => {
            const depState = this.providerStates.get(depProvider);
            if (depState && 'dependents' in depState) {
                 depState.dependents.delete(providerKey); // Use providerKey here
            }
        });
        // Clear local sets captured by the state object itself
        stateRef.dependencies.clear();
        stateRef.dependents.clear();

        // Keep the state object in the map but marked as disposed.
    };

    // Determine state type and create final structure
    let internalState: InternalState<T>;
    if (isStateProviderInstance<T>(provider)) {
      // State providers require their specific internal state initialized immediately
      const initReader: ScopeReader = {
          read: <P>(dep: Provider<P>) => this.read(dep),
          watch: <P>(dep: Provider<P>) => this.read(dep), // Watch behaves like read during init
          onDispose: (cb: Dispose) => disposeCallbacks.add(cb),
      };
      const stateProviderState = (provider as any)[$stateProvider].initializeState(initReader, internalId);
      internalState = {
        internalId,
        type: 'state',
        stateProviderState: stateProviderState,
        disposeCallbacks,
        dependencies, // Use the set populated by initReader
        dependents,
        isComputing: false,
        isDisposed: false,
        isStale: false, // Initial value is never stale
        dispose: () => baseDisposeLogic(internalState, provider),
      };
    } else {
      // For computed and generic providers, create a generic structure.
      internalState = {
        internalId,
        type: 'generic',
        value: undefined as T, // Value starts undefined
        disposeCallbacks,
        dependencies, // Will be populated by _computeAndCacheValue
        dependents,
        isComputing: false,
        isDisposed: false,
        isStale: true, // Mark as stale initially
        dispose: () => baseDisposeLogic(internalState, provider),
      };
    }

    // Replace placeholder and return the created structure
    this.providerStates.set(provider, internalState);
    return internalState;
  }

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
  private _computeAndCacheValue<T>(
    provider: Provider<T>,
    state: GenericProviderState<T>
  ): T {
    // Create a reader specific to this computation
    const dependencies = new Set<Provider<any>>();

    // Clear old dependencies links *before* re-computation
    state.dependencies.forEach(oldDepProvider => {
        const oldDepState = this.providerStates.get(oldDepProvider);
        if (oldDepState && 'dependents' in oldDepState) {
            oldDepState.dependents.delete(provider);
        }
    });
    state.dependencies.clear(); // Clear the local set

    const reader: ScopeReader = {
      read: <P>(depProvider: Provider<P>): P => {
        dependencies.add(depProvider); // Track new dependency for the provider being computed
        const value = this.read(depProvider); // Delegate read (this might initialize depProvider)
        // Re-fetch the state *after* reading, ensuring it's initialized
        const depState = this.providerStates.get(depProvider);
        // Add the provider *being computed* to the dependents list of the dependency
        if (depState && 'dependents' in depState) {
             // console.log(`DEBUG _compute reader.read: Adding dependent ${state.internalId} to dependency ${depState.internalId}`); // Optional debug
             depState.dependents.add(provider); // 'provider' is the one being computed
        }
        return value;
      },
      watch: <P>(depProvider: Provider<P>): P => {
         dependencies.add(depProvider); // Track new dependency for the provider being computed
         const value = this.read(depProvider); // Delegate read (this might initialize depProvider)
         // Re-fetch the state *after* reading, ensuring it's initialized
         const depState = this.providerStates.get(depProvider);
         // Add the provider *being computed* to the dependents list of the dependency
         if (depState && 'dependents' in depState) {
             // console.log(`DEBUG _compute reader.watch: Adding dependent ${state.internalId} to dependency ${depState.internalId}`); // Optional debug
             depState.dependents.add(provider); // 'provider' is the one being computed
         }
         // TODO: Establish actual subscription?
         return value;
      },
      onDispose: (callback: Dispose): void => {
        if (state.isDisposed) return;
        state.disposeCallbacks.add(callback);
      }
    };

    state.isComputing = true;
    let newValue: T;
    try {
      // Determine how to get the value based on provider type
      if (isComputedProviderInstance<T>(provider)) {
        newValue = (provider as any)[$computedProvider].compute(reader);
      } else {
        newValue = provider(reader); // Generic provider
      }

      // Update state
      state.value = newValue;
      state.dependencies = dependencies; // Store the new dependencies
      state.isStale = false;
      state.isComputing = false;
      return newValue;

    } catch (error) {
      state.isComputing = false;
      // Re-throw error but leave state potentially stale/partially cleaned?
      throw error;
    }
  }

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
  public updater<T>(provider: StateProviderInstance<T>): StateUpdater<T> {
    this.checkDisposed();
    // Check if the provider is initialized and is actually a StateProvider *before* returning the updater function.
    // Reading it ensures initialization.
    this.read(provider); // Ensure initialized and get potential errors early
    const state = this.providerStates.get(provider);

    // Perform the check here
    if (!isStateProviderInternalState<T>(state)) {
         throw new Error('Provider is not a StateProvider or state is inconsistent');
    }
     if (state.isDisposed) {
        // This check might be redundant if read() already threw, but keep for safety
        throw new Error('Cannot get updater for a disposed provider state');
    }


    // Return a function that performs the update using the current scope instance ('this')
    // and the specific provider key.
    return (scopeInstance: Scope, providerInstance: StateProviderInstance<T>, newValueOrFn: T | ((prev: T) => T)) => {
        // Check scope disposal *again* inside the returned function, as it might be called later
        try {
            scopeInstance.checkDisposed();
        } catch (e) {
             return;
        }

        const currentState = scopeInstance.providerStates.get(providerInstance) as StateProviderInternalState<T> | undefined;

        // Check if the state exists, is the correct type, and is not disposed
        if (!currentState || !isStateProviderInternalState(currentState) || currentState.isDisposed) {
            // Log the ID we attempted to find state for, if possible
            const attemptedId = currentState ? currentState.internalId : 'unknown';
            return;
        }


        const stateProviderState = currentState.stateProviderState;
        const previousValue = stateProviderState.value;

        const newValue = typeof newValueOrFn === 'function'
            ? (newValueOrFn as (prev: T) => T)(previousValue)
            : newValueOrFn;

        if (!Object.is(previousValue, newValue)) {
            stateProviderState.value = newValue;
            // Notify listeners from the *current* state
            const listenersToNotify = Array.from(stateProviderState.listeners);
            listenersToNotify.forEach(listener => listener());

            // Mark dependents as stale and notify their listeners
            scopeInstance.markDependentsStale(providerInstance, new Set());
        }
    };
  }

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
  private markDependentsStale(provider: Provider<any>, visited: Set<Provider<any>>): void {
    // DEBUG: Log entry and the provider being processed
    const providerState = this.providerStates.get(provider);
    // console.log(`DEBUG: Entering markDependentsStale for provider (Internal ID: ${providerState?.internalId ?? 'N/A'})`);
    if (visited.has(provider)) {
        return; // Avoid infinite loops
    }
    visited.add(provider);

    const state = this.providerStates.get(provider);
    if (!state || state.isDisposed) return;

    state.dependents.forEach(dependentProvider => {
        const dependentState = this.providerStates.get(dependentProvider);
        // Check if dependent exists and is not disposed
        if (dependentState && !dependentState.isDisposed) {
            // Mark stale unconditionally if it wasn't already.
            // This ensures the staleness propagates even if listeners aren't notified directly.
            const wasAlreadyStale = dependentState.isStale;
            if (!wasAlreadyStale) {
                 // console.log(`DEBUG markDependentsStale: Marking dependent ${dependentState.internalId} as stale.`); // DEBUG
                 dependentState.isStale = true;
            }

            // Notify listeners if it's a StateProvider (listeners are only stored there currently)
            if (isStateProviderInternalState(dependentState)) {
                const listeners = dependentState.stateProviderState.listeners;
                 if (listeners.size > 0) {
                    // console.log(`DEBUG markDependentsStale: Notifying ${listeners.size} listeners of stale StateProvider ${dependentState.internalId}.`); // DEBUG
                    // Convert to array before iterating in case a listener modifies the set during iteration
                    Array.from(listeners).forEach(listener => listener());
                 }
            }

            // Recursively mark *its* dependents as stale
            this.markDependentsStale(dependentProvider, visited);
        }
    });
  }
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
  public watch<T>(provider: Provider<T>, callback: () => void): Dispose {
    this.checkDisposed();

    // Ensure the provider is initialized by reading it first.
    // This also retrieves the current state if already initialized.
    this.read(provider);
    const state = this.providerStates.get(provider);

    if (!state || state.isDisposed) {
      // Should not happen if read() succeeded, but check for safety.
      return () => {}; // Return a no-op unsubscribe function
    }

    // Currently, only StateProviders actively notify listeners.
    // Other provider types (computed, future) will need different mechanisms.
    // TODO: Generalize listener handling? Add listeners set to BaseInternalState?
    if (isStateProviderInternalState(state)) {
      const listeners = state.stateProviderState.listeners;
      listeners.add(callback);

      // Return the unsubscribe function
      return () => {
        listeners.delete(callback);
        // Auto-dispose if listener count drops to zero
        if (listeners.size === 0) {
            // We need to access the state again here, using the provider key
            // The 'state' variable from the outer scope should still be valid here
            // Check if it still exists and hasn't been disposed by other means
            if (state && !state.isDisposed) {
                 // console.log(`DEBUG: Auto-disposing state due to zero listeners (Internal ID: ${state.internalId})`); // Optional debug
                 state.dispose(); // Dispose the internal state
            }
        }
      };
    } else {
      // For generic/computed providers, there's nothing to watch directly yet.
      // Re-computation happens via staleness check in `read`.
      // Return a no-op unsubscribe.
      return () => {};
    }
  }


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
  public dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._isDisposed = true; // Use internal flag

    // Dispose providers in reverse order of initialization? Not strictly necessary
    // if dependencies are handled correctly, but might prevent some issues.
    // For now, dispose in map iteration order.
    // Create a copy of states to dispose, as disposal modifies the map
    const statesToDispose = Array.from(this.providerStates.values());
    statesToDispose.forEach(state => {
      // Ensure dispose is called only once via the state's internal flag
      if (!state.isDisposed) {
          state.dispose();
      }
    });

    this.providerStates.clear();
    this.parent = null; // Break potential reference cycle
    // console.log("Scope disposed");
  }
}

/**
 * Factory function to create a new {@link Scope}.
 * @param {Scope | null} [parent=null] - An optional parent scope.
 * @returns {Scope} A new Scope instance.
 */
export function createScope(parent: Scope | null = null): Scope {
    return new Scope(parent);
}

// Example usage (conceptual)
// const scope = createScope();
// const value = scope.read(myProvider);
// scope.dispose();