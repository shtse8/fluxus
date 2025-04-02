[**@shtse8/fluxus v1.0.0**](../../README.md)

***

[@shtse8/fluxus](../../README.md) / [react-adapter](../README.md) / useProviderUpdater

# Function: useProviderUpdater()

> **useProviderUpdater**\<`T`\>(`provider`): (`newValueOrFn`) => `void`

Defined in: [react-adapter/hooks.ts:114](https://github.com/shtse8/fluxus/blob/4924e60e87ca8856c0bf61d7c46469f55d63d7b6/react-adapter/hooks.ts#L114)

A React hook that returns the updater function for a [StateProviderInstance](../../src/interfaces/StateProviderInstance.md).

This hook allows components to update the state of a `StateProvider` without
needing to subscribe to its value (and thus avoiding re-renders when the
value changes if the component doesn't display it).

The returned function has a stable identity across re-renders as long as the
provider and scope remain the same, making it safe to use in dependency arrays
of other hooks like `useEffect` or `useCallback`.

Must be used within a [ProviderScope](ProviderScope.md).

## Type Parameters

### T

`T`

The type of the state managed by the StateProvider.

## Parameters

### provider

[`StateProviderInstance`](../../src/interfaces/StateProviderInstance.md)\<`T`\>

The StateProvider instance whose updater is needed.

## Returns

A stable function to update the provider's state.

> (`newValueOrFn`): `void`

### Parameters

#### newValueOrFn

`T` | (`prev`) => `T`

### Returns

`void`

## Throws

If used outside of a `ProviderScope`.

## Throws

If the provider is not a valid, initialized StateProvider in the scope.
