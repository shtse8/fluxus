import {
  createScope
} from "./chunk-ZNT4WOV3.js";

// react-adapter/ProviderScope.tsx
import * as React2 from "react";

// react-adapter/context.ts
import * as React from "react";
var ScopeContext = React.createContext(null);
function useScope() {
  const scope = React.useContext(ScopeContext);
  if (!scope) {
    throw new Error("useScope must be used within a ProviderScope");
  }
  return scope;
}

// react-adapter/ProviderScope.tsx
import { jsx } from "react/jsx-runtime";
function ProviderScope({ children }) {
  const parentScope = React2.useContext(ScopeContext);
  const scopeRef = React2.useRef(null);
  if (scopeRef.current === null) {
    scopeRef.current = createScope(parentScope);
  }
  const scope = scopeRef.current;
  React2.useEffect(() => {
    const scopeToDispose = scopeRef.current;
    return () => {
      if (scopeToDispose && !scopeToDispose.isDisposed) {
        scopeToDispose.dispose();
      }
    };
  }, []);
  return /* @__PURE__ */ jsx(ScopeContext.Provider, { value: scope, children });
}

// react-adapter/hooks.ts
import * as React3 from "react";
function useProvider(provider) {
  const scope = useScope();
  const lastValueRef = React3.useRef(void 0);
  const subscribe = React3.useCallback((onStoreChange) => {
    try {
      return scope.watch(provider, () => {
        onStoreChange();
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("disposed")) {
        return () => {
        };
      }
      throw error;
    }
  }, [scope, provider]);
  const getSnapshot = React3.useCallback(() => {
    try {
      const currentValue = scope.read(provider);
      lastValueRef.current = currentValue;
      return currentValue;
    } catch (error) {
      if (error.message === "Scope has been disposed") {
        if (lastValueRef.current !== void 0) {
          return lastValueRef.current;
        } else {
          throw error;
        }
      }
      throw error;
    }
  }, [scope, provider]);
  if (lastValueRef.current === void 0) {
    try {
      lastValueRef.current = scope.read(provider);
    } catch {
    }
  }
  return React3.useSyncExternalStore(
    subscribe,
    getSnapshot
    // getServerSnapshot // Uncomment if supporting SSR
  );
}
function useProviderUpdater(provider) {
  const scope = useScope();
  const internalUpdater = scope.updater(provider);
  const stableUpdater = React3.useCallback((newValueOrFn) => {
    internalUpdater(scope, provider, newValueOrFn);
  }, [scope, provider, internalUpdater]);
  return stableUpdater;
}
export {
  ProviderScope,
  useProvider,
  useProviderUpdater,
  useScope
};
//# sourceMappingURL=react-adapter.js.map