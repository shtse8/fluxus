[**@shtse8/fluxus v1.0.0**](../../README.md)

***

[@shtse8/fluxus](../../README.md) / [src](../README.md) / Disposable

# Interface: Disposable

Defined in: [src/types.ts:11](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/types.ts#L11)

Represents an object that holds a disposable resource or manages a lifecycle
that requires explicit cleanup.

## Properties

### dispose

> **dispose**: [`Dispose`](../type-aliases/Dispose.md)

Defined in: [src/types.ts:16](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/types.ts#L16)

Disposes of the resource or ends the lifecycle managed by this object.
Calling dispose multiple times should be safe (idempotent).
