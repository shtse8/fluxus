"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

var _chunkBQQWM6HEcjs = require('./chunk-BQQWM6HE.cjs');

// react-adapter/ProviderScope.tsx
var _react = require('react'); var React2 = _interopRequireWildcard(_react); var React = _interopRequireWildcard(_react); var React3 = _interopRequireWildcard(_react);

// react-adapter/context.ts

var ScopeContext = React.createContext(null);
function useScope() {
  const scope = React.useContext(ScopeContext);
  if (!scope) {
    throw new Error("useScope must be used within a ProviderScope");
  }
  return scope;
}

// react-adapter/ProviderScope.tsx
var _jsxruntime = require('react/jsx-runtime');
function ProviderScope({ children }) {
  const parentScope = React2.useContext(ScopeContext);
  const scopeRef = React2.useRef(null);
  if (scopeRef.current === null) {
    scopeRef.current = _chunkBQQWM6HEcjs.createScope.call(void 0, parentScope);
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
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, ScopeContext.Provider, { value: scope, children });
}

// react-adapter/hooks.ts

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
    } catch (e) {
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





exports.ProviderScope = ProviderScope; exports.useProvider = useProvider; exports.useProviderUpdater = useProviderUpdater; exports.useScope = useScope;
//# sourceMappingURL=react-adapter.cjs.map