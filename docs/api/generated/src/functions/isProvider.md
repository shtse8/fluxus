[**@shtse8/fluxus v1.0.0**](../../README.md)

***

[@shtse8/fluxus](../../README.md) / [src](../README.md) / isProvider

# Function: isProvider()

> **isProvider**\<`T`\>(`obj`): `obj is Provider&lt;T&gt;`

Defined in: [src/types.ts:166](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/types.ts#L166)

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

`obj is Provider&lt;T&gt;`

True if the value is a function (the basic form of a provider), false otherwise.
