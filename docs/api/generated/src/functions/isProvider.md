[**@shtse8/fluxus v1.0.0**](../../README.md)

***

[@shtse8/fluxus](../../README.md) / [src](../README.md) / isProvider

# Function: isProvider()

> **isProvider**\<`T`\>(`obj`): `obj is Provider<T>`

Defined in: [src/types.ts:80](https://github.com/shtse8/fluxus/blob/4924e60e87ca8856c0bf61d7c46469f55d63d7b6/src/types.ts#L80)

A basic type guard to check if an unknown value is potentially a Fluxus provider.
Note: This is a very basic check and might need refinement if provider
structures become more complex (e.g., objects with specific methods).

## Type Parameters

### T

`T`

The potential type provided by the provider.

## Parameters

### obj

`unknown`

The value to check.

## Returns

`obj is Provider<T>`

True if the value is a function (the basic form of a provider), false otherwise.
