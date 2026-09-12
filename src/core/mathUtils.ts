import { ColumnStats } from '../types';

/**
 * Calculates min and max of a number array in a single O(N) pass
 * with O(1) stack space, avoiding V8 RangeError call-stack limits on large arrays (>65,536 elements).
 */
export function getArrayMinMax(arr: number[]): { min: number; max: number } {
  if (!arr || arr.length === 0) return { min: 0, max: 0 };
  let min = arr[0];
  let max = arr[0];
  for (let i = 1; i < arr.length; i++) {
    const v = arr[i];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return { min, max };
}

/**
 * Calculates the minimum value in a number array without spreading.
 */
export function getArrayMin(arr: number[]): number {
  if (!arr || arr.length === 0) return 0;
  let min = arr[0];
  for (let i = 1; i < arr.length; i++) {
    const v = arr[i];
    if (v < min) min = v;
  }
  return min;
}

/**
 * Calculates the maximum value in a number array without spreading.
 */
export function getArrayMax(arr: number[]): number {
  if (!arr || arr.length === 0) return 0;
  let max = arr[0];
  for (let i = 1; i < arr.length; i++) {
    const v = arr[i];
    if (v > max) max = v;
  }
  return max;
}

/**
 * Computes ColumnStats (min, max, mean, count) in a single O(N) pass
 * safely ignoring null, undefined, non-numeric, NaN, and infinite values.
 */
export function computeColumnStats(arr: (number | string | null | undefined)[]): ColumnStats {
  if (!arr || arr.length === 0) {
    return { min: null, max: null, mean: null, count: 0 };
  }

  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  let count = 0;

  for (let i = 0; i < arr.length; i++) {
    const val = arr[i];
    const num = typeof val === 'number' ? val : typeof val === 'string' ? parseFloat(val) : NaN;
    if (!isNaN(num) && isFinite(num)) {
      if (num < min) min = num;
      if (num > max) max = num;
      sum += num;
      count++;
    }
  }

  if (count === 0) {
    return { min: null, max: null, mean: null, count: 0 };
  }

  return {
    min,
    max,
    mean: sum / count,
    count,
  };
}
