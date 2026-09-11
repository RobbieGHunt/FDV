import { Dataset } from '../types';

export const COLOR_CYCLE = [
  '#00adb5', // Cyan / Teal
  '#ff5722', // Orange Red
  '#2196f3', // Blue
  '#4caf50', // Green
  '#e91e63', // Pink
  '#9c27b0', // Purple
  '#ff9800', // Amber
  '#00bcd4', // Cyan
  '#f44336', // Red
  '#ffeb3b', // Yellow
  '#8bc34a', // Light Green
  '#3f51b5', // Indigo
];

/**
 * Resolves the effective display color for a curve.
 * Hierarchy:
 * 1. Individual curve style override (sStyle.color)
 * 2. Primary curve (yIdx === 0) inherits the dataset's base color (ds.color)
 * 3. Secondary curves (yIdx > 0) use distinct cycle colors offset by dataset index
 * 4. Fallback to COLOR_CYCLE
 */
export function resolveCurveColor(
  ds: Dataset,
  yCol: string,
  yIdx: number,
  dsIdx: number = 0
): string {
  const sStyle = ds.seriesStyles?.[yCol] || {};
  return (
    sStyle.color ||
    (yIdx === 0 && ds.color ? ds.color : undefined) ||
    COLOR_CYCLE[(Math.max(0, dsIdx) * 3 + yIdx) % COLOR_CYCLE.length]
  );
}

/**
 * Converts hex or rgb color strings into rgba with the given opacity.
 */
export function hexOrRgbToRgba(color: string, opacity: number): string {
  if (!color) return `rgba(2, 132, 199, ${opacity})`;
  const trimmed = color.trim();
  if (trimmed.startsWith('#')) {
    let c = trimmed.substring(1);
    if (c.length === 3) c = c.split('').map((x) => x + x).join('');
    if (c.length === 6) {
      const num = parseInt(c, 16);
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
  }
  if (trimmed.startsWith('rgb(')) {
    return trimmed.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`);
  }
  if (trimmed.startsWith('rgba(')) {
    return trimmed.replace(/,\s*[\d.]+\)$/, `, ${opacity})`);
  }
  return trimmed;
}

/**
 * Validates and ensures a standard 6-digit hex color for HTML5 <input type="color">.
 */
export function toValidColorHex(color: string, fallback: string = '#00adb5'): string {
  if (!color) return fallback;
  const trimmed = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed;
  }
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
  }
  return fallback;
}
