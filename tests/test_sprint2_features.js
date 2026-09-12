const assert = require('assert');

// 1. CSV Escaping and Filename Sanitization (mirroring src/core/mathUtils.ts)
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

// 2. Error Column Resolution (mirroring src/components/PlotCanvas.tsx)
function resolveErrorColumns(ds, yCol) {
  const yErrCol =
    ds.yErrorMap?.[yCol]?.yErrCol !== undefined
      ? ds.yErrorMap[yCol]?.yErrCol
      : ds.selectedY.length === 1
      ? ds.yErrorColumn
      : null;
  const xErrCol =
    ds.yErrorMap?.[yCol]?.xErrCol !== undefined
      ? ds.yErrorMap[yCol]?.xErrCol
      : ds.selectedY.length === 1
      ? ds.xErrorColumn
      : null;
  return { yErrCol, xErrCol };
}

// 3. Click resolution logic (mirroring PlotCanvas onClick)
function handlePlotClick(eventPoint, activeDatasetId, onSelectDataset, onSelectPoint) {
  if (!eventPoint || !eventPoint.data) return false;
  const meta = eventPoint.data.meta;
  if (meta?.isCursorTrace || !meta?.isDataTrace) {
    return false; // ignored
  }
  const clickedDsId = meta?.datasetId;
  if (clickedDsId && onSelectDataset && clickedDsId !== activeDatasetId) {
    onSelectDataset(clickedDsId);
  }
  const ptIdx = eventPoint.pointIndex ?? eventPoint.pointNumber;
  if (typeof ptIdx === 'number') {
    onSelectPoint(ptIdx);
    return true;
  }
  return false;
}

console.log('=== TEST SUITE: SPRINT 2 FEATURES & LOGIC ===\n');

// TEST 1: Multi-curve Error Isolation
console.log('[Test 1] Multi-curve error column isolation...');
const multiCurveDataset = {
  id: 'ds-multi',
  selectedX: 'Time',
  selectedY: ['SignalA', 'SignalB'],
  yErrorColumn: 'GlobalErr_ShouldNotLeak',
  xErrorColumn: null,
  yErrorMap: {
    SignalA: { yErrCol: 'ErrA', xErrCol: null },
  },
};

const resA = resolveErrorColumns(multiCurveDataset, 'SignalA');
assert.strictEqual(resA.yErrCol, 'ErrA', 'SignalA must have ErrA');

const resB = resolveErrorColumns(multiCurveDataset, 'SignalB');
assert.strictEqual(
  resB.yErrCol,
  null,
  'SignalB must NOT inherit ErrA or fall back to yErrorColumn when multiple curves exist'
);
console.log('  Multi-curve error isolation verified: SignalB does not inherit SignalA error.');

// TEST 2: Single-curve Backward Compatibility
console.log('\n[Test 2] Single-curve backward compatibility...');
const singleCurveDataset = {
  id: 'ds-single',
  selectedX: 'Time',
  selectedY: ['SignalOnly'],
  yErrorColumn: 'LegacyErr',
  xErrorColumn: 'LegacyXErr',
};
const resSingle = resolveErrorColumns(singleCurveDataset, 'SignalOnly');
assert.strictEqual(resSingle.yErrCol, 'LegacyErr', 'Single curve falls back to yErrorColumn');
assert.strictEqual(resSingle.xErrCol, 'LegacyXErr', 'Single curve falls back to xErrorColumn');
console.log('  Single-curve backward compatibility verified.');

// TEST 3: ContextMenu CSV Generation & Sanitized Filename
console.log('\n[Test 3] ContextMenu CSV generation and sanitized filename...');
const sampleDataset = {
  name: 'Sample/Experiment:01*Test',
  columns: ['Header,WithComma', 'Header"WithQuote', 'Plain'],
  rowCount: 2,
  data: {
    'Header,WithComma': ['val1,a', 'val2,b'],
    'Header"WithQuote': ['val"1"', 'val"2"'],
    'Plain': [10.5, 20.7],
  },
};

const cols = sampleDataset.columns;
const header = cols.map(escapeCsvField).join(',');
const rows = [];
for (let i = 0; i < sampleDataset.rowCount; i++) {
  rows.push(cols.map((c) => escapeCsvField(sampleDataset.data[c]?.[i] ?? '')).join(','));
}
const csvOutput = [header, ...rows].join('\n');

assert(csvOutput.includes('"Header,WithComma"'));
assert(csvOutput.includes('"Header""WithQuote"'));
assert(csvOutput.includes('"val1,a"'));
assert(csvOutput.includes('"val""1"""'));
assert(csvOutput.includes('10.5'));

const safeDownloadName = sanitizeFileName(sampleDataset.name);
assert.strictEqual(safeDownloadName, 'Sample_Experiment_01_Test');
console.log('  ContextMenu CSV export output and filename safely formatted.');

// TEST 4: Selection Click Event Dispatching
console.log('\n[Test 4] Selection click event handling...');
let selectedDs = null;
let selectedPt = null;

const onSelectDataset = (id) => { selectedDs = id; };
const onSelectPoint = (idx) => { selectedPt = idx; };

// Case 1: Clicking the cursor marker itself -> ignored
const cursorClickPoint = {
  pointIndex: 0,
  data: {
    meta: { isCursorTrace: true },
  },
};
const cursorHandled = handlePlotClick(cursorClickPoint, 'ds-1', onSelectDataset, onSelectPoint);
assert.strictEqual(cursorHandled, false, 'Clicking on cursor must be ignored');
assert.strictEqual(selectedPt, null);

// Case 2: Clicking on Curve of Active Dataset
const activeCurvePoint = {
  pointIndex: 42,
  data: {
    meta: { datasetId: 'ds-1', isDataTrace: true },
  },
};
const activeHandled = handlePlotClick(activeCurvePoint, 'ds-1', onSelectDataset, onSelectPoint);
assert.strictEqual(activeHandled, true);
assert.strictEqual(selectedPt, 42);
assert.strictEqual(selectedDs, null, 'No dataset change needed when already active');

// Case 3: Clicking on Curve of Inactive Dataset
const inactiveCurvePoint = {
  pointIndex: 88,
  data: {
    meta: { datasetId: 'ds-2', isDataTrace: true },
  },
};
const inactiveHandled = handlePlotClick(inactiveCurvePoint, 'ds-1', onSelectDataset, onSelectPoint);
assert.strictEqual(inactiveHandled, true);
assert.strictEqual(selectedDs, 'ds-2', 'Must switch active dataset to ds-2');
assert.strictEqual(selectedPt, 88, 'Must select point 88');
console.log('  Selection click handling correctly isolates cursor and handles cross-dataset clicks.');

console.log('\n========================================');
console.log('ALL SPRINT 2 TESTS PASSED! (4/4)');
console.log('========================================\n');
