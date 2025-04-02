[**@shtse8/fluxus v1.0.0**](../../README.md)

***

[@shtse8/fluxus](../../README.md) / [src](../README.md) / Disposable

# Interface: Disposable

Defined in: [src/types.ts:11](https://github.com/shtse8/fluxus/blob/4924e60e87ca8856c0bf61d7c46469f55d63d7b6/src/types.ts#L11)

Represents an object that holds a disposable resource or manages a lifecycle
that requires explicit cleanup.

## Properties

### dispose

> **dispose**: [`Dispose`](../type-aliases/Dispose.md)

Defined in: [src/types.ts:16](https://github.com/shtse8/fluxus/blob/4924e60e87ca8856c0bf61d7c46469f55d63d7b6/src/types.ts#L16)

Disposes of the resource or ends the lifecycle managed by this object.
Calling dispose multiple times should be safe (idempotent).
