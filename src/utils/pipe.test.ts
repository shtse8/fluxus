import { describe, it, expect } from 'vitest';
import { pipe } from './pipe.js';

describe('pipe utility', () => {
  const add = (n: number) => (x: number): number => x + n;
  const multiply = (n: number) => (x: number): number => x * n;
  const toString = (x: number): string => `Value: ${x}`;

  it('should return the initial value if no functions are provided', () => {
    expect(pipe(5)).toBe(5);
    expect(pipe('hello')).toBe('hello');
    expect(pipe(null)).toBe(null);
  });

  it('should pipe a value through a single function', () => {
    expect(pipe(5, add(2))).toBe(7);
  });

  it('should pipe a value through multiple functions', () => {
    const result = pipe(
      5,
      add(2),      // 7
      multiply(3), // 21
      add(1),      // 22
    );
    expect(result).toBe(22);
  });

  it('should handle different types across functions', () => {
    const result = pipe(
      10,
      add(5),      // 15
      multiply(2), // 30
      toString,    // "Value: 30"
    );
    expect(result).toBe('Value: 30');
  });

  it('should work with the maximum number of defined overloads (9)', () => {
    const fn = (x: number) => x + 1;
    const result = pipe(0, fn, fn, fn, fn, fn, fn, fn, fn, fn); // 0 + 9 = 9
    expect(result).toBe(9);
  });

  it('should handle more than 9 functions using the rest parameter implementation', () => {
    const fn = (x: number) => x + 1;
    // @ts-expect-error - Testing implementation beyond defined type overloads
    const result = pipe(0, fn, fn, fn, fn, fn, fn, fn, fn, fn, fn); // 0 + 10 = 10
    expect(result).toBe(10);
  });
});