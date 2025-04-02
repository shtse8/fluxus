[**@shtse8/fluxus v1.0.0**](../../README.md)

***

[@shtse8/fluxus](../../README.md) / [src](../README.md) / isStateProviderInstance

# Function: isStateProviderInstance()

> **isStateProviderInstance**\<`T`\>(`provider`): `provider is StateProviderInstance&lt;T&gt;`

Defined in: [src/providers/stateProvider.ts:86](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/providers/stateProvider.ts#L86)

Type guard to check if a given value is a [StateProviderInstance](../interfaces/StateProviderInstance.md).

## Type Parameters

### T

`T`

The potential type of the state managed by the provider.

## Parameters

### provider

`unknown`

The value to check.

## Returns

`provider is StateProviderInstance&lt;T&gt;`

True if the value is a StateProviderInstance, false otherwise.
