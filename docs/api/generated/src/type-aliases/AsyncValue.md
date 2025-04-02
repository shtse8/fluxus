[**@shtse8/fluxus v1.0.0**](../../README.md)

***

[@shtse8/fluxus](../../README.md) / [src](../README.md) / AsyncValue

# Type Alias: AsyncValue\<T\>

> **AsyncValue**\<`T`\> = [`AsyncLoading`](AsyncLoading.md) \| [`AsyncData`](AsyncData.md)\<`T`\> \| [`AsyncError`](AsyncError.md)

Defined in: [src/types.ts:85](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/types.ts#L85)

A union type representing the possible states of an asynchronous operation:
loading, data, or error.

Inspired by Riverpod's AsyncValue.

## Type Parameters

### T

`T`
