[**@shtse8/fluxus v1.0.0**](../../README.md)

***

[@shtse8/fluxus](../../README.md) / [src](../README.md) / pipe

# Function: pipe()

## Call Signature

> **pipe**\<`T`\>(`value`): `T`

Defined in: [src/utils/pipe.ts:19](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/utils/pipe.ts#L19)

Pipes a value through a sequence of functions.

### Type Parameters

#### T

`T`

The initial value type.

### Parameters

#### value

`T`

The initial value.

### Returns

`T`

The result of applying all functions in sequence.

### Example

```ts
const add = (n: number) => (x: number) => x + n;
const multiply = (n: number) => (x: number) => x * n;

const result = pipe(
  5,
  add(2),      // 5 + 2 = 7
  multiply(3), // 7 * 3 = 21
  add(1)       // 21 + 1 = 22
); // result is 22
```

## Call Signature

> **pipe**\<`T`, `A`\>(`value`, `fn1`): `A`

Defined in: [src/utils/pipe.ts:20](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/utils/pipe.ts#L20)

Pipes a value through a sequence of functions.

### Type Parameters

#### T

`T`

The initial value type.

#### A

`A`

### Parameters

#### value

`T`

The initial value.

#### fn1

(`input`) => `A`

### Returns

`A`

The result of applying all functions in sequence.

### Example

```ts
const add = (n: number) => (x: number) => x + n;
const multiply = (n: number) => (x: number) => x * n;

const result = pipe(
  5,
  add(2),      // 5 + 2 = 7
  multiply(3), // 7 * 3 = 21
  add(1)       // 21 + 1 = 22
); // result is 22
```

## Call Signature

> **pipe**\<`T`, `A`, `B`\>(`value`, `fn1`, `fn2`): `B`

Defined in: [src/utils/pipe.ts:21](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/utils/pipe.ts#L21)

Pipes a value through a sequence of functions.

### Type Parameters

#### T

`T`

The initial value type.

#### A

`A`

#### B

`B`

### Parameters

#### value

`T`

The initial value.

#### fn1

(`input`) => `A`

#### fn2

(`input`) => `B`

### Returns

`B`

The result of applying all functions in sequence.

### Example

```ts
const add = (n: number) => (x: number) => x + n;
const multiply = (n: number) => (x: number) => x * n;

const result = pipe(
  5,
  add(2),      // 5 + 2 = 7
  multiply(3), // 7 * 3 = 21
  add(1)       // 21 + 1 = 22
); // result is 22
```

## Call Signature

> **pipe**\<`T`, `A`, `B`, `C`\>(`value`, `fn1`, `fn2`, `fn3`): `C`

Defined in: [src/utils/pipe.ts:22](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/utils/pipe.ts#L22)

Pipes a value through a sequence of functions.

### Type Parameters

#### T

`T`

The initial value type.

#### A

`A`

#### B

`B`

#### C

`C`

### Parameters

#### value

`T`

The initial value.

#### fn1

(`input`) => `A`

#### fn2

(`input`) => `B`

#### fn3

(`input`) => `C`

### Returns

`C`

The result of applying all functions in sequence.

### Example

```ts
const add = (n: number) => (x: number) => x + n;
const multiply = (n: number) => (x: number) => x * n;

const result = pipe(
  5,
  add(2),      // 5 + 2 = 7
  multiply(3), // 7 * 3 = 21
  add(1)       // 21 + 1 = 22
); // result is 22
```

## Call Signature

> **pipe**\<`T`, `A`, `B`, `C`, `D`\>(`value`, `fn1`, `fn2`, `fn3`, `fn4`): `D`

Defined in: [src/utils/pipe.ts:28](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/utils/pipe.ts#L28)

Pipes a value through a sequence of functions.

### Type Parameters

#### T

`T`

The initial value type.

#### A

`A`

#### B

`B`

#### C

`C`

#### D

`D`

### Parameters

#### value

`T`

The initial value.

#### fn1

(`input`) => `A`

#### fn2

(`input`) => `B`

#### fn3

(`input`) => `C`

#### fn4

(`input`) => `D`

### Returns

`D`

The result of applying all functions in sequence.

### Example

```ts
const add = (n: number) => (x: number) => x + n;
const multiply = (n: number) => (x: number) => x * n;

const result = pipe(
  5,
  add(2),      // 5 + 2 = 7
  multiply(3), // 7 * 3 = 21
  add(1)       // 21 + 1 = 22
); // result is 22
```

## Call Signature

> **pipe**\<`T`, `A`, `B`, `C`, `D`, `E`\>(`value`, `fn1`, `fn2`, `fn3`, `fn4`, `fn5`): `E`

Defined in: [src/utils/pipe.ts:35](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/utils/pipe.ts#L35)

Pipes a value through a sequence of functions.

### Type Parameters

#### T

`T`

The initial value type.

#### A

`A`

#### B

`B`

#### C

`C`

#### D

`D`

#### E

`E`

### Parameters

#### value

`T`

The initial value.

#### fn1

(`input`) => `A`

#### fn2

(`input`) => `B`

#### fn3

(`input`) => `C`

#### fn4

(`input`) => `D`

#### fn5

(`input`) => `E`

### Returns

`E`

The result of applying all functions in sequence.

### Example

```ts
const add = (n: number) => (x: number) => x + n;
const multiply = (n: number) => (x: number) => x * n;

const result = pipe(
  5,
  add(2),      // 5 + 2 = 7
  multiply(3), // 7 * 3 = 21
  add(1)       // 21 + 1 = 22
); // result is 22
```

## Call Signature

> **pipe**\<`T`, `A`, `B`, `C`, `D`, `E`, `F`\>(`value`, `fn1`, `fn2`, `fn3`, `fn4`, `fn5`, `fn6`): `F`

Defined in: [src/utils/pipe.ts:43](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/utils/pipe.ts#L43)

Pipes a value through a sequence of functions.

### Type Parameters

#### T

`T`

The initial value type.

#### A

`A`

#### B

`B`

#### C

`C`

#### D

`D`

#### E

`E`

#### F

`F`

### Parameters

#### value

`T`

The initial value.

#### fn1

(`input`) => `A`

#### fn2

(`input`) => `B`

#### fn3

(`input`) => `C`

#### fn4

(`input`) => `D`

#### fn5

(`input`) => `E`

#### fn6

(`input`) => `F`

### Returns

`F`

The result of applying all functions in sequence.

### Example

```ts
const add = (n: number) => (x: number) => x + n;
const multiply = (n: number) => (x: number) => x * n;

const result = pipe(
  5,
  add(2),      // 5 + 2 = 7
  multiply(3), // 7 * 3 = 21
  add(1)       // 21 + 1 = 22
); // result is 22
```

## Call Signature

> **pipe**\<`T`, `A`, `B`, `C`, `D`, `E`, `F`, `G`\>(`value`, `fn1`, `fn2`, `fn3`, `fn4`, `fn5`, `fn6`, `fn7`): `G`

Defined in: [src/utils/pipe.ts:52](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/utils/pipe.ts#L52)

Pipes a value through a sequence of functions.

### Type Parameters

#### T

`T`

The initial value type.

#### A

`A`

#### B

`B`

#### C

`C`

#### D

`D`

#### E

`E`

#### F

`F`

#### G

`G`

### Parameters

#### value

`T`

The initial value.

#### fn1

(`input`) => `A`

#### fn2

(`input`) => `B`

#### fn3

(`input`) => `C`

#### fn4

(`input`) => `D`

#### fn5

(`input`) => `E`

#### fn6

(`input`) => `F`

#### fn7

(`input`) => `G`

### Returns

`G`

The result of applying all functions in sequence.

### Example

```ts
const add = (n: number) => (x: number) => x + n;
const multiply = (n: number) => (x: number) => x * n;

const result = pipe(
  5,
  add(2),      // 5 + 2 = 7
  multiply(3), // 7 * 3 = 21
  add(1)       // 21 + 1 = 22
); // result is 22
```

## Call Signature

> **pipe**\<`T`, `A`, `B`, `C`, `D`, `E`, `F`, `G`, `H`\>(`value`, `fn1`, `fn2`, `fn3`, `fn4`, `fn5`, `fn6`, `fn7`, `fn8`): `H`

Defined in: [src/utils/pipe.ts:62](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/utils/pipe.ts#L62)

Pipes a value through a sequence of functions.

### Type Parameters

#### T

`T`

The initial value type.

#### A

`A`

#### B

`B`

#### C

`C`

#### D

`D`

#### E

`E`

#### F

`F`

#### G

`G`

#### H

`H`

### Parameters

#### value

`T`

The initial value.

#### fn1

(`input`) => `A`

#### fn2

(`input`) => `B`

#### fn3

(`input`) => `C`

#### fn4

(`input`) => `D`

#### fn5

(`input`) => `E`

#### fn6

(`input`) => `F`

#### fn7

(`input`) => `G`

#### fn8

(`input`) => `H`

### Returns

`H`

The result of applying all functions in sequence.

### Example

```ts
const add = (n: number) => (x: number) => x + n;
const multiply = (n: number) => (x: number) => x * n;

const result = pipe(
  5,
  add(2),      // 5 + 2 = 7
  multiply(3), // 7 * 3 = 21
  add(1)       // 21 + 1 = 22
); // result is 22
```

## Call Signature

> **pipe**\<`T`, `A`, `B`, `C`, `D`, `E`, `F`, `G`, `H`, `I`\>(`value`, `fn1`, `fn2`, `fn3`, `fn4`, `fn5`, `fn6`, `fn7`, `fn8`, `fn9`): `I`

Defined in: [src/utils/pipe.ts:73](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/utils/pipe.ts#L73)

Pipes a value through a sequence of functions.

### Type Parameters

#### T

`T`

The initial value type.

#### A

`A`

#### B

`B`

#### C

`C`

#### D

`D`

#### E

`E`

#### F

`F`

#### G

`G`

#### H

`H`

#### I

`I`

### Parameters

#### value

`T`

The initial value.

#### fn1

(`input`) => `A`

#### fn2

(`input`) => `B`

#### fn3

(`input`) => `C`

#### fn4

(`input`) => `D`

#### fn5

(`input`) => `E`

#### fn6

(`input`) => `F`

#### fn7

(`input`) => `G`

#### fn8

(`input`) => `H`

#### fn9

(`input`) => `I`

### Returns

`I`

The result of applying all functions in sequence.

### Example

```ts
const add = (n: number) => (x: number) => x + n;
const multiply = (n: number) => (x: number) => x * n;

const result = pipe(
  5,
  add(2),      // 5 + 2 = 7
  multiply(3), // 7 * 3 = 21
  add(1)       // 21 + 1 = 22
); // result is 22
```
