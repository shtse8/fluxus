# Advanced: Provider Overrides

Provider overrides are a powerful feature that allows you to replace the
behavior or value of a provider within a specific part of your application tree
(i.e., within a specific `Scope`). This is particularly useful for:

- **Testing:** Replacing real providers (e.g., API clients, database
  connections) with mock implementations or fixed values during tests.
- **Feature Isolation:** Providing different configurations or behaviors for a
  provider within a specific feature module without affecting the rest of the
  application.
- **Debugging:** Temporarily injecting specific values or logging behaviors into
  providers.

## How Overrides Work

Overrides are applied at the `Scope` level. When you create a `Scope` (typically
via `<ProviderScope>` in React), you can pass an array of `ProviderOverride`
objects.

```typescript
import type { ProviderOverride } from "@shtse8/fluxus";

const myOverrides: ProviderOverride[] = [
    // ... override definitions ...
];

// In React:
<ProviderScope overrides={myOverrides}>
    {/* Components inside this scope will use the overrides */}
</ProviderScope>;
```

When `scope.read(provider)` or `scope.updater(provider)` is called within that
scope:

1. The scope first checks if an override exists for the requested `provider` in
   its internal override map.
2. **If an override exists:**
   - If the override's `useValue` is a **direct value** (not a provider
     function), that value is returned immediately by `read`. Calling `updater`
     for such an override will throw an error.
   - If the override's `useValue` is **another provider function**, that
     _overriding provider_ is used for the rest of the lookup/initialization
     process within the current scope instead of the original provider.
3. **If no override exists:** The scope proceeds with its normal logic (checking
   its cache, checking parent scope if applicable, initializing the original
   provider).

**Important:** Overrides only affect the scope they are provided to and its
descendants. Parent scopes or sibling scopes are not affected.

## Defining Overrides

An override is defined using an object conforming to the `ProviderOverride`
type:

```typescript
import type { Provider, ProviderOverride } from '@shtse8/fluxus';

export type ProviderOverride = {
  /** The original provider to override. */
  provider: Provider<any>;
  /** The overriding provider or value. */
  useValue: Provider<any> | any;
};
```

**Examples:**

```typescript
import { computedProvider, stateProvider } from '@shtse8/fluxus';
import type { ProviderOverride } from '@shtse8/fluxus';

// Original providers
const configProvider = stateProvider({ apiUrl: '/api/real' });
const itemsProvider = asyncProvider(async (read) => {
  /* fetch real items */
});
const countProvider = stateProvider(10);

// Override definitions
const testOverrides: ProviderOverride[] = [
  // 1. Override configProvider with a fixed value
  {
    provider: configProvider,
    useValue: { apiUrl: '/api/mock' },
  },

  // 2. Override itemsProvider with a mock async provider returning fixed data
  {
    provider: itemsProvider,
    useValue: asyncProvider(async () => [{ id: 1, name: 'Mock Item' }]),
  },

  // 3. Override countProvider with a different state provider instance
  {
    provider: countProvider,
    useValue: stateProvider(99), // Start count at 99 in this scope
  },
];
```

## Using Overrides in React

Pass the `overrides` array to the `ProviderScope` component:

```tsx
import React from 'react';
import { ProviderScope } from '@shtse8/fluxus/react-adapter';
import { testOverrides } from './test-overrides'; // Import your overrides
import MyFeature from './MyFeature';

function TestRoot() {
  return (
    <ProviderScope overrides={testOverrides}>
      {/* Components inside MyFeature will use the overridden providers */}
      <MyFeature />
    </ProviderScope>
  );
}
```

Components rendered within this `<ProviderScope>` will now see the overridden
values or behaviors when they read `configProvider`, `itemsProvider`, or
`countProvider`.

Provider overrides offer significant flexibility for managing different
environments, testing, and complex application structures.
