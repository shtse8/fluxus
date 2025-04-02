// src/providers/stateProvider.ts
var $stateProvider = Symbol.for("fluxus.stateProvider");
function isStateProviderInstance(provider) {
  return typeof provider === "function" && !!provider[$stateProvider];
}
function stateProvider(initialValue) {
  const initializeState = (reader, internalId) => {
    let currentValue = typeof initialValue === "function" ? initialValue(reader) : initialValue;
    const state = {
      value: currentValue,
      listeners: /* @__PURE__ */ new Set()
      // Updater is no longer defined here
    };
    return state;
  };
  const providerFn = () => {
    throw new Error(
      "StateProvider function should not be called directly. Use scope.read(provider)."
    );
  };
  providerFn[$stateProvider] = { initializeState };
  providerFn._fluxus_provider_type = "StateProvider";
  return providerFn;
}

// src/providers/computedProvider.ts
var $computedProvider = Symbol.for("fluxus.computedProvider");
function isComputedProviderInstance(provider) {
  return typeof provider === "function" && !!provider[$computedProvider];
}
function computedProvider(compute) {
  const providerFn = () => {
    throw new Error(
      "ComputedProvider function should not be called directly. Use scope.read(provider)."
    );
  };
  providerFn[$computedProvider] = { compute };
  providerFn._fluxus_provider_type = "ComputedProvider";
  return providerFn;
}

// src/scope.ts
var internalStateIdCounter = 0;
function isStateProviderInternalState(state) {
  return state?.type === "state";
}
var Scope = class {
  /**
   * Creates a new Scope instance.
   * @param {Scope | null} [parent=null] - An optional parent scope. If provided,
   *        this scope can potentially inherit or override providers from the parent
   *        (behavior depends on specific provider implementations and future features).
   */
  constructor(parent = null) {
    /** Stores the state associated with each provider within this scope. */
    this.providerStates = /* @__PURE__ */ new Map();
    /** Flag indicating if the scope itself has been disposed. */
    this._isDisposed = false;
    this.parent = parent;
  }
  // Renamed internal flag
  /**
   * Indicates whether the scope has been disposed. Once disposed, a scope
   * cannot be used to read or initialize providers.
   * @returns {boolean} True if the scope is disposed, false otherwise.
   */
  get isDisposed() {
    return this._isDisposed;
  }
  /** Checks if the scope or its ancestors have been disposed. */
  checkDisposed() {
    if (this._isDisposed) {
      throw new Error("Scope has been disposed");
    }
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
  read(provider) {
    this.checkDisposed();
    let state = this.providerStates.get(provider);
    if (state) {
      if (state.isComputing) {
        throw new Error("Circular dependency detected");
      }
      if (state.isDisposed) {
        throw new Error("Cannot read provider: its state has been disposed");
      }
      if (state.isStale) {
        if (isStateProviderInternalState(state)) {
          return state.stateProviderState.value;
        } else {
          return this._computeAndCacheValue(provider, state);
        }
      } else {
        if (isStateProviderInternalState(state)) {
          return state.stateProviderState.value;
        } else {
          return state.value;
        }
      }
    } else {
      const newState = this._createProviderStateStructure(provider);
      if (isStateProviderInternalState(newState)) {
        return newState.stateProviderState.value;
      } else {
        return this._computeAndCacheValue(provider, newState);
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
  _createProviderStateStructure(provider) {
    const dependencies = /* @__PURE__ */ new Set();
    const dependents = /* @__PURE__ */ new Set();
    const disposeCallbacks = /* @__PURE__ */ new Set();
    const internalId = internalStateIdCounter++;
    const placeholderState = {
      internalId,
      type: "generic",
      // Placeholder type
      value: void 0,
      isComputing: true,
      isDisposed: false,
      isStale: false,
      dependencies,
      dependents,
      disposeCallbacks,
      dispose: () => {
      }
    };
    this.providerStates.set(provider, placeholderState);
    const baseDisposeLogic = (stateRef, providerKey) => {
      if (stateRef.isDisposed) return;
      this.markDependentsStale(providerKey, /* @__PURE__ */ new Set());
      stateRef.isDisposed = true;
      if (isStateProviderInternalState(stateRef)) {
        stateRef.stateProviderState.listeners.clear();
      }
      stateRef.disposeCallbacks.forEach((cb) => {
        try {
          cb();
        } catch (e) {
          console.error("Error during dispose callback:", e);
        }
      });
      stateRef.disposeCallbacks.clear();
      stateRef.dependencies.forEach((depProvider) => {
        const depState = this.providerStates.get(depProvider);
        if (depState && "dependents" in depState) {
          depState.dependents.delete(providerKey);
        }
      });
      stateRef.dependencies.clear();
      stateRef.dependents.clear();
    };
    let internalState;
    if (isStateProviderInstance(provider)) {
      const initReader = {
        read: (dep) => this.read(dep),
        watch: (dep) => this.read(dep),
        // Watch behaves like read during init
        onDispose: (cb) => disposeCallbacks.add(cb)
      };
      const stateProviderState = provider[$stateProvider].initializeState(initReader, internalId);
      internalState = {
        internalId,
        type: "state",
        stateProviderState,
        disposeCallbacks,
        dependencies,
        // Use the set populated by initReader
        dependents,
        isComputing: false,
        isDisposed: false,
        isStale: false,
        // Initial value is never stale
        dispose: () => baseDisposeLogic(internalState, provider)
      };
    } else {
      internalState = {
        internalId,
        type: "generic",
        value: void 0,
        // Value starts undefined
        disposeCallbacks,
        dependencies,
        // Will be populated by _computeAndCacheValue
        dependents,
        isComputing: false,
        isDisposed: false,
        isStale: true,
        // Mark as stale initially
        dispose: () => baseDisposeLogic(internalState, provider)
      };
    }
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
  _computeAndCacheValue(provider, state) {
    const dependencies = /* @__PURE__ */ new Set();
    state.dependencies.forEach((oldDepProvider) => {
      const oldDepState = this.providerStates.get(oldDepProvider);
      if (oldDepState && "dependents" in oldDepState) {
        oldDepState.dependents.delete(provider);
      }
    });
    state.dependencies.clear();
    const reader = {
      read: (depProvider) => {
        dependencies.add(depProvider);
        const value = this.read(depProvider);
        const depState = this.providerStates.get(depProvider);
        if (depState && "dependents" in depState) {
          depState.dependents.add(provider);
        }
        return value;
      },
      watch: (depProvider) => {
        dependencies.add(depProvider);
        const value = this.read(depProvider);
        const depState = this.providerStates.get(depProvider);
        if (depState && "dependents" in depState) {
          depState.dependents.add(provider);
        }
        return value;
      },
      onDispose: (callback) => {
        if (state.isDisposed) return;
        state.disposeCallbacks.add(callback);
      }
    };
    state.isComputing = true;
    let newValue;
    try {
      if (isComputedProviderInstance(provider)) {
        newValue = provider[$computedProvider].compute(reader);
      } else {
        newValue = provider(reader);
      }
      state.value = newValue;
      state.dependencies = dependencies;
      state.isStale = false;
      state.isComputing = false;
      return newValue;
    } catch (error) {
      state.isComputing = false;
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
  updater(provider) {
    this.checkDisposed();
    this.read(provider);
    const state = this.providerStates.get(provider);
    if (!isStateProviderInternalState(state)) {
      throw new Error("Provider is not a StateProvider or state is inconsistent");
    }
    if (state.isDisposed) {
      throw new Error("Cannot get updater for a disposed provider state");
    }
    return (scopeInstance, providerInstance, newValueOrFn) => {
      try {
        scopeInstance.checkDisposed();
      } catch (e) {
        return;
      }
      const currentState = scopeInstance.providerStates.get(providerInstance);
      if (!currentState || !isStateProviderInternalState(currentState) || currentState.isDisposed) {
        const attemptedId = currentState ? currentState.internalId : "unknown";
        return;
      }
      const stateProviderState = currentState.stateProviderState;
      const previousValue = stateProviderState.value;
      const newValue = typeof newValueOrFn === "function" ? newValueOrFn(previousValue) : newValueOrFn;
      if (!Object.is(previousValue, newValue)) {
        stateProviderState.value = newValue;
        const listenersToNotify = Array.from(stateProviderState.listeners);
        listenersToNotify.forEach((listener) => listener());
        scopeInstance.markDependentsStale(providerInstance, /* @__PURE__ */ new Set());
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
  markDependentsStale(provider, visited) {
    const providerState = this.providerStates.get(provider);
    if (visited.has(provider)) {
      return;
    }
    visited.add(provider);
    const state = this.providerStates.get(provider);
    if (!state || state.isDisposed) return;
    state.dependents.forEach((dependentProvider) => {
      const dependentState = this.providerStates.get(dependentProvider);
      if (dependentState && !dependentState.isDisposed) {
        const wasAlreadyStale = dependentState.isStale;
        if (!wasAlreadyStale) {
          dependentState.isStale = true;
        }
        if (isStateProviderInternalState(dependentState)) {
          const listeners = dependentState.stateProviderState.listeners;
          if (listeners.size > 0) {
            Array.from(listeners).forEach((listener) => listener());
          }
        }
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
  watch(provider, callback) {
    this.checkDisposed();
    this.read(provider);
    const state = this.providerStates.get(provider);
    if (!state || state.isDisposed) {
      return () => {
      };
    }
    if (isStateProviderInternalState(state)) {
      const listeners = state.stateProviderState.listeners;
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
        if (listeners.size === 0) {
          if (state && !state.isDisposed) {
            state.dispose();
          }
        }
      };
    } else {
      return () => {
      };
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
  dispose() {
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
};
function createScope(parent = null) {
  return new Scope(parent);
}

export {
  isStateProviderInstance,
  stateProvider,
  isComputedProviderInstance,
  computedProvider,
  Scope,
  createScope
};
//# sourceMappingURL=chunk-ZNT4WOV3.js.map