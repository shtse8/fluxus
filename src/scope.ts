import {
  Provider,
  ScopeReader,
  Dispose,
  Disposable,
  isProvider,
  AsyncValue,
  hasData,
  ProviderOverride, // Added ProviderOverride
} from './types.js';
import {
  StateProviderInstance,
  isStateProviderInstance,
  StateUpdater,
  StateProviderState,
  $stateProvider,
} from './providers/stateProvider.js';
import {
  ComputedProviderInstance,
  isComputedProviderInstance,
  $computedProvider,
} from './providers/computedProvider.js';
import {
  AsyncProviderInstance,
  isAsyncProviderInstance,
  AsyncProviderState as AsyncProviderInternalStateDefinition,
  $asyncProvider,
} from './providers/asyncProvider.js';
import {
  StreamProviderInstance,
  isStreamProviderInstance,
  StreamProviderState as StreamProviderInternalStateDefinition,
  $streamProvider,
} from './providers/streamProvider.js';

// --- Internal State Types ---

let internalStateIdCounter = 0;

interface BaseInternalState extends Disposable {
  readonly internalId: number;
  dispose: Dispose;
  disposeCallbacks: Set<Dispose>;
  dependencies: Set<Provider<unknown>>; // Changed any to unknown
  dependents: Set<Provider<unknown>>; // Changed any to unknown
  isComputing: boolean;
  isDisposed: boolean;
  isStale: boolean;
  listeners: Set<() => void>;
  notifyListeners: () => void;
}

interface GenericProviderState<T> extends BaseInternalState {
  type: 'generic';
  value: T;
}

interface StateProviderInternalState<T> extends BaseInternalState {
  type: 'state';
  stateProviderState: StateProviderState<T>;
}

interface AsyncProviderInternalState<T> extends BaseInternalState {
  type: 'async';
  asyncProviderState: AsyncProviderInternalStateDefinition<T>;
}

interface StreamProviderInternalState<T> extends BaseInternalState {
  type: 'stream';
  streamProviderState: StreamProviderInternalStateDefinition<T>;
}

type InternalState<T> =
  | GenericProviderState<T>
  | StateProviderInternalState<T>
  | AsyncProviderInternalState<T>
  | StreamProviderInternalState<T>;

// Type guards
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isStateProviderInternalState<_T>(
  state: InternalState<unknown> | undefined // Changed any to unknown
): state is StateProviderInternalState<unknown> {
  // Changed any to unknown
  return state?.type === 'state';
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isAsyncProviderInternalState<_T>(
  state: InternalState<unknown> | undefined // Changed any to unknown
): state is AsyncProviderInternalState<unknown> {
  // Changed any to unknown
  return state?.type === 'async';
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isStreamProviderInternalState<_T>(
  state: InternalState<unknown> | undefined // Changed any to unknown
): state is StreamProviderInternalState<unknown> {
  // Changed any to unknown
  return state?.type === 'stream';
}

/**
 * Manages the state and lifecycle of providers within a specific context.
 * @implements {Disposable}
 */
export class Scope implements Disposable {
  private providerStates = new Map<Provider<unknown>, InternalState<unknown>>(); // Changed any to unknown
  private parent: Scope | null;
  private overridesMap = new Map<Provider<unknown>, Provider<unknown> | unknown>(); // Changed any to unknown
  private _isDisposed = false;

  public get isDisposed(): boolean {
    return this._isDisposed;
  }

  constructor(_parent: Scope | null = null, overrides: ReadonlyArray<ProviderOverride> = []) {
    // Mark parent as unused
    this.parent = _parent; // parent is currently unused, consider removing if not needed for future features
    overrides.forEach((override) => {
      this.overridesMap.set(override.provider, override.useValue);
    });
  }

  private checkDisposed(): void {
    if (this._isDisposed) {
      throw new Error('Scope has been disposed');
    }
  }

  /** Safely gets the debug name of a provider, if available. @private */
  private _getProviderName(provider: Provider<unknown>): string {
    // Changed any to unknown
    if (isStateProviderInstance(provider)) {
      return provider[$stateProvider]?.name ?? '<stateProvider>';
    }
    if (isComputedProviderInstance(provider)) {
      return provider[$computedProvider]?.name ?? '<computedProvider>';
    }
    if (isAsyncProviderInstance(provider)) {
      return provider[$asyncProvider]?.options?.name ?? '<asyncProvider>';
    }
    if (isStreamProviderInstance(provider)) {
      return provider[$streamProvider]?.name ?? '<streamProvider>';
    }
    // Could potentially check for a 'name' property on generic functions?
    return provider.name || '<unknownProvider>';
  }

  public read<T>(provider: Provider<T>): T {
    this.checkDisposed();

    // --- 1. Check for overrides ---
    const override = this.overridesMap.get(provider);
    let targetProvider = provider; // Use targetProvider for lookups
    if (override !== undefined) {
      // Check if the override itself is a provider function
      if (isProvider(override)) {
        targetProvider = override as Provider<T>; // Use overriding provider
      } else {
        // If not a provider, it's a direct value override
        return override as T;
      }
    }
    // --- End Override Check ---

    // --- 2. Check local cache (using targetProvider) ---
    let state = this.providerStates.get(targetProvider) as InternalState<T> | undefined; // Keep T here as it's generic

    if (state) {
      // State exists
      if (state.isComputing)
        throw new Error(
          `Circular dependency detected while reading provider '${this._getProviderName(targetProvider)}' (ID: ${state.internalId})`
        );
      if (state.isDisposed)
        throw new Error(
          `Cannot read provider '${this._getProviderName(targetProvider)}' (ID: ${state.internalId}): its state has been disposed`
        );

      if (state.isStale) {
        // Handle stale state based on type
        if (isStateProviderInternalState(state)) {
          return state.stateProviderState.value; // Not stale this way
        } else if (isAsyncProviderInternalState(state)) {
          // Execution triggered by markDependentsStale, return current value
          return state.asyncProviderState.value as T;
        } else if (isStreamProviderInternalState(state)) {
          // Dispose old, re-initialize, copy listeners, return new initial value
          const oldListeners = new Set(state.listeners);
          state.dispose(); // Dispose the old state (this will trigger unsubscribe via callbacks)
          const newState = this._createProviderStateStructure(targetProvider); // Create new state
          oldListeners.forEach((listener) => newState.listeners.add(listener)); // Re-attach listeners
          if (isStreamProviderInternalState(newState)) {
            // Return the initial value of the *new* state
            return newState.streamProviderState.value as T;
            return (newState as StreamProviderInternalState<T>).streamProviderState.value as T;
          } else {
            console.error(
              `Internal error: Inconsistent state type after re-initializing stream provider '${this._getProviderName(targetProvider)}' (ID: ${newState.internalId})`
            );
            throw new Error(
              `Internal error: Inconsistent provider state type for '${this._getProviderName(targetProvider)}'`
            );
          }
        } else {
          // Generic/Computed: Recompute value
          return this._computeAndCacheValue(targetProvider, state as GenericProviderState<T>);
        }
      } else {
        // Return cached value
        if (isStateProviderInternalState(state)) {
          return state.stateProviderState.value;
        } else if (isAsyncProviderInternalState(state)) {
          return state.asyncProviderState.value as T;
        } else if (isStreamProviderInternalState(state)) {
          return state.streamProviderState.value as T;
        } else {
          return (state as GenericProviderState<T>).value;
        }
      }
    } else {
      // --- 3. Initialize state (using targetProvider) ---
      const newState = this._createProviderStateStructure(targetProvider);
      if (isStateProviderInternalState(newState)) {
        return newState.stateProviderState.value;
      } else if (isAsyncProviderInternalState(newState)) {
        return newState.asyncProviderState.value as T;
      } else if (isStreamProviderInternalState(newState)) {
        return newState.streamProviderState.value as T;
      } else {
        // Generic/Computed needs initial computation
        return this._computeAndCacheValue(targetProvider, newState as GenericProviderState<T>);
      }
    }
  }

  /** Creates the internal state structure for a given provider. @private */
  private _createProviderStateStructure<T>(provider: Provider<T>): InternalState<T> {
    const dependencies = new Set<Provider<unknown>>(); // Changed any to unknown
    const dependents = new Set<Provider<unknown>>(); // Changed any to unknown
    const disposeCallbacks = new Set<Dispose>();
    const listeners = new Set<() => void>();
    const internalId = internalStateIdCounter++;

    const placeholderState: Partial<BaseInternalState> & { type: string } = {
      internalId,
      type: 'generic',
      isComputing: true,
      isDisposed: false,
      isStale: false,
      dependencies,
      dependents,
      disposeCallbacks,
      listeners,
      notifyListeners: () => {},
      dispose: () => {},
    };
    this.providerStates.set(provider, placeholderState as InternalState<unknown>); // Changed any to unknown

    const baseDisposeLogic = (stateRef: InternalState<unknown>, providerKey: Provider<unknown>) => {
      // Changed any to unknown
      if (stateRef.isDisposed) return;
      // Mark dependents stale during disposal so they re-evaluate
      this.markDependentsStale(providerKey, new Set());
      stateRef.isDisposed = true;
      stateRef.listeners.clear();
      stateRef.disposeCallbacks.forEach((cb) => {
        try {
          cb();
        } catch (e) {
          console.error(
            `Error during dispose callback for provider '${this._getProviderName(providerKey)}' (ID: ${stateRef.internalId}):`,
            e
          );
        }
      });
      stateRef.disposeCallbacks.clear();
      stateRef.dependencies.forEach((depProvider) => {
        const depState = this.providerStates.get(depProvider);
        if (depState?.dependents) {
          depState.dependents.delete(providerKey);
        }
      });
      stateRef.dependencies.clear();
      stateRef.dependents.clear();
      if (isAsyncProviderInternalState(stateRef)) {
        stateRef.asyncProviderState.abortController?.abort();
      }
      // Stream unsubscription handled via disposeCallbacks added during subscribe
    };

    const notifyListeners = () => {
      // Note: We don't have the provider context here easily.
      Array.from(listeners).forEach((listener) => {
        try {
          listener();
        } catch (e) {
          console.error(`Error in listener callback (Provider ID: ${internalId}):`, e);
        }
      });
    };

    let internalState: InternalState<T>;

    const initReader: ScopeReader = {
      read: <P>(dep: Provider<P>) => this._trackDependency(dep, provider, dependencies),
      watch: <P>(dep: Provider<P>) => this._trackDependency(dep, provider, dependencies),
      onDispose: (cb: Dispose) => disposeCallbacks.add(cb),
    };

    // --- Determine Provider Type and Initialize State ---
    if (isStateProviderInstance<T>(provider)) {
      const stateProviderState = (provider as StateProviderInstance<T>)[
        $stateProvider
      ].initializeState(initReader, internalId);
      internalState = {
        internalId,
        type: 'state',
        stateProviderState,
        disposeCallbacks,
        dependencies,
        dependents,
        isComputing: false,
        isDisposed: false,
        isStale: false,
        listeners,
        notifyListeners,
        dispose: () => baseDisposeLogic(internalState, provider),
      };
    } else if (isAsyncProviderInstance<T>(provider)) {
      const initialValue: AsyncValue<unknown> = { state: 'loading' }; // Changed any to unknown
      const abortController = new AbortController();
      const asyncState: AsyncProviderInternalStateDefinition<unknown> = {
        // Changed any to unknown
        value: initialValue,
        listeners: new Set(),
        notifyListeners,
        onDisposeCallback: undefined,
        abortController,
        isExecuting: false,
        currentExecution: undefined,
      };
      internalState = {
        internalId,
        type: 'async',
        asyncProviderState: asyncState as AsyncProviderInternalStateDefinition<T>, // Cast needed here
        disposeCallbacks,
        dependencies,
        dependents,
        isComputing: false,
        isDisposed: false,
        isStale: false,
        listeners,
        notifyListeners,
        dispose: () => baseDisposeLogic(internalState, provider),
      };
      this._executeAsyncProvider(
        provider as AsyncProviderInstance<T>,
        internalState as AsyncProviderInternalState<T>
      ); // Cast needed
    } else if (isStreamProviderInstance<T>(provider)) {
      const initialValue: AsyncValue<unknown> = { state: 'loading' }; // Changed any to unknown
      const streamState: StreamProviderInternalStateDefinition<unknown> = {
        // Changed any to unknown
        value: initialValue,
        notifyListeners,
        subscription: undefined,
        onDisposeCallback: undefined,
        isTerminated: false,
      };
      internalState = {
        internalId,
        type: 'stream',
        streamProviderState: streamState as StreamProviderInternalStateDefinition<T>, // Cast needed here
        disposeCallbacks,
        dependencies,
        dependents,
        isComputing: false,
        isDisposed: false,
        isStale: false,
        listeners,
        notifyListeners,
        dispose: () => baseDisposeLogic(internalState, provider),
      };
      try {
        const subscribable = (provider as StreamProviderInstance<T>)[$streamProvider].create(
          initReader
        );
        let unsubscribed = false;
        const unsubscribeLogic = () => {
          if (unsubscribed) return;
          unsubscribed = true;
          streamState.subscription?.unsubscribe();
        };
        disposeCallbacks.add(unsubscribeLogic); // Add core unsubscribe logic

        streamState.subscription = subscribable.subscribe({
          next: (data: T) => {
            if (internalState.isDisposed || streamState.isTerminated) return;
            streamState.value = { state: 'data', data };
            internalState.notifyListeners();
            this.markDependentsStale(provider, new Set());
          },
          error: (error: unknown) => {
            if (internalState.isDisposed || streamState.isTerminated) return;
            console.error(
              `Error in streamProvider '${this._getProviderName(provider)}' (ID: ${internalId}):`,
              error
            );
            const previousData = hasData(streamState.value) ? streamState.value.data : undefined;
            streamState.value = { state: 'error', error, previousData };
            streamState.isTerminated = true;
            unsubscribeLogic(); // Unsubscribe on error
            internalState.notifyListeners();
            this.markDependentsStale(provider, new Set());
          },
          complete: () => {
            if (internalState.isDisposed || streamState.isTerminated) return;
            streamState.isTerminated = true;
            unsubscribeLogic(); // Unsubscribe on completion
          },
        });
      } catch (error: unknown) {
        console.error(
          `Error creating stream for streamProvider '${this._getProviderName(provider)}' (ID: ${internalId}):`,
          error
        );
        streamState.value = { state: 'error', error };
        streamState.isTerminated = true;
      }
    } else {
      // Generic / Computed Provider
      internalState = {
        internalId,
        type: 'generic',
        value: undefined as T,
        disposeCallbacks,
        dependencies,
        dependents,
        isComputing: false,
        isDisposed: false,
        isStale: true, // Generic/Computed start stale
        listeners,
        notifyListeners,
        dispose: () => baseDisposeLogic(internalState, provider),
      };
    }

    this.providerStates.set(provider, internalState);
    return internalState;
  }

  /** Computes/recomputes value for generic/computed providers. @private */
  private _computeAndCacheValue<T>(provider: Provider<T>, state: GenericProviderState<T>): T {
    const dependencies = new Set<Provider<unknown>>(); // Changed any to unknown
    state.dependencies.forEach((oldDepProvider) => {
      const oldDepState = this.providerStates.get(oldDepProvider);
      if (oldDepState?.dependents) {
        oldDepState.dependents.delete(provider);
      }
    });
    state.dependencies.clear();

    const reader: ScopeReader = {
      read: <P>(depProvider: Provider<P>): P =>
        this._trackDependency(depProvider, provider, dependencies),
      watch: <P>(depProvider: Provider<P>): P =>
        this._trackDependency(depProvider, provider, dependencies),
      onDispose: (callback: Dispose): void => {
        if (state.isDisposed) return;
        state.disposeCallbacks.add(callback);
      },
    };

    state.isComputing = true;
    let newValue: T;
    try {
      if (isComputedProviderInstance<T>(provider)) {
        newValue = (provider as ComputedProviderInstance<T>)[$computedProvider].compute(reader);
      } else {
        newValue = provider(reader); // Generic provider function
      }

      if (!Object.is(state.value, newValue)) {
        state.value = newValue;
      }
      state.dependencies = dependencies;
      state.isStale = false;
      state.isComputing = false;
      return state.value;
    } catch (error) {
      state.isComputing = false;
      console.error(
        `Error computing provider '${this._getProviderName(provider)}' (ID: ${state.internalId}):`,
        error
      );
      throw error;
    }
  }

  /** Helper for tracking dependencies during read/watch. @private */
  private _trackDependency<P>(
    dependencyProvider: Provider<P>,
    dependentProvider: Provider<unknown>, // Changed any to unknown
    currentDependenciesSet: Set<Provider<unknown>> // Changed any to unknown
  ): P {
    currentDependenciesSet.add(dependencyProvider);
    const value = this.read(dependencyProvider); // Delegate read
    const dependencyState = this.providerStates.get(dependencyProvider);
    if (dependencyState && !dependencyState.isDisposed) {
      dependencyState.dependents.add(dependentProvider);
    }
    return value;
  }

  /** Executes the async operation for an AsyncProvider. @private */
  private _executeAsyncProvider<T>(
    provider: AsyncProviderInstance<T>,
    state: AsyncProviderInternalState<T>
  ): void {
    // Only check for disposed state here. We handle isExecuting below.
    if (state.isDisposed) {
      return;
    }

    // If already executing, abort the previous operation and create a new controller
    if (state.asyncProviderState.isExecuting) {
      state.asyncProviderState.abortController?.abort();
      // Create a new AbortController for the new execution
      state.asyncProviderState.abortController = new AbortController();
    }

    state.asyncProviderState.isExecuting = true;
    // Use the stored last successful data for the loading state's previousData
    state.asyncProviderState.value = {
      state: 'loading',
      previousData: state.asyncProviderState.lastSuccessfulData,
    };
    state.notifyListeners(); // Notify about loading state

    const reader: ScopeReader = {
      read: <P>(depProvider: Provider<P>): P =>
        this._trackDependency(depProvider, provider, state.dependencies),
      watch: <P>(depProvider: Provider<P>): P =>
        this._trackDependency(depProvider, provider, state.dependencies),
      onDispose: (callback: Dispose): void => {
        if (state.isDisposed) return;
        state.disposeCallbacks.add(callback);
      },
      signal: state.asyncProviderState.abortController!.signal,
    };

    const promise = (provider as AsyncProviderInstance<T>)[$asyncProvider].create(reader);
    state.asyncProviderState.currentExecution = promise
      .then((data: T) => {
        if (state.isDisposed || state.asyncProviderState.abortController?.signal.aborted) return;
        // Store successful data
        state.asyncProviderState.lastSuccessfulData = data;
        state.asyncProviderState.value = { state: 'data', data };
        state.asyncProviderState.isExecuting = false;
        state.asyncProviderState.currentExecution = undefined;
        state.notifyListeners();
        this.markDependentsStale(provider, new Set());
      })
      .catch((error: unknown) => {
        if (state.isDisposed || state.asyncProviderState.abortController?.signal.aborted) return;
        console.error(
          `Error executing asyncProvider '${this._getProviderName(provider)}' (ID: ${state.internalId}):`,
          error
        );
        // Check the option and use lastSuccessfulData if available and option is true
        const keepPreviousData =
          provider[$asyncProvider]?.options?.keepPreviousDataOnError ?? false;
        const previousDataOnError = keepPreviousData
          ? state.asyncProviderState.lastSuccessfulData
          : undefined;

        state.asyncProviderState.value = {
          state: 'error',
          error,
          previousData: previousDataOnError, // Use potentially stored data
        };
        state.asyncProviderState.isExecuting = false;
        state.asyncProviderState.currentExecution = undefined;
        state.notifyListeners();
        this.markDependentsStale(provider, new Set());
      });
  }

  /** Retrieves the updater function for a StateProviderInstance. */
  public updater<T>(provider: StateProviderInstance<T>): StateUpdater<T> {
    this.checkDisposed();

    // --- Check for overrides ---
    let targetProvider = provider;
    const override = this.overridesMap.get(provider);
    if (override !== undefined) {
      // Check if the override itself is a StateProviderInstance
      if (isStateProviderInstance(override)) {
        targetProvider = override as StateProviderInstance<T>; // Use overriding provider
      } else {
        // If not a provider, it's an invalid override for getting an updater
        throw new Error(
          `Provider '${this._getProviderName(provider)}' overridden with a non-StateProvider value, cannot get updater.`
        );
      }
    }
    // --- End Override Check ---

    this.read(targetProvider); // Ensure initialized
    const state = this.providerStates.get(targetProvider);

    if (!isStateProviderInternalState<T>(state)) {
      throw new Error(
        `Target provider '${this._getProviderName(targetProvider)}' is not a StateProvider or state is inconsistent`
      );
    }
    if (state.isDisposed) {
      throw new Error(
        `Cannot get updater for disposed provider '${this._getProviderName(targetProvider)}' (ID: ${state.internalId})`
      );
    }

    // Return function matching StateUpdater<T> signature
    return (
      scope: Scope,
      _providerInstance: StateProviderInstance<T>, // Mark providerInstance as unused
      newValueOrFn: T | ((prev: T) => T)
    ) => {
      try {
        scope.checkDisposed();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_e) {
        // Mark e as unused
        return;
      }

      // Use targetProvider (captured via closure) to get state from the passed scope
      const currentState = scope.providerStates.get(targetProvider) as
        | StateProviderInternalState<T>
        | undefined;

      if (!currentState || !isStateProviderInternalState(currentState) || currentState.isDisposed) {
        // isStateProviderInternalState already checks type
        const attemptedId = currentState ? currentState.internalId : 'unknown';
        console.warn(
          `Attempted to update StateProvider '${this._getProviderName(targetProvider)}' (ID: ${attemptedId}) but its state was not found or was disposed.`
        );
        return;
      }

      const stateProviderState = currentState.stateProviderState;
      const previousValue = stateProviderState.value;
      const newValue =
        typeof newValueOrFn === 'function'
          ? (newValueOrFn as (prev: T) => T)(previousValue)
          : newValueOrFn;

      if (!Object.is(previousValue, newValue)) {
        stateProviderState.value = newValue;
        currentState.notifyListeners();
        // Mark dependents of the *target* provider as stale
        scope.markDependentsStale(targetProvider, new Set());
      }
    };
  }

  /** Recursively marks dependents as stale and notifies listeners. @private */
  private markDependentsStale(provider: Provider<unknown>, visited: Set<Provider<unknown>>): void {
    // Changed any to unknown
    const providerState = this.providerStates.get(provider);
    if (visited.has(provider) || !providerState || providerState.isDisposed) {
      return;
    }
    visited.add(provider);

    providerState.dependents.forEach((dependentProvider) => {
      const dependentState = this.providerStates.get(dependentProvider);
      if (dependentState && !dependentState.isDisposed) {
        const wasAlreadyStale = dependentState.isStale;
        if (!wasAlreadyStale) {
          dependentState.isStale = true;
        }
        // Trigger re-execution for async, notify others
        if (isAsyncProviderInternalState(dependentState)) {
          this._executeAsyncProvider(
            dependentProvider as AsyncProviderInstance<unknown>, // Changed any to unknown
            dependentState
          );
        } else if (isStreamProviderInternalState(dependentState)) {
          // Do nothing here; re-subscription happens on read if stale
        } else {
          dependentState.notifyListeners();
        }
        this.markDependentsStale(dependentProvider, visited); // Recurse
      }
    });
  }

  /** Subscribes a listener to a provider's state changes. */
  public watch<T>(provider: Provider<T>, callback: () => void): Dispose {
    this.checkDisposed();
    this.read(provider); // Ensure initialized
    const state = this.providerStates.get(provider);

    if (!state || state.isDisposed) {
      console.warn(
        `Attempted to watch provider '${this._getProviderName(provider)}' (ID: ${state?.internalId ?? 'N/A'}) but its state was not found or was disposed.`
      );
      return () => {};
    }

    state.listeners.add(callback); // Add to base listeners

    return () => {
      const currentState = this.providerStates.get(provider);
      if (!currentState || currentState.isDisposed) return;

      currentState.listeners.delete(callback);
      if (currentState.listeners.size === 0 && !currentState.isDisposed) {
        currentState.dispose(); // Auto-dispose
      }
    };
  }

  /** Disposes of the scope and all provider states within it. */
  public dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._isDisposed = true;

    const statesToDispose = Array.from(this.providerStates.values());
    statesToDispose.forEach((state) => {
      if (!state.isDisposed) {
        state.dispose();
      }
    });

    this.providerStates.clear();
    this.parent = null;
  }
}

/** Factory function to create a new Scope. */
export function createScope(
  parent: Scope | null = null,
  overrides: ReadonlyArray<ProviderOverride> = []
): Scope {
  return new Scope(parent, overrides);
}
