import React, { StrictMode } from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest'; // Import vi
import { ProviderScope, useProvider, useProviderUpdater } from './index.js'; // Assuming index exports necessary things
import { stateProvider } from '../src/providers/stateProvider.js';
import { createScope, Scope } from '../src/scope.js';
import { Provider } from '../src/types.js';

// --- Test Setup ---
// No need for a top-level scope variable anymore,
// ProviderScope creates its own internal scope.

// Helper component to test useProvider
const TestComponent = ({ provider }: { provider: Provider<any> }) => {
  const value = useProvider(provider);
  return <div data-testid="value">{JSON.stringify(value)}</div>;
};

// Helper component to test useProviderUpdater
const UpdateComponent = ({ provider }: { provider: ReturnType<typeof stateProvider<any>> }) => {
  const update = useProviderUpdater(provider);
  return <button onClick={() => act(() => update((v: number) => v + 1))}>Increment</button>;
};

// Helper component combining both hooks
const CombinedComponent = ({ provider }: { provider: ReturnType<typeof stateProvider<number>> }) => {
  const value = useProvider(provider);
  const update = useProviderUpdater(provider);
  return (
    <div>
      <div data-testid="value">{value}</div>
      <button onClick={() => act(() => update((v) => v + 1))}>Increment</button>
      <button onClick={() => act(() => update(100))}>Set to 100</button>
    </div>
  );
};

// --- Tests ---

describe('React Adapter Hooks', () => {
  describe('useProvider', () => {
    it('should read the initial value from a stateProvider', () => {
      const counterProvider = stateProvider(5);
      render(
        <ProviderScope>
          <TestComponent provider={counterProvider} />
        </ProviderScope>
      ); // Add missing closing parenthesis
      expect(screen.getByTestId('value')).toHaveTextContent('5');
    });

    it('should read the value from a simple provider', () => {
      const simpleProvider: Provider<string> = () => 'hello world';
      render(
        <ProviderScope>
          <TestComponent provider={simpleProvider} />
        </ProviderScope>
      ); // Add missing closing parenthesis
      expect(screen.getByTestId('value')).toHaveTextContent('"hello world"'); // JSON stringified
    });

    it('should re-render with the updated value when stateProvider changes', () => {
      const counterProvider = stateProvider(0);
      // Use CombinedComponent to test updates triggered from within the scope
      render(
        <ProviderScope>
          <CombinedComponent provider={counterProvider} />
        </ProviderScope>
      ); // Add missing closing parenthesis

      expect(screen.getByTestId('value')).toHaveTextContent('0');

      // Simulate update using the button from CombinedComponent
      act(() => {
        screen.getByText('Set to 100').click(); // Use the set button for a clear change
      });

      expect(screen.getByTestId('value')).toHaveTextContent('100');
    });
  });

  describe('useProviderUpdater', () => {
    it('should get an updater function for a stateProvider', () => {
      const counterProvider = stateProvider(0);
      let updater: Function | null = null;

      const GetUpdaterComponent = () => {
        // Read the provider first to ensure it's initialized in the scope
        useProvider(counterProvider);
        updater = useProviderUpdater(counterProvider);
        return null;
      };

      render(
        <ProviderScope>
          <GetUpdaterComponent />
        </ProviderScope>
      ); // Add missing closing parenthesis

      expect(updater).toBeInstanceOf(Function);
    });

    it('should update the provider value when the updater is called', () => {
      const counterProvider = stateProvider(1);
      render(
        <ProviderScope>
          <CombinedComponent provider={counterProvider} />
        </ProviderScope>
      ); // Add missing closing parenthesis

      expect(screen.getByTestId('value')).toHaveTextContent('1');

      // Click increment button
      act(() => {
        screen.getByText('Increment').click();
      });
      expect(screen.getByTestId('value')).toHaveTextContent('2');

      // Click set button
      act(() => {
        screen.getByText('Set to 100').click();
      });
      expect(screen.getByTestId('value')).toHaveTextContent('100');
    });

     it('should throw error if used without ProviderScope', () => {
        const counterProvider = stateProvider(0);
        // Suppress console.error expected from React for this test
        const originalError = console.error;
        console.error = vi.fn();

        expect(() => render(
            <TestComponent provider={counterProvider} />
        )).toThrowError('useScope must be used within a ProviderScope');

        // Restore console.error
        console.error = originalError;
     });

     it('should throw error when getting updater for non-state provider', () => {
        const simpleProvider: Provider<string> = () => 'hello';
        const originalError = console.error;
        console.error = vi.fn(); // Suppress React error boundary logs

        const GetUpdaterComponent = () => {
            useProviderUpdater(simpleProvider as any); // Cast needed for test
            return null;
        };

        expect(() => render(
            <ProviderScope>
                <GetUpdaterComponent />
            </ProviderScope>
        )).toThrowError('Provider is not a StateProvider or state is inconsistent'); // Updated error message

        console.error = originalError;
     });
  });
});