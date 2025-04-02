[**@shtse8/fluxus v1.0.0**](../../README.md)

---

[@shtse8/fluxus](../../README.md) / [src](../README.md) / isStateProviderInstance

# Function: isStateProviderInstance()

> **isStateProviderInstance**\<`T`\>(`provider`): `provider is StateProviderInstance<T>`

Defined in: [src/providers/stateProvider.ts:74](https://github.com/shtse8/fluxus/blob/4924e60e87ca8856c0bf61d7c46469f55d63d7b6/src/providers/stateProvider.ts#L74)

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

`provider is StateProviderInstance<T>`

True if the value is a StateProviderInstance, false otherwise.
