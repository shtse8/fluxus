import { describe, it, expect, vi } from 'vitest'; // Ensure vi is imported

import { defineComponent, h, nextTick, ref, type Ref, inject } from 'vue';
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

    // We will check the listener count *after* unmounting
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

    // Component is mounted, useProvider should have added a listener internally.
    wrapper.unmount(); // Unmount to trigger cleanup
    // After unmount, the listener added by useProvider should be removed.
    // If this was the only listener, the provider state should be auto-disposed.
    // Attempting to get an updater for a disposed state provider should throw an error
    // because scope.updater() calls scope.read() internally first.
    expect(() => {
      scope.updater(counterProvider);
    }).toThrow(/Cannot read provider.*its state has been disposed/);

    scope.dispose(); // Final cleanup
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
    await nextTick(); // Add an extra tick for potentially deeper async propagation

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





  it('ProviderScope component should provide a scope', async () => {
    const initialValue = 99;
    // Use the default provider definition here
    const scope = createScope(null, [
      { provider: counterProvider, useValue: stateProvider(() => initialValue) },
    ]); // Create scope manually ONLY to check against the one ProviderScope creates

    // Simple component to read the value
    const ChildComponent = defineComponent({
      setup() {
        const count = useProvider(counterProvider);
        // Inject the scope provided by ProviderScope to verify it's the correct one
        const providedScope = inject(scopeSymbol);
        return { count, providedScope };
      },
      render() {
        return h('div', `Count: ${this.count}`);
      },
    });

    // Mount ProviderScope wrapping the child
    const wrapper = mount(
      defineComponent({
        // Use ProviderScope component directly
        render: () => h(ProviderScope, null, { default: () => h(ChildComponent) }),
      }),
      {
        // No need for global provide here, ProviderScope handles it
      },
    );

    await nextTick(); // Allow scope creation and provision

    // Check if the value is read correctly (implicitly checks scope provision)
    expect(wrapper.find('div').text()).toBe(`Count: 0`); // Default value is 0 if not overridden in ProviderScope

    // Optionally, verify the provided scope instance if needed, though harder to test identity directly
    // expect(wrapper.getComponent(ChildComponent).vm.providedScope).toBeInstanceOf(Object); // Basic check

    wrapper.unmount();
    // Scope created by ProviderScope should be disposed automatically on unmount
  });


  it('ProviderScope component should apply overrides', async () => {
    const overrideValue = 42;
    const overrideProvider = stateProvider(() => overrideValue);

    // Component that reads the potentially overridden provider
    const ReaderComponent = defineComponent({
      setup() {
        const count = useProvider(counterProvider);
        return { count };
      },
      render() {
        return h('div', `Count: ${this.count}`);
      },
    });

    // Mount ProviderScope with overrides prop
    const wrapper = mount(
      defineComponent({
        render: () =>
          h(
            ProviderScope,
            {
              overrides: [{ provider: counterProvider, useValue: overrideProvider }],
            },
            { default: () => h(ReaderComponent) },
          ),
      }),
    );

    await nextTick(); // Allow scope creation and provision

    // Check if the overridden value is used
    expect(wrapper.find('div').text()).toBe(`Count: ${overrideValue}`);

    wrapper.unmount();
  });

  it('useProviderUpdater should work with overrides from ProviderScope', async () => {
    const initialValue = 10;
    const overrideValue = 500;
    const overrideProvider = stateProvider(() => overrideValue);

    // Component using both reader and updater
    const CombinedComponent = defineComponent({
      setup() {
        const count = useProvider(counterProvider);
        const update = useProviderUpdater(counterProvider);
        return { count, update };
      },
      render() {
        return h('div', [
          h('span', { 'data-testid': 'val' }, this.count),
          h('button', { onClick: () => this.update((c: number) => c + 1) }, 'Inc'),
        ]);
      },
    });

    // Mount ProviderScope with overrides

  it('asyncProvider should re-fetch when dependencies change', async () => {
    vi.useFakeTimers(); // Use fake timers for this test
    const dependencyProvider = stateProvider(() => 'dep1');
    const testAsyncProvider = asyncProvider(async (reader) => {
      const depValue = reader.read(dependencyProvider);
      await new Promise(res => setTimeout(res, 10)); // Simulate async work
      return `Data based on ${depValue}`;
    });

    const scope = createScope();

    const TestComponent = defineComponent({
      setup() {
        const asyncData = useProvider<AsyncValue<string>>(testAsyncProvider);
        const updateDep = useProviderUpdater(dependencyProvider);
        return { asyncData, updateDep };
      },
      render() {
        const data = this.asyncData;
        let content = 'Loading...';
        if (data?.state === 'data') content = data.data;
        else if (data?.state === 'error') content = `Error: ${data.error}`;
        return h('div', [
          h('span', { 'data-testid': 'async-dep' }, content),
          h('button', { onClick: () => this.updateDep('dep2') }, 'Change Dep'),
        ]);
      },
    });

    const wrapper = mount(TestComponent, { global: { provide: { [scopeSymbol]: scope } } });

    // Initial load
    await nextTick(); // Start async
    await vi.advanceTimersByTimeAsync(20); // Wait for simulated async work + buffer
    await nextTick(); // Vue update
    expect(wrapper.find('[data-testid="async-dep"]').text()).toBe('Data based on dep1');

    // Change dependency
    await wrapper.find('button').trigger('click');
    await nextTick(); // Update state provider
    await nextTick(); // Trigger async re-fetch
    expect(wrapper.find('[data-testid="async-dep"]').text()).toBe('Loading...'); // Should show loading during re-fetch

    await vi.advanceTimersByTimeAsync(20); // Wait for simulated async work + buffer
    await nextTick(); // Vue update
    expect(wrapper.find('[data-testid="async-dep"]').text()).toBe('Data based on dep2');

    wrapper.unmount();
    scope.dispose();
    vi.useRealTimers(); // Restore real timers
  });

  it('streamProvider should re-subscribe when dependencies change', async () => {
    const dependencyProvider = stateProvider(() => 'stream1');
    const streamControllers: Record<string, Subject<string>> = {
      stream1: new Subject<string>(),
      stream2: new Subject<string>(),
    };

    const testStreamProvider = streamProvider<string>((reader) => { // Explicitly type the provider
      const depValue = reader.read(dependencyProvider);
      return streamControllers[depValue]!.asObservable(); // Add non-null assertion
    });

    const scope = createScope();

    const TestComponent = defineComponent({
      setup() {
        const streamData = useProvider<AsyncValue<string>>(testStreamProvider);
        const updateDep = useProviderUpdater(dependencyProvider);
        return { streamData, updateDep };
      },
      render() {
        const data = this.streamData;
        let content = 'Waiting...';
        if (data?.state === 'data') content = data.data;
        else if (data?.state === 'error') content = `Error: ${data.error}`;
        return h('div', [
          h('span', { 'data-testid': 'stream-dep' }, content),
          h('button', { onClick: () => this.updateDep('stream2') }, 'Change Dep'),
        ]);
      },
    });

    const wrapper = mount(TestComponent, { global: { provide: { [scopeSymbol]: scope } } });

    await nextTick(); // Watcher setup
    expect(wrapper.find('[data-testid="stream-dep"]').text()).toBe('Waiting...');

    // Emit on first stream
    streamControllers.stream1!.next('A'); // Add non-null assertion
    await nextTick(); await nextTick();
    expect(wrapper.find('[data-testid="stream-dep"]').text()).toBe('Data: A');

    // Change dependency
    await wrapper.find('button').trigger('click');
    await nextTick(); // Update state provider
    await nextTick(); // Trigger re-subscription
    // State might briefly reset depending on core logic, or stay on last value.
    // Let's assume it resets to waiting/loading state upon re-subscription start.
    // If core keeps last value, this expectation needs adjustment.
    expect(wrapper.find('[data-testid="stream-dep"]').text()).toBe('Waiting...'); // Or potentially 'Data: A'

    // Emit on second stream
    streamControllers.stream2!.next('B'); // Add non-null assertion
    await nextTick(); await nextTick();
    expect(wrapper.find('[data-testid="stream-dep"]').text()).toBe('Data: B');

    // Emit on first stream again (should have no effect)
    streamControllers.stream1!.next('C'); // Add non-null assertion
    await nextTick(); await nextTick();
    expect(wrapper.find('[data-testid="stream-dep"]').text()).toBe('Data: B');

    wrapper.unmount();
    scope.dispose();

  it('computedProvider should react to changes in dependent asyncProvider', async () => {
    vi.useFakeTimers();
    const triggerProvider = stateProvider(() => 1);
    const dataAsyncProvider = asyncProvider(async (reader) => {
      const trigger = reader.read(triggerProvider);
      await new Promise(res => setTimeout(res, 10)); // Simulate async work
      return `Data ${trigger}`;
    });
    const processedDataProvider = computedProvider((reader) => {
      const asyncVal = reader.read(dataAsyncProvider);
      if (asyncVal.state === 'data') {
        return `Processed: ${asyncVal.data}`;
      }
      if (asyncVal.state === 'loading') {
        return 'Processing (Loading)...';
      }
      if (asyncVal.state === 'error') {
        return `Processing Error: ${asyncVal.error}`;
      }
      return 'Processing (Initial)...'; // Should ideally not happen if read triggers loading
    });

    const scope = createScope();

    const TestComponent = defineComponent({
      setup() {
        const processedData = useProvider(processedDataProvider);
        const updateTrigger = useProviderUpdater(triggerProvider);
        return { processedData, updateTrigger };
      },
      render() {
        return h('div', [
          h('span', { 'data-testid': 'computed-async' }, this.processedData),
          h('button', { onClick: () => this.updateTrigger((t) => t + 1) }, 'Update Trigger'),
        ]);
      },
    });

    const wrapper = mount(TestComponent, { global: { provide: { [scopeSymbol]: scope } } });

    // Initial state (Computed reads Async, Async starts loading)
    await nextTick();
    expect(wrapper.find('[data-testid="computed-async"]').text()).toBe('Processing (Loading)...');

    // Wait for async to resolve
    await vi.advanceTimersByTimeAsync(20);
    await nextTick(); await nextTick(); // Allow async resolution and computed update
    expect(wrapper.find('[data-testid="computed-async"]').text()).toBe('Processed: Data 1');

    // Update the trigger, causing async to re-fetch and computed to update
    await wrapper.find('button').trigger('click');
    await nextTick(); // Update trigger state
    await nextTick(); // Async re-fetches, Computed reads loading state
    expect(wrapper.find('[data-testid="computed-async"]').text()).toBe('Processing (Loading)...');

    // Wait for async to resolve again
    await vi.advanceTimersByTimeAsync(20);
    await nextTick(); await nextTick(); // Allow async resolution and computed update
    expect(wrapper.find('[data-testid="computed-async"]').text()).toBe('Processed: Data 2');

    wrapper.unmount();
    scope.dispose();
    vi.useRealTimers();
  });

  });

    const wrapper = mount(
      defineComponent({
        render: () =>
          h(
            ProviderScope,
            {
              overrides: [{ provider: counterProvider, useValue: overrideProvider }],
            },
            { default: () => h(CombinedComponent) },
          ),
      }),
    );

    await nextTick();

    // Check initial overridden value
    expect(wrapper.find('[data-testid="val"]').text()).toBe(String(overrideValue));

    // Trigger update using the updater
    await wrapper.find('button').trigger('click');
    await nextTick();

    // Check if the update applied to the overridden state
    expect(wrapper.find('[data-testid="val"]').text()).toBe(String(overrideValue + 1));

    wrapper.unmount();
  });



  // TODO: Add test for useProviderUpdater standalone (Covered by 'useProviderUpdater should update state reactively via useProvider')
  // TODO: Add test for scope disposal cleanup (Covered by 'should clean up scope listener on component unmount')
  // TODO: Add tests for async/stream providers if applicable to hooks (Covered by added tests)
}); // Close describe block
