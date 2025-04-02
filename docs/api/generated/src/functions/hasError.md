[**@shtse8/fluxus v1.0.0**](../../README.md)

***

[@shtse8/fluxus](../../README.md) / [src](../README.md) / hasError

# Function: hasError()

> **hasError**\<`T`\>(`value`): `value is Readonly<{ error: unknown; previousData?: unknown; stackTrace?: string; state: "error" }>`

Defined in: [src/types.ts:111](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/types.ts#L111)

Type guard to check if an AsyncValue is in the error state.

## Type Parameters

### T

`T`

## Parameters

### value

[`AsyncValue`](../type-aliases/AsyncValue.md)\<`T`\>

## Returns

`value is Readonly<{ error: unknown; previousData?: unknown; stackTrace?: string; state: "error" }>`
