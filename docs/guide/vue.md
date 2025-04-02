# Using Fluxus with Vue

Fluxus provides a dedicated adapter to seamlessly integrate its state management
capabilities into your Vue 3 applications using the Composition API.

## Setup

First, ensure you have installed both the core Fluxus library and the Vue
adapter:

```bash
npm install @shtse8/fluxus @shtse8/fluxus/vue-adapter
# or
yarn add @shtse8/fluxus @shtse8/fluxus/vue-adapter
# or
pnpm add @shtse8/fluxus @shtse8/fluxus/vue-adapter
```

Make sure you also have `vue` installed, as it's a peer dependency.

## `ProviderScope` Component

Similar to the React adapter, you need to wrap your application or the relevant
part of your component tree with the `ProviderScope` component. This component
creates a new Fluxus scope, making providers available to components within it.

```vue
<script setup lang="ts">
import { ProviderScope } from '@shtse8/fluxus/vue-adapter';
import MyComponent from './MyComponent.vue';
// Import any provider overrides if needed
// import { myProviderOverride } from './providers';
</script>

<template>
  <ProviderScope> <!-- Optionally pass overrides: :overrides="[myProviderOverride]" -->
    <MyComponent />
    <!-- Other components -->
  </ProviderScope>
</template>
```

## `useProvider` Composable

The `useProvider` composable is the primary way to access and subscribe to
provider values within your Vue components. It returns a `Ref` that
automatically updates when the provider's state changes.

```vue
<script setup lang="ts">
import { useProvider } from '@shtse8/fluxus/vue-adapter';
import { counterProvider } from './providers'; // Assuming counterProvider is a stateProvider

// Access the counter value. The `count` ref will update automatically.
const count = useProvider(counterProvider);
</script>

<template>
  <div>
    Count: {{ count }}
  </div>
</template>
```

`useProvider` works with all provider types (`stateProvider`,
`computedProvider`, `asyncProvider`, `streamProvider`). For `asyncProvider` and
`streamProvider`, the `Ref` will hold an `AsyncValue` object
(`{ state: 'loading' | 'data' | 'error', data?: T, error?: unknown }`).

## `useProviderUpdater` Composable

For `stateProvider`s, you often need a way to update their value. The
`useProviderUpdater` composable provides access to the updater function defined
by the `stateProvider`.

```vue
<script setup lang="ts">
import { useProvider, useProviderUpdater } from '@shtse8/fluxus/vue-adapter';
import { counterProvider } from './providers'; // Assuming counterProvider is stateProvider<number>

const count = useProvider(counterProvider);
const updateCounter = useProviderUpdater(counterProvider);

function increment() {
  // The updater function receives the current value and returns the new value
  updateCounter(currentValue => currentValue + 1);
}

function reset() {
  // Or you can set the value directly
  updateCounter(0);
}
</script>

<template>
  <div>
    Count: {{ count }}
    <button @click="increment">Increment</button>
    <button @click="reset">Reset</button>
  </div>
</template>
```

## Provider Overrides

Provider overrides work the same way as in the core library and React adapter.
You can pass an array of `ProviderOverride` objects to the `overrides` prop of
the `ProviderScope` component, which is useful for testing or specific
scenarios.

```vue
<script setup lang="ts">
import { ProviderScope } from '@shtse8/fluxus/vue-adapter';
import { counterProvider, mockedCounterProvider } from './providers';
import MyComponent from './MyComponent.vue';

const overrides = [
  {
    provider: counterProvider,
    useValue: mockedCounterProvider // Or useFactory/useClass depending on provider type
  }
];
</script>

<template>
  <ProviderScope :overrides="overrides">
    <MyComponent />
  </ProviderScope>
</template>
```

This adapter leverages Vue's Composition API (`provide`, `inject`, `ref`,
`onScopeDispose`) to provide a reactive and idiomatic experience for Vue
developers.
