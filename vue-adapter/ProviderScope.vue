<script setup lang="ts">
import { provide, onUnmounted, defineProps, type PropType } from 'vue';
import { createScope, type Scope, type ProviderOverride } from '../src/index.js';
import { scopeSymbol } from './context.js';

const props = defineProps({
  /**
   * Optional array of provider overrides for this scope.
   */
  overrides: {
    type: Array as PropType<ReadonlyArray<ProviderOverride>>,
    required: false,
    default: () => [],
  },
  /**
   * Optional parent scope. Currently unused but reserved for potential future features.
   * If needed, logic to inject/use parent scope would go here.
   */
  // parentScope: {
  //   type: Object as PropType<Scope | null>,
  //   required: false,
  //   default: null,
  // },
});

// Create a new Fluxus scope instance for this component instance
// Pass overrides from props. Parent scope is currently ignored.
const scope = createScope(null, props.overrides);

// Provide the scope instance to descendant components
provide(scopeSymbol, scope);

// Ensure the scope is disposed when the component is unmounted
onUnmounted(() => {
  if (!scope.isDisposed) {
    scope.dispose();
  }
});
</script>

<template>
  <!-- Render the default slot, making the provided scope available to children -->
  <slot />
</template>