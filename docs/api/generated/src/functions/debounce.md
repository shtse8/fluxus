[**@shtse8/fluxus v1.0.0**](../../README.md)

***

[@shtse8/fluxus](../../README.md) / [src](../README.md) / debounce

# Function: debounce()

> **debounce**\<`T`\>(`func`, `wait`): (...`args`) => `void`

Defined in: [src/utils/debounce.ts:12](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/utils/debounce.ts#L12)

Creates a debounced function that delays invoking the input function until
after `wait` milliseconds have elapsed since the last time the debounced
function was invoked.

## Type Parameters

### T

`T` *extends* (...`args`) => `any`

A function type that takes any number of arguments and returns any value.

## Parameters

### func

`T`

The function to debounce.

### wait

`number`

The number of milliseconds to delay.

## Returns

Returns the new debounced function.

> (...`args`): `void`

### Parameters

#### args

...`Parameters`\<`T`\>

### Returns

`void`
