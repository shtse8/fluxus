import { describe, it, expect, vi } from 'vitest';
import { defineComponent, h, nextTick, ref, type Ref } from 'vue';
import { mount } from '@vue/test-utils';
import { Subject } from 'rxjs';
import {
  createScope,
  stateProvider,
  computedProvider,
  streamProvider, // Added import
  asyncProvider, // Added import
  type ScopeReader, // Added import
  type Scope,
  type StateUpdater,
  type AsyncValue, // Added import
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


  it('useProviderUpdater should update state reactively via useProvider', async () => {
    const initialValue = 10;
    // Override the provider for a clean initial state in this test
    const scope = createScope(null, [
      { provider: counterProvider, useValue: stateProvider(() => initialValue) },
    ]);

    // Test component combining display and update logic
    const CounterCombined = defineComponent({
      setup() {
        const count = useProvider(counterProvider);
        const updateCounter = useProviderUpdater(counterProvider);
        return { count, updateCounter };
      },
      render() {
        return h('div', [
          h('span', { 'data-testid': 'count-val' }, this.count),
          // Button to trigger functional update
          h('button', { onClick: () => this.updateCounter((c: number) => c + 5) }, 'Update'),
          // Button to trigger direct set update
          h('button', { onClick: () => this.updateCounter(100) }, 'Set'),
        ]);
      },
    });

    const wrapper = mount(CounterCombined, {
      global: {
        provide: {
          [scopeSymbol]: scope, // Provide the scope to the component tree
        },
      },
    });

    // 1. Initial state check
    expect(wrapper.find('[data-testid="count-val"]').text()).toBe(String(initialValue));

    // 2. Trigger update via button click (functional update)
    await wrapper.findAll('button')[0]?.trigger('click');
    await nextTick(); // Wait for Vue's reactivity

    // Verify updated state via useProvider's ref
    expect(wrapper.find('[data-testid="count-val"]').text()).toBe(String(initialValue + 5));

    // 3. Trigger update via button click (direct set)
    await wrapper.findAll('button')[1]?.trigger('click');
    await nextTick(); // Wait for Vue's reactivity

    // Verify updated state via useProvider's ref
    expect(wrapper.find('[data-testid="count-val"]').text()).toBe('100');

    // Clean up
    wrapper.unmount();
    scope.dispose();
  });

  it('should clean up scope listener on component unmount', async () => {
    // Override the provider to ensure a clean initial state of 0
    const scope = createScope(null, [
      { provider: counterProvider, useValue: stateProvider(() => 0) },
    ]);

    // Get the internal state for checking listeners (requires access/type assertion)
    const providerState = (scope as any)._providerStates.get(counterProvider);
    expect(providerState).toBeDefined();
    expect(providerState.listeners.size).toBe(0); // Initial listener count

    const TestComponent = defineComponent({
      setup() {
        const count = useProvider(counterProvider);
        return () => h('div', count.value);
      },
    });

    const wrapper = mount(TestComponent, {
      global: {
        provide: {
          [scopeSymbol]: scope,
        },
      },
    });

    // After mount, a listener should be added
    expect(providerState.listeners.size).toBe(1);

    wrapper.unmount(); // Unmount to trigger cleanup
    scope.dispose();

    // After unmount, the listener should be removed
    expect(providerState.listeners.size).toBe(0);
  });
  it('useProvider should handle asyncProvider states (loading, data, error)', async () => {
    // Controllable promise for testing
    let resolvePromise: (value: string) => void;
    let rejectPromise: (reason?: any) => void;
    const promise = new Promise<string>((resolve, reject) => {
      resolvePromise = resolve;
      resolvePromise = resolve;
      rejectPromise = reject;
    });

    // State provider to control the promise/trigger re-fetch
    const promiseController = stateProvider<Promise<string>>(() => promise);

    // The actual asyncProvider that reads the controller
    const testAsyncProvider = asyncProvider(async (reader: ScopeReader) => { // Typed reader
      const currentPromise = reader.read(promiseController);
      return await currentPromise;
    });

    const scope = createScope();

    const TestComponent = defineComponent({
      setup() {
        const asyncData = useProvider<AsyncValue<string>>(testAsyncProvider); // Explicitly type the hook call
        // Get updater for the controller provider
        const updatePromise = useProviderUpdater(promiseController);
        return { asyncData, updatePromise };
      },
      render() {
        const data = this.asyncData; // Access the automatically unwrapped Ref value
        let content = 'Loading...';
        if (data?.state === 'data') {
          content = `Data: ${data.data}`;
        } else if (data?.state === 'error') {
          content = `Error: ${data.error}`;
        }
        // Add button to trigger error state
        const triggerErrorButton = h(
          'button',
          {
            onClick: () =>
              this.updatePromise(
                new Promise<string>((_resolve, reject) => reject('Failure!')),
              ),
          },
          'Trigger Error',
        );
        return h('div', [
          h('span', { 'data-testid': 'async-value' }, content),
          triggerErrorButton,
        ]);
      },
    });

    const wrapper = mount(TestComponent, {
      global: {
        provide: {
          [scopeSymbol]: scope,
        },
      },
    });

    // 1. Initial state should be loading
    expect(wrapper.find('[data-testid="async-value"]').text()).toBe('Loading...');
    // Need a tick for the async provider execution to start
    await nextTick();
    expect(wrapper.find('[data-testid="async-value"]').text()).toBe('Loading...');

    // 2. Resolve the promise
    resolvePromise!('Success!');
    await nextTick(); // Allow promise microtask to run
    await nextTick(); // Allow Vue reactivity to update

    // State should be data
    expect(wrapper.find('[data-testid="async-value"]').text()).toBe('Data: Success!');

    // 3. Trigger a re-fetch that results in an error by clicking the new button
    await wrapper.find('button').trigger('click'); // Click the 'Trigger Error' button
    // Wait for the promise controller state update
    await nextTick();
    await nextTick(); // Allow promise microtask (rejection)
    await nextTick(); // Allow Vue reactivity

    // State should be error
    expect(wrapper.find('[data-testid="async-value"]').text()).toBe('Error: Failure!');

    // Clean up
    wrapper.unmount();
    scope.dispose();
  });

  it('useProvider should handle streamProvider values and errors', async () => {
    const streamController = new Subject<string>();
    const testStreamProvider = streamProvider<string>((_reader: ScopeReader) => {
      return streamController.asObservable();
    });

    const scope = createScope();

    const TestComponent = defineComponent({
      setup() {
        // Explicitly type the Ref to help TS
        const streamData: Ref<AsyncValue<string>> = useProvider(testStreamProvider);
        return { streamData };
      },
      render() {
        const data = this.streamData; // Access unwrapped Ref
        let content = 'Waiting...'; // Initial state before first emission
        if (data?.state === 'data') {
          content = `Data: ${data.data}`;
        } else if (data?.state === 'error') {
          content = `Error: ${data.error}`;
        }
        // Note: streamProvider might not have an explicit 'loading' state like asyncProvider
        // It depends on the core implementation. We assume 'waiting' until first data/error.
        return h('div', { 'data-testid': 'stream-value' }, content);
      },
    });

    const wrapper = mount(TestComponent, {
      global: {
        provide: {
          [scopeSymbol]: scope,
        },
      },
    });

    // 1. Initial state should be 'waiting' (or loading, depending on core impl.)
    expect(wrapper.find('[data-testid="stream-value"]').text()).toBe('Waiting...');
    await nextTick(); // Allow watcher setup

    // 2. Emit first value
    streamController.next('First');
    await nextTick(); // Allow watcher to react
    await nextTick(); // Allow Vue reactivity
    expect(wrapper.find('[data-testid="stream-value"]').text()).toBe('Data: First');

    // 3. Emit second value
    streamController.next('Second');
    await nextTick();
    await nextTick();
    expect(wrapper.find('[data-testid="stream-value"]').text()).toBe('Data: Second');

    // 4. Emit error
    streamController.error('Stream Failure!');
    await nextTick();
    await nextTick();
    expect(wrapper.find('[data-testid="stream-value"]').text()).toBe('Error: Stream Failure!');

    // Clean up
    wrapper.unmount();
    scope.dispose();
  });





  // TODO: Add test for useProviderUpdater standalone (Covered by 'useProviderUpdater should update state reactively via useProvider')
  // TODO: Add test for scope disposal cleanup (Covered by 'should clean up scope listener on component unmount')
  // TODO: Add tests for async/stream providers if applicable to hooks (Covered by added tests)
}); // Close describe block
