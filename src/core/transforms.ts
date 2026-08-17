import { PeakInfo } from '../types';

export interface TransformDefinition {
  id: string;
  name: string;
  description: string;
  category: 'baseline' | 'smooth' | 'normalize' | 'math' | 'peaks';
}

export const AVAILABLE_TRANSFORMS: TransformDefinition[] = [
  {
    id: 'baseline_min',
    name: 'Zero Baseline (Subtract Min)',
    description: 'Subtracts the minimum value so the baseline starts at 0.',
    category: 'baseline',
  },
  {
    id: 'normalize_custom',
    name: 'Custom Range Normalization',
    description: 'Rescales data to user-specified [Target Min, Target Max] interval (e.g. [0, 1] or [-1, +1]).',
    category: 'normalize',
  },
  {
    id: 'normalize_max',
    name: 'Normalize to Peak Max (= 1.0)',
    description: 'Divides data by peak maximum so peak intensity is 1.0.',
    category: 'normalize',
  },
  {
    id: 'smooth_moving_avg',
    name: 'Moving Average Smoothing',
    description: 'Applies a moving average to suppress high-frequency noise.',
    category: 'smooth',
  },
  {
    id: 'smooth_savgol',
    name: 'Savitzky-Golay Filter',
    description: 'Polynomial smoothing filter preserving peak heights and shapes.',
    category: 'smooth',
  },
  {
    id: 'derivative_1st',
    name: 'First Derivative (dY/dX)',
    description: 'Calculates the rate of change / slope of Y with respect to X.',
    category: 'math',
  },
];

/**
 * Applies a list of transforms sequentially to a numeric array (Y-series).
 */
export function applyTransforms(
  xVals: (number | string | null)[],
  yVals: (number | string | null)[],
  activeTransformIds: string[],
  transformParams?: {
    normalize?: { min: number; max: number };
    smooth?: { window: number };
    [key: string]: any;
  }
): { x: number[]; y: number[] } {
  // Filter valid paired numeric points
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < Math.min(xVals.length, yVals.length); i++) {
    const rawX = xVals[i];
    const rawY = yVals[i];
    const numX = typeof rawX === 'number' ? rawX : typeof rawX === 'string' ? parseFloat(rawX) : NaN;
    const numY = typeof rawY === 'number' ? rawY : typeof rawY === 'string' ? parseFloat(rawY) : NaN;
    if (!isNaN(numX) && isFinite(numX) && !isNaN(numY) && isFinite(numY)) {
      points.push({ x: numX, y: numY });
    }
  }

  if (points.length === 0) {
    return { x: [], y: [] };
  }

  let curY = points.map((p) => p.y);
  const curX = points.map((p) => p.x);

  for (const tId of activeTransformIds) {
    if (tId === 'baseline_min') {
      const min = Math.min(...curY);
      curY = curY.map((v) => v - min);
    } else if (tId === 'normalize_custom' || tId === 'normalize_01') {
      const targetMin = transformParams?.normalize?.min ?? 0;
      const targetMax = transformParams?.normalize?.max ?? 1;
      const curMin = Math.min(...curY);
      const curMax = Math.max(...curY);
      const curRange = curMax - curMin;
      const targetRange = targetMax - targetMin;
      
      if (curRange !== 0) {
        curY = curY.map((v) => targetMin + ((v - curMin) / curRange) * targetRange);
      } else {
        curY = curY.map(() => targetMin);
      }
    } else if (tId === 'normalize_max') {
      const max = Math.max(...curY);
      curY = max !== 0 ? curY.map((v) => v / max) : curY;
    } else if (tId === 'smooth_moving_avg') {
      const window = transformParams?.smooth?.window ?? 5;
      const half = Math.floor(window / 2);
      const smoothed: number[] = [];
      for (let i = 0; i < curY.length; i++) {
        let sum = 0;
        let count = 0;
        for (let w = -half; w <= half; w++) {
          const idx = i + w;
          if (idx >= 0 && idx < curY.length) {
            sum += curY[idx];
            count++;
          }
        }
        smoothed.push(count > 0 ? sum / count : curY[i]);
      }
      curY = smoothed;
    } else if (tId === 'smooth_savgol') {
      // 5-point quadratic Savitzky-Golay convolution coefficients: [-3, 12, 17, 12, -3] / 35
      const coeffs = [-3, 12, 17, 12, -3];
      const norm = 35;
      const filtered: number[] = [];
      for (let i = 0; i < curY.length; i++) {
        if (i < 2 || i >= curY.length - 2) {
          filtered.push(curY[i]);
        } else {
          let sum = 0;
          for (let j = -2; j <= 2; j++) {
            sum += coeffs[j + 2] * curY[i + j];
          }
          filtered.push(sum / norm);
        }
      }
      curY = filtered;
    } else if (tId === 'derivative_1st') {
      const deriv: number[] = [];
      for (let i = 0; i < curY.length; i++) {
        if (i === 0) {
          const dx = curX[1] - curX[0];
          deriv.push(dx !== 0 ? (curY[1] - curY[0]) / dx : 0);
        } else if (i === curY.length - 1) {
          const dx = curX[i] - curX[i - 1];
          deriv.push(dx !== 0 ? (curY[i] - curY[i - 1]) / dx : 0);
        } else {
          const dx = curX[i + 1] - curX[i - 1];
          deriv.push(dx !== 0 ? (curY[i + 1] - curY[i - 1]) / dx : 0);
        }
      }
      curY = deriv;
    }
  }

  return { x: curX, y: curY };
}

/**
 * Finds local peak maxima in a spectrum or curve.
 */
export function detectPeaks(
  xVals: number[],
  yVals: number[],
  prominence = 0.05,
  minDistance = 5
): PeakInfo[] {
  const peaks: PeakInfo[] = [];
  if (yVals.length < 3) return peaks;

  const yMin = Math.min(...yVals);
  const yMax = Math.max(...yVals);
  const totalRange = yMax - yMin;
  const absThreshold = yMin + totalRange * prominence;

  for (let i = 1; i < yVals.length - 1; i++) {
    if (yVals[i] > yVals[i - 1] && yVals[i] > yVals[i + 1] && yVals[i] >= absThreshold) {
      if (peaks.length === 0 || i - peaks[peaks.length - 1].index >= minDistance) {
        peaks.push({
          x: xVals[i],
          y: yVals[i],
          index: i,
        });
      }
    }
  }

  return peaks;
}
