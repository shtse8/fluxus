import { describe, it, expect, vi } from 'vitest';
import { defineComponent, h, nextTick, ref, type Ref } from 'vue';
import { mount } from '@vue/test-utils';
import {
  createScope,
  stateProvider,
  computedProvider,
  type Scope,
  type StateUpdater,
} from '../src/index.js';
import { ProviderScope, scopeSymbol } from './index.js'; // Import ProviderScope and scopeSymbol
import { useProvider, useProviderUpdater } from './hooks.js';

// --- Test Setup ---

// Simple state provider
const counterProvider = stateProvider((_reader, initialValue = 0) => initialValue);

// Computed provider based on counter
const doubledProvider = computedProvider((reader) => {
  const count = reader.read(counterProvider);
  return count * 2;
});

// Test component using useProvider
const CounterDisplay = defineComponent({
  props: {
    provider: {
      type: Object as () => typeof counterProvider, // Adjust type as needed
      required: true,
    },
  },
  setup(props) {
    const count = useProvider(props.provider);
    return () => h('div', `Count: ${count.value}`);
  },
});

// Test component using useProviderUpdater
const CounterUpdater = defineComponent({
  props: {
    provider: {
      type: Object as () => typeof counterProvider, // Adjust type as needed
      required: true,
    },
  },
  setup(props) {
    const updateCounter = useProviderUpdater(props.provider);
    return { updateCounter }; // Expose for testing
  },
  render() {
    // Renderless component or minimal render
    return h('div');
  },
});

// --- Tests ---

describe('Vue Adapter Hooks', () => {
  it('useProvider should return initial value and update reactively', async () => {
    const initialValue = 5;
    const scope = createScope(null, [
      { provider: counterProvider, useValue: stateProvider(() => initialValue) }, // Override with initial value
    ]);

    const TestComponent = defineComponent({
      setup() {
        const count = useProvider(counterProvider);
        const doubled = useProvider(doubledProvider);
        const update = useProviderUpdater(counterProvider);
        return { count, doubled, update };
      },
      render() {
        return h('div', [
          h('span', { 'data-testid': 'count' }, this.count),
          h('span', { 'data-testid': 'doubled' }, this.doubled),
          h('button', { onClick: () => this.update((c) => c + 1) }, 'Increment'),
        ]);
      },
    });

    const wrapper = mount(TestComponent, {
      global: {
        components: { ProviderScope }, // Register ProviderScope globally for this test
        provide: {
          // Manually provide the scope using the correct InjectionKey (scopeSymbol)
          [scopeSymbol]: scope,
        },
      },
      // Wrap with ProviderScope - although we provide manually above,
      // this ensures the component structure is closer to reality
      // No need to wrap with ProviderScope component here,
      // as we are manually providing the scope via `global.provide`.
    });

    // Check initial values
    expect(wrapper.find('[data-testid="count"]').text()).toBe(String(initialValue));
    expect(wrapper.find('[data-testid="doubled"]').text()).toBe(String(initialValue * 2));

    // Trigger update using the updater from the component's setup context
    await wrapper.find('button').trigger('click');
    await nextTick(); // Wait for Vue reactivity (counter update)
    await nextTick(); // Wait for potential computed update propagation

    // Check updated values
    expect(wrapper.find('[data-testid="count"]').text()).toBe(String(initialValue + 1));
    expect(wrapper.find('[data-testid="doubled"]').text()).toBe(String((initialValue + 1) * 2));

    // Clean up
    wrapper.unmount();
    scope.dispose();
  });

  // TODO: Add test for useProviderUpdater standalone
  // TODO: Add test for scope disposal cleanup
  // TODO: Add tests for async/stream providers if applicable to hooks
});