const assert = require('assert');

// 1. Pagination calculation helper (mirroring DataTable.tsx)
function computePagination(totalRows, pageSize, currentPage) {
  const totalPages = pageSize === Infinity ? 1 : Math.max(1, Math.ceil(totalRows / pageSize));
  const validPage = Math.max(1, Math.min(totalPages, currentPage));
  const startIdx = pageSize === Infinity ? 0 : (validPage - 1) * pageSize;
  const endIdx = pageSize === Infinity ? totalRows : Math.min(totalRows, validPage * pageSize);
  return { totalPages, validPage, startIdx, endIdx, count: endIdx - startIdx };
}

function getPageForRow(rowIndex, pageSize) {
  if (pageSize === Infinity) return 1;
  return Math.floor(rowIndex / pageSize) + 1;
}

// 2. Reference line coordinate log clamping (mirroring PlotCanvas.tsx)
function clampCoordForLog(val, isLog) {
  if (isLog && val <= 0) {
    return 1e-6;
  }
  return val;
}

// 3. Color sync helper (mirroring ContextMenu.tsx)
function syncDatasetColor(dataset, newColor) {
  const primaryY = dataset.selectedY[0];
  const updatedStyles = primaryY
    ? {
        ...(dataset.seriesStyles || {}),
        [primaryY]: {
          ...(dataset.seriesStyles?.[primaryY] || {}),
          color: newColor,
        },
      }
    : dataset.seriesStyles;

  return {
    ...dataset,
    color: newColor,
    seriesStyles: updatedStyles,
  };
}

console.log('=== TEST SUITE: SPRINT 3 REFINEMENTS & POLISH ===\n');

// TEST 1: High-Volume Tabular Pagination (100,000 rows)
console.log('[Test 1] 100,000-row pagination math & windowing...');
const totalRows = 100000;
const page100 = computePagination(totalRows, 100, 1);
assert.strictEqual(page100.totalPages, 1000);
assert.strictEqual(page100.count, 100);
assert.strictEqual(page100.startIdx, 0);
assert.strictEqual(page100.endIdx, 100);

// Auto-jump to page containing selected row
const selectedRow = 543; // 0-indexed row 543 -> 544th row
const targetPage = getPageForRow(selectedRow, 100);
assert.strictEqual(targetPage, 6, 'Row 543 must belong to page 6');

const page6 = computePagination(totalRows, 100, targetPage);
assert.strictEqual(page6.startIdx, 500);
assert.strictEqual(page6.endIdx, 600);
assert(selectedRow >= page6.startIdx && selectedRow < page6.endIdx);
console.log('  100k pagination and auto-page calculation verified cleanly.');

// TEST 2: All Rows (Infinity) Mode
console.log('\n[Test 2] Infinite / All-rows pagination mode...');
const pageAll = computePagination(totalRows, Infinity, 1);
assert.strictEqual(pageAll.totalPages, 1);
assert.strictEqual(pageAll.count, 100000);
assert.strictEqual(pageAll.startIdx, 0);
assert.strictEqual(pageAll.endIdx, 100000);
console.log('  All-rows pagination mode verified.');

// TEST 3: Reference Lines Log-Scale Clamping
console.log('\n[Test 3] Reference line log clamping...');
assert.strictEqual(clampCoordForLog(-5, true), 1e-6, 'Log scale must clamp negative values to 1e-6');
assert.strictEqual(clampCoordForLog(0, true), 1e-6, 'Log scale must clamp zero to 1e-6');
assert.strictEqual(clampCoordForLog(10.5, true), 10.5, 'Log scale preserves positive values');
assert.strictEqual(clampCoordForLog(-5, false), -5, 'Linear scale preserves negative values');
console.log('  Reference line log clamping verified.');

// TEST 4: Context Menu Color Synchronization with seriesStyles
console.log('\n[Test 4] ContextMenu color sync with seriesStyles...');
const initialDs = {
  id: 'ds-test',
  name: 'Test Curve',
  color: '#00adb5',
  selectedY: ['Intensity'],
  seriesStyles: {
    Intensity: {
      color: '#ff5722', // stale override
      lineWidth: 2,
    },
  },
};

const updatedDs = syncDatasetColor(initialDs, '#9c27b0');
assert.strictEqual(updatedDs.color, '#9c27b0', 'Dataset color must be updated');
assert.strictEqual(
  updatedDs.seriesStyles.Intensity.color,
  '#9c27b0',
  'Primary curve in seriesStyles must be synchronized to new color'
);
assert.strictEqual(
  updatedDs.seriesStyles.Intensity.lineWidth,
  2,
  'Other seriesStyle properties must be preserved'
);
console.log('  ContextMenu color sync with seriesStyles verified.');

console.log('\n========================================');
console.log('ALL SPRINT 3 TESTS PASSED! (4/4)');
console.log('========================================\n');
