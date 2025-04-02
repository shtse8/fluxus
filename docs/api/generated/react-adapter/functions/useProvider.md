[**@shtse8/fluxus v1.0.0**](../../README.md)

***

[@shtse8/fluxus](../../README.md) / [react-adapter](../README.md) / useProvider

# Function: useProvider()

> **useProvider**\<`T`\>(`provider`): `T`

Defined in: [react-adapter/hooks.ts:27](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/react-adapter/hooks.ts#L27)

A React hook that reads a provider's value from the current [Scope](../../src/classes/Scope.md)
and subscribes to updates.

The component calling this hook will re-render whenever the provider's
state changes in the scope. It uses `useSyncExternalStore` internally
to ensure compatibility with concurrent rendering features in React.

Must be used within a [ProviderScope](ProviderScope.md).

## Type Parameters

### T

`T`

The type of the value provided by the provider.

## Parameters

### provider

[`Provider`](../../src/type-aliases/Provider.md)\<`T`\>

The provider whose value is to be read and watched.

## Returns

`T`

The current value of the provider.

## Throws

If used outside of a `ProviderScope`.

## Throws

If the provider state has been disposed.

## Throws

If a circular dependency is detected during initialization.
