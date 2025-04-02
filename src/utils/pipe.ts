/**
 * Pipes a value through a sequence of functions.
 *
 * @template T The initial value type.
 * @param value The initial value.
 * @returns The result of applying all functions in sequence.
 *
 * @example
 * const add = (n: number) => (x: number) => x + n;
 * const multiply = (n: number) => (x: number) => x * n;
 *
 * const result = pipe(
 *   5,
 *   add(2),      // 5 + 2 = 7
 *   multiply(3), // 7 * 3 = 21
 *   add(1)       // 21 + 1 = 22
 * ); // result is 22
 */
export function pipe<T>(value: T): T;
export function pipe<T, A>(value: T, fn1: (input: T) => A): A;
export function pipe<T, A, B>(
  value: T,
  fn1: (input: T) => A,
  fn2: (input: A) => B,
): B;
export function pipe<T, A, B, C>(
  value: T,
  fn1: (input: T) => A,
  fn2: (input: A) => B,
  fn3: (input: B) => C,
): C;
export function pipe<T, A, B, C, D>(
  value: T,
  fn1: (input: T) => A,
  fn2: (input: A) => B,
  fn3: (input: B) => C,
  fn4: (input: C) => D,
): D;
export function pipe<T, A, B, C, D, E>(
  value: T,
  fn1: (input: T) => A,
  fn2: (input: A) => B,
  fn3: (input: B) => C,
  fn4: (input: C) => D,
  fn5: (input: D) => E,
): E;
export function pipe<T, A, B, C, D, E, F>(
  value: T,
  fn1: (input: T) => A,
  fn2: (input: A) => B,
  fn3: (input: B) => C,
  fn4: (input: C) => D,
  fn5: (input: D) => E,
  fn6: (input: E) => F,
): F;
export function pipe<T, A, B, C, D, E, F, G>(
  value: T,
  fn1: (input: T) => A,
  fn2: (input: A) => B,
  fn3: (input: B) => C,
  fn4: (input: C) => D,
  fn5: (input: D) => E,
  fn6: (input: E) => F,
  fn7: (input: F) => G,
): G;
export function pipe<T, A, B, C, D, E, F, G, H>(
  value: T,
  fn1: (input: T) => A,
  fn2: (input: A) => B,
  fn3: (input: B) => C,
  fn4: (input: C) => D,
  fn5: (input: D) => E,
  fn6: (input: E) => F,
  fn7: (input: F) => G,
  fn8: (input: G) => H,
): H;
export function pipe<T, A, B, C, D, E, F, G, H, I>(
  value: T,
  fn1: (input: T) => A,
  fn2: (input: A) => B,
  fn3: (input: B) => C,
  fn4: (input: C) => D,
  fn5: (input: D) => E,
  fn6: (input: E) => F,
  fn7: (input: F) => G,
  fn8: (input: G) => H,
  fn9: (input: H) => I,
): I;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function pipe(value: any, ...fns: Array<(input: any) => any>): any {
  return fns.reduce((acc, fn) => fn(acc), value);
}