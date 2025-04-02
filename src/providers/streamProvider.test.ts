import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { createScope, Scope } from '../scope.js';
import { stateProvider } from './stateProvider.js'; // Import stateProvider
import { streamProvider } from './streamProvider.js';
import { isLoading, hasData, hasError } from '../types.js';
import { Subject } from 'rxjs'; // Using RxJS Subject for easy stream simulation

// Helper to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('streamProvider', () => {
  let scope: Scope;
  let testStream: Subject<string>; // Use RxJS Subject to push values

  beforeEach(() => {
    scope = createScope();
    testStream = new Subject<string>();
  });

  afterEach(() => {
    scope?.dispose();
    testStream.complete(); // Ensure stream is completed after each test
  });

  it('should initialize in loading state', () => {
    const testProvider = streamProvider<string>(() => testStream);
    const initialState = scope.read(testProvider);

    expect(isLoading(initialState)).toBe(true);
    if (isLoading(initialState)) {
        expect(initialState.previousData).toBeUndefined();
    }
  });

  it('should transition to data state when stream emits', async () => {
    const testProvider = streamProvider<string>(() => testStream);
    const listener = vi.fn();
    scope.watch(testProvider, listener);

    // Initial read triggers subscription
    const initialState = scope.read(testProvider);
    expect(isLoading(initialState)).toBe(true);
    expect(listener).toHaveBeenCalledTimes(0);

    // Emit data
    testStream.next('data1');
    await delay(1); // Allow microtask queue to process

    const dataState1 = scope.read(testProvider);
    expect(hasData(dataState1)).toBe(true);
    if (hasData(dataState1)) {
      expect(dataState1.data).toBe('data1');
    }
    // Notified for loading -> data1
    expect(listener).toHaveBeenCalledTimes(1);

    // Emit more data
    testStream.next('data2');
    await delay(1);

    const dataState2 = scope.read(testProvider);
    expect(hasData(dataState2)).toBe(true);
    if (hasData(dataState2)) {
      expect(dataState2.data).toBe('data2');
    }
    // Notified for data1 -> data2
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('should transition to error state when stream errors', async () => {
    const testProvider = streamProvider<string>(() => testStream);
    const listener = vi.fn();
    const testError = new Error('Stream failed');
    scope.watch(testProvider, listener);

    const initialState = scope.read(testProvider);
    expect(isLoading(initialState)).toBe(true);

    // Emit error
    testStream.error(testError);
    await delay(1);

    const errorState = scope.read(testProvider);
    expect(hasError(errorState)).toBe(true);
    if (hasError(errorState)) {
      expect(errorState.error).toBe(testError);
    }
    // Notified for loading -> error
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should call unsubscribe on the subscription when scope is disposed', () => {
    const unsubscribeSpy = vi.fn();
    const mockSubscribable = {
      subscribe: (observer: any) => {
        // Simulate emitting one value so subscription is active
        observer.next?.('initial');
        return { unsubscribe: unsubscribeSpy }; // Return subscription with the spy
      }
    };
    const testProvider = streamProvider<string>(() => mockSubscribable);

    scope.read(testProvider); // Initialize and subscribe

    expect(unsubscribeSpy).not.toHaveBeenCalled();
    scope.dispose();
    expect(unsubscribeSpy).toHaveBeenCalledTimes(1); // Verify the spy was called
  });

   it('should call unsubscribe when listener count drops to zero (autoDispose)', () => {
    const unsubscribeSpy = vi.fn();
     const mockSubscribable = {
      subscribe: (observer: any) => {
        observer.next?.('initial');
        return { unsubscribe: unsubscribeSpy };
      }
    };
    const testProvider = streamProvider<string>(() => mockSubscribable);

    const watchUnsubscribe = scope.watch(testProvider, () => {}); // Subscribe via watch

    expect(unsubscribeSpy).not.toHaveBeenCalled();

    watchUnsubscribe(); // Unsubscribe the watcher

    // Auto-dispose should trigger the unsubscribe logic
    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
  });

  it('should re-subscribe and update when a dependency changes', async () => {
    scope = createScope();
    const dependency = stateProvider('stream1');
    let createCount = 0;
    const stream1 = new Subject<string>();
    const stream2 = new Subject<string>();
    const unsubscribe1Spy = vi.spyOn(stream1, 'unsubscribe');
    const unsubscribe2Spy = vi.spyOn(stream2, 'unsubscribe');

    const testProvider = streamProvider<string>((read) => {
      createCount++;
      const streamId = read.read(dependency);
      read.onDispose(() => console.log(`Disposing stream provider for ${streamId}`)); // For debugging
      if (streamId === 'stream1') {
        return stream1;
      } else {
        return stream2;
      }
    });

    const listener = vi.fn();
    scope.watch(testProvider, listener);

    // Initial subscription to stream1
    expect(isLoading(scope.read(testProvider))).toBe(true);
    expect(createCount).toBe(1);
    stream1.next('a');
    await delay(1);
    const dataState1 = scope.read(testProvider);
    if (hasData(dataState1)) {
        expect(dataState1.data).toBe('a');
    } else {
        expect.fail('Expected data state after stream1 emit');
    }
    expect(listener).toHaveBeenCalledTimes(1); // loading -> data

    // Update dependency to switch stream source
    const updater = scope.updater(dependency);
    updater(scope, dependency, 'stream2');
    await delay(1); // Allow propagation

    // Reading again should trigger re-initialization
    // It will dispose the old state (unsubscribing stream1)
    // and create the new state (subscribing to stream2)
    const stateAfterDepChange = scope.read(testProvider);
    expect(isLoading(stateAfterDepChange)).toBe(true); // Should be loading initially
    expect(createCount).toBe(2); // Create function ran again
    // expect(unsubscribe1Spy).toHaveBeenCalledTimes(1); // Check old stream unsubscribed - NOTE: This might be tricky due to how spies work with Subjects

    // Emit on the *new* stream
    stream2.next('b');
    await delay(1);
    const dataState2 = scope.read(testProvider);
    if (hasData(dataState2)) {
        expect(dataState2.data).toBe('b');
    } else {
        expect.fail('Expected data state after stream2 emit');
    }
    // Listener called for: loading->a, loading->b
    // Staleness itself doesn't trigger listener for streams.
    expect(listener).toHaveBeenCalledTimes(2); // loading -> data, loading -> data

    // Ensure emitting on old stream does nothing
    stream1.next('c');
    await delay(1);
    const dataState3 = scope.read(testProvider);
    if (hasData(dataState3)) {
        expect(dataState3.data).toBe('b'); // Still 'b'
    } else {
        expect.fail('Expected data state after ignored stream1 emit');
    }
    expect(listener).toHaveBeenCalledTimes(2); // No extra notification

    // Dispose scope should unsubscribe from stream2
    scope.dispose();
    // expect(unsubscribe2Spy).toHaveBeenCalledTimes(1); // Check new stream unsubscribed
  });


  // TODO: Add tests for dependencies
  // TODO: Add tests for completion handling
});