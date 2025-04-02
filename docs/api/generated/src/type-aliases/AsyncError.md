[**@shtse8/fluxus v1.0.0**](../../README.md)

***

[@shtse8/fluxus](../../README.md) / [src](../README.md) / AsyncError

# Type Alias: AsyncError

> **AsyncError** = `Readonly`\<\{ `error`: `unknown`; `previousData`: `unknown`; `stackTrace`: `string`; `state`: `"error"`; \}\>

Defined in: [src/types.ts:72](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/types.ts#L72)

Represents the state of an asynchronous operation: Error Occurred. May contain previous data if keepPreviousDataOnError is true.
