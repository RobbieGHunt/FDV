const assert = require('assert');

// 1. Production Colors Core Logic
const COLOR_CYCLE = [
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

function resolveCurveColor(ds, yCol, yIdx, dsIdx = 0) {
  const sStyle = ds.seriesStyles?.[yCol] || {};
  return (
    sStyle.color ||
    (yIdx === 0 && ds.color ? ds.color : undefined) ||
    COLOR_CYCLE[(Math.max(0, dsIdx) * 3 + yIdx) % COLOR_CYCLE.length]
  );
}

function hexOrRgbToRgba(color, opacity) {
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

function toValidColorHex(color, fallback = '#00adb5') {
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

// 2. Metadata styling parser logic (matching smartDetector.ts)
function extractStyleFromMetadata(metadata, indexOffset = 0) {
  let color = COLOR_CYCLE[indexOffset % COLOR_CYCLE.length];
  let lineDash = 'solid';
  let markerSymbol = 'circle';
  let lineWidth = 2.0;

  for (const [metaKey, metaVal] of Object.entries(metadata)) {
    const cleanKey = metaKey.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanVal = metaVal.trim();
    if (['color', 'linecolor', 'curvecolor'].includes(cleanKey) && cleanVal) {
      color = cleanVal;
    } else if (['linedash', 'linestyle', 'dash'].includes(cleanKey)) {
      if (['solid', 'dash', 'dot', 'dashdot'].includes(cleanVal.toLowerCase())) {
        lineDash = cleanVal.toLowerCase();
      }
    } else if (['marker', 'markersymbol', 'symbol'].includes(cleanKey)) {
      if (
        ['circle', 'square', 'diamond', 'cross', 'x', 'triangle-up', 'triangle-down', 'star'].includes(
          cleanVal.toLowerCase()
        )
      ) {
        markerSymbol = cleanVal.toLowerCase();
      }
    } else if (['linewidth', 'width'].includes(cleanKey)) {
      const num = parseFloat(cleanVal);
      if (!isNaN(num) && num > 0) lineWidth = num;
    }
  }

  return { color, lineDash, markerSymbol, lineWidth };
}

console.log('--- Starting Comprehensive Color & Style Resolution Test Suite ---');

// Test 1: Single curve inherits ds.color
const ds1 = { color: '#e91e63', selectedY: ['y'], seriesStyles: {} };
assert.strictEqual(resolveCurveColor(ds1, 'y', 0, 0), '#e91e63');
console.log('✅ Test 1: Single curve inherits ds.color');

// Test 2: Panel update immediately updates curve
ds1.color = '#ff9800';
assert.strictEqual(resolveCurveColor(ds1, 'y', 0, 0), '#ff9800');
console.log('✅ Test 2: Panel update to ds.color updates curveColor');

// Test 3: Multi-dataset secondary curve color alignment between PlotCanvas and AxesPanel
const dsA = { color: '#00adb5', selectedY: ['Y1', 'Y2'], seriesStyles: {} };
const dsB = { color: '#ff5722', selectedY: ['Y1', 'Y2'], seriesStyles: {} };
// Dataset 0
assert.strictEqual(resolveCurveColor(dsA, 'Y1', 0, 0), '#00adb5', 'dsA Y1 uses ds.color');
assert.strictEqual(resolveCurveColor(dsA, 'Y2', 1, 0), COLOR_CYCLE[1], 'dsA Y2 uses cycle color 1');
// Dataset 1
assert.strictEqual(resolveCurveColor(dsB, 'Y1', 0, 1), '#ff5722', 'dsB Y1 uses ds.color');
assert.strictEqual(resolveCurveColor(dsB, 'Y2', 1, 1), COLOR_CYCLE[4], 'dsB Y2 uses cycle color 4 (offset by dsIdx)');
console.log('✅ Test 3: Multi-dataset curve colors align consistently with datasetIndex offset');

// Test 4: SeriesStyle override takes precedence
dsB.seriesStyles = { Y2: { color: '#123456' } };
assert.strictEqual(resolveCurveColor(dsB, 'Y2', 1, 1), '#123456');
console.log('✅ Test 4: seriesStyles override takes precedence over cycle color');

// Test 5: hexOrRgbToRgba validation
assert.strictEqual(hexOrRgbToRgba('#ff0000', 0.5), 'rgba(255, 0, 0, 0.5)');
assert.strictEqual(hexOrRgbToRgba('#f00', 0.5), 'rgba(255, 0, 0, 0.5)');
assert.strictEqual(hexOrRgbToRgba('rgb(0, 128, 255)', 0.2), 'rgba(0, 128, 255, 0.2)');
assert.strictEqual(hexOrRgbToRgba('rgba(0, 128, 255, 1)', 0.4), 'rgba(0, 128, 255, 0.4)');
console.log('✅ Test 5: hexOrRgbToRgba correctly parses 3-digit hex, 6-digit hex, rgb, and rgba');

// Test 6: toValidColorHex validation
assert.strictEqual(toValidColorHex('#123456'), '#123456');
assert.strictEqual(toValidColorHex('#abc'), '#aabbcc');
assert.strictEqual(toValidColorHex('invalid', '#00adb5'), '#00adb5');
assert.strictEqual(toValidColorHex('#', '#00adb5'), '#00adb5');
assert.strictEqual(toValidColorHex('', '#00adb5'), '#00adb5');
console.log('✅ Test 6: toValidColorHex normalizes hex and rejects invalid input');

// Test 7: Multi-character comment markers & metadata styling extraction
const metaTest1 = {
  '# COLOR': '#990000',
  '## LINE_STYLE': 'dash',
  '/// MARKER': 'diamond',
  '* WIDTH': '3.5'
};
const style1 = extractStyleFromMetadata(metaTest1, 0);
assert.strictEqual(style1.color, '#990000');
assert.strictEqual(style1.lineDash, 'dash');
assert.strictEqual(style1.markerSymbol, 'diamond');
assert.strictEqual(style1.lineWidth, 3.5);

const metaTest2 = {
  '// LineColor': '#00ff88',
  '% Dash': 'dot'
};
const style2 = extractStyleFromMetadata(metaTest2, 1);
assert.strictEqual(style2.color, '#00ff88');
assert.strictEqual(style2.lineDash, 'dot');
console.log('✅ Test 7: Multi-character comment markers correctly extract color, dash, marker, and width');

console.log('🎉 ALL 7 TEST SUITES PASSED SUCCESSFULLY!');
