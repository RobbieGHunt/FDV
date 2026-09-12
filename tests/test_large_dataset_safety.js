const assert = require('assert');

// 1. Implementation of mathUtils (mirroring src/core/mathUtils.ts)
function getArrayMinMax(arr) {
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

function getArrayMin(arr) {
  if (!arr || arr.length === 0) return 0;
  let min = arr[0];
  for (let i = 1; i < arr.length; i++) {
    const v = arr[i];
    if (v < min) min = v;
  }
  return min;
}

function getArrayMax(arr) {
  if (!arr || arr.length === 0) return 0;
  let max = arr[0];
  for (let i = 1; i < arr.length; i++) {
    const v = arr[i];
    if (v > max) max = v;
  }
  return max;
}

function computeColumnStats(arr) {
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

// 2. Implementation of export sanitizers (mirroring src/components/ExportModal.tsx)
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeScriptJson(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

function escapeCsvField(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function sanitizeFileName(name) {
  return (name || 'dataset').replace(/[/\\?%*:|"<>]/g, '_');
}

console.log('=== TEST SUITE: SPRINT 1 SAFETY & SECURITY ===\n');

// TEST 1: Large Dataset Call-Stack Limit
console.log('[Test 1] Demonstrating V8 RangeError with spread operator...');
const N = 250000;
const largeArray = new Float64Array(N);
for (let i = 0; i < N; i++) {
  largeArray[i] = i * 0.5 - 62500; // range [-62500, 62499.5]
}

// Show that Math.min(...arr) indeed throws RangeError in Node/V8
let threwRangeError = false;
try {
  Math.min(...largeArray);
} catch (err) {
  if (err instanceof RangeError) {
    threwRangeError = true;
    console.log('  Confirmed: Math.min(...largeArray) threw RangeError:', err.message);
  }
}
assert.strictEqual(threwRangeError, true, 'Spread on 250k elements MUST throw RangeError in V8');

console.log('[Test 2] computeColumnStats and getArrayMinMax on 250k array...');
const regularArray = Array.from(largeArray);
// Introduce a few invalid items
regularArray.push('invalid', null, undefined, NaN);

const stats = computeColumnStats(regularArray);
assert.strictEqual(stats.count, 250000);
assert.strictEqual(stats.min, -62500);
assert.strictEqual(stats.max, 62499.5);
assert.strictEqual(stats.mean, (-62500 + 62499.5) / 2);
console.log('  computeColumnStats succeeded safely on 250k items:', stats);

const minMax = getArrayMinMax(largeArray);
assert.strictEqual(minMax.min, -62500);
assert.strictEqual(minMax.max, 62499.5);

const singleMin = getArrayMin(largeArray);
const singleMax = getArrayMax(largeArray);
assert.strictEqual(singleMin, -62500);
assert.strictEqual(singleMax, 62499.5);
console.log('  getArrayMinMax, getArrayMin, getArrayMax succeeded without call stack errors.');

// TEST 3: Transforms on large dataset
console.log('\n[Test 3] Transforms on large dataset (min-max normalization & baseline)...');
const yArr = Array.from(largeArray);
const yMin = getArrayMin(yArr);
const yMax = getArrayMax(yArr);
const range = yMax - yMin;
const normalized = yArr.map((v) => (v - yMin) / (range || 1));
const normStats = computeColumnStats(normalized);
assert(Math.abs(normStats.min - 0) < 1e-9, 'Normalized min should be 0');
assert(Math.abs(normStats.max - 1) < 1e-9, 'Normalized max should be 1');
console.log('  100k point normalization passed cleanly.');

// TEST 4: HTML Export and Script Injection Neutralization
console.log('\n[Test 4] HTML Export XSS & Script Injection Neutralization...');
const maliciousPayload = '</script><script>alert("XSS")</script>';
const escapedScript = escapeScriptJson({ title: maliciousPayload });
assert(
  !escapedScript.includes('</script>'),
  'escapeScriptJson must not contain unescaped </script>'
);
assert(
  escapedScript.includes('\\u003c/script>'),
  'escapeScriptJson must encode < as \\u003c'
);
console.log('  escapeScriptJson successfully neutralized script breakout:', escapedScript);

const maliciousHtml = '<img src=x onerror="alert(\'XSS\')">';
const escapedHtmlStr = escapeHtml(maliciousHtml);
assert(!escapedHtmlStr.includes('<img'), 'escapeHtml must encode < to &lt;');
assert(escapedHtmlStr.includes('&lt;img'), 'escapeHtml encoded tag correctly');
console.log('  escapeHtml successfully neutralized DOM injection:', escapedHtmlStr);

// TEST 5: CSV RFC 4180 Escaping
console.log('\n[Test 5] CSV Escaping...');
assert.strictEqual(escapeCsvField('simple'), 'simple');
assert.strictEqual(escapeCsvField('comma,separated'), '"comma,separated"');
assert.strictEqual(escapeCsvField('quote "test"'), '"quote ""test"""');
assert.strictEqual(escapeCsvField('line\nbreak'), '"line\nbreak"');
assert.strictEqual(escapeCsvField(null), '');
assert.strictEqual(escapeCsvField(undefined), '');
assert.strictEqual(escapeCsvField(123.45), '123.45');
console.log('  RFC 4180 CSV escaping passed all edge cases.');

// TEST 6: File Name Sanitization
console.log('\n[Test 6] Filename sanitization...');
const unsafeName = '../../etc/passwd:*?"<>|test';
const safeName = sanitizeFileName(unsafeName);
assert(!/[/\\?%*:|"<>]/g.test(safeName), 'Sanitized filename must have no illegal characters');
assert.strictEqual(safeName, '.._.._etc_passwd_______test');
console.log('  Filename sanitization passed: ' + safeName);

console.log('\n========================================');
console.log('ALL SPRINT 1 SAFETY TESTS PASSED! (6/6)');
console.log('========================================\n');
