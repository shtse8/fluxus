# Using Fluxus with Vue

Fluxus provides a dedicated adapter to seamlessly integrate its providers with
Vue 3's Composition API.

## Installation

First, ensure you have `fluxus` and `vue` installed:

```bash
npm install @shtse8/fluxus vue
# or
yarn add @shtse8/fluxus vue
# or
pnpm add @shtse8/fluxus vue
```

## Setup: `ProviderScope`

Similar to the React adapter, you need to wrap your application or the relevant
component subtree with the `ProviderScope` component. This component creates the
Fluxus `Scope` instance where provider states will live.

```vue
<!-- src/App.vue -->
<script setup lang="ts">
import { ProviderScope } from '@shtse8/fluxus/vue-adapter';
// Import your root component
import MyAppComponent from './components/MyAppComponent.vue';
</script>

<template>
  <ProviderScope>
    <MyAppComponent />
  </ProviderScope>
</template>
```

## Reading Providers: `useProvider`

The `useProvider` composable allows you to read the current value of a provider
within your component's `setup` function. It returns a Vue `Ref` that
automatically updates when the provider's state changes.

```vue
<!-- src/components/CounterDisplay.vue -->
<script setup lang="ts">
import { useProvider } from '@shtse8/fluxus/vue-adapter';
import { counterProvider } from '../providers/counter'; // Assuming you have defined this provider

const count = useProvider(counterProvider);
</script>

<template>
  <div>Count: {{ count }}</div>
</template>
```

Fluxus handles the subscription and unsubscription automatically. When the
component unmounts, the subscription created by `useProvider` is cleaned up.

## Updating State Providers: `useProviderUpdater`

For `stateProvider` instances, you can get the updater function using the
`useProviderUpdater` composable.

```vue
<!-- src/components/CounterControls.vue -->
<script setup lang="ts">
import { useProviderUpdater } from '@shtse8/fluxus/vue-adapter';
import { counterProvider } from '../providers/counter';

const updateCounter = useProviderUpdater(counterProvider);

function increment() {
  updateCounter((prevCount) => prevCount + 1);
}

function reset() {
  updateCounter(0); // Set to a specific value
}
</script>

<template>
  <button @click="increment">Increment</button>
  <button @click="reset">Reset</button>
</template>
```

## Provider Overrides

The `ProviderScope` component accepts an optional `overrides` prop, allowing you
to replace providers within its subtree, which is particularly useful for
testing or specific scenarios.

```vue
<!-- src/App.vue (Example with Override) -->
<script setup lang="ts">
import { ProviderScope } from '@shtse8/fluxus/vue-adapter';
import { stateProvider } from '@shtse8/fluxus';
import MyAppComponent from './components/MyAppComponent.vue';
import { counterProvider } from './providers/counter'; // Original provider

// Create an override for testing or specific context
const mockCounterProvider = stateProvider(() => 100);
const overrides = [
  { provider: counterProvider, useValue: mockCounterProvider }
];
</script>

<template>
  <ProviderScope :overrides="overrides">
    <!-- Components inside here will use mockCounterProvider -->
    <MyAppComponent />
  </ProviderScope>
</template>
```

Now, any component within this `ProviderScope` calling
`useProvider(counterProvider)` will receive the state from `mockCounterProvider`
instead.
