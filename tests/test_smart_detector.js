const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Simple JS implementation test of smart detection logic
function parseRawDataFile(content, fileName) {
  const lines = content.split(/\r?\n/).map((l) => l.trimEnd());
  const metadata = {};
  let headerRowIndex = 0;
  const commentRegex = /^(#|\/\/|!|%|;|\*)/;

  for (let i = 0; i < Math.min(lines.length, 50); i++) {
    const line = lines[i].trim();
    if (!line) {
      headerRowIndex++;
      continue;
    }
    if (commentRegex.test(line)) {
      const cleanComment = line.replace(commentRegex, '').trim();
      const colonIdx = cleanComment.indexOf(':');
      if (colonIdx > 0) {
        const k = cleanComment.substring(0, colonIdx).trim();
        const v = cleanComment.substring(colonIdx + 1).trim();
        if (k && v) metadata[k] = v;
      }
      headerRowIndex = i + 1;
    } else {
      break;
    }
  }

  // Sniff delimiter
  const candidateLines = lines
    .slice(headerRowIndex, headerRowIndex + 20)
    .filter((l) => l.trim().length > 0 && !commentRegex.test(l.trim()));

  let detectedDelimiter = ',';
  if (candidateLines.length > 0) {
    const counts = {
      tab: candidateLines.reduce((acc, l) => acc + (l.match(/\t/g) || []).length, 0),
      comma: candidateLines.reduce((acc, l) => acc + (l.match(/,/g) || []).length, 0),
      semicolon: candidateLines.reduce((acc, l) => acc + (l.match(/;/g) || []).length, 0),
      space: candidateLines.reduce((acc, l) => acc + (l.match(/\s+/g) || []).length, 0),
    };

    if (counts.tab > candidateLines.length * 0.8) detectedDelimiter = '\t';
    else if (counts.comma > candidateLines.length * 0.8) detectedDelimiter = ',';
    else if (counts.semicolon > candidateLines.length * 0.8) detectedDelimiter = ';';
    else if (counts.space > candidateLines.length * 0.8) detectedDelimiter = ' ';
  }

  const splitLine = (l) => {
    if (detectedDelimiter === ' ') return l.trim().split(/\s+/);
    return l.split(detectedDelimiter).map((c) => c.trim());
  };

  const rawRows = [];
  for (let i = headerRowIndex; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l || commentRegex.test(l)) continue;
    rawRows.push(splitLine(l));
  }

  const firstRow = rawRows[0] || [];
  const isFirstRowAllNumbers = firstRow.every((val) => !isNaN(parseFloat(val)) && isFinite(Number(val)));
  let columnNames = [];
  let dataRowsStart = 0;

  if (isFirstRowAllNumbers) {
    columnNames = firstRow.map((_, i) => (i === 0 ? 'X' : i === 1 ? 'Y' : `Series ${i}`));
    dataRowsStart = 0;
  } else {
    columnNames = firstRow.map((c, i) => c || `Col ${i + 1}`);
    dataRowsStart = 1;
  }

  return {
    fileName,
    detectedDelimiter,
    columnNames,
    metadata,
    rowCount: rawRows.length - dataRowsStart,
  };
}

console.log('--- Testing Smart Auto-Detector on Sample Files ---');

// Test 1: Basic CSV
const csvPath = path.join(__dirname, '../../data/sample_data_basic.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const csvRes = parseRawDataFile(csvContent, 'sample_data_basic.csv');
console.log('CSV Result:', csvRes);
assert.strictEqual(csvRes.detectedDelimiter, ',');
assert.deepStrictEqual(csvRes.columnNames, ['x', 'y']);
assert.strictEqual(csvRes.rowCount, 64);

// Test 2: Spectroscopy with # comments & tabs
const specPath = path.join(__dirname, '../../data/sample_spectra.txt');
const specContent = fs.readFileSync(specPath, 'utf-8');
const specRes = parseRawDataFile(specContent, 'sample_spectra.txt');
console.log('Spectra Result:', specRes);
assert.strictEqual(specRes.detectedDelimiter, '\t');
assert.strictEqual(specRes.metadata['INSTRUMENT'], 'UV-Vis Demo-Spectrometer (Synthetic Model)');
assert.strictEqual(specRes.metadata['DUMMY_METADATA'], 'Synthetic Benchmark Demo Data');
assert.strictEqual(specRes.rowCount, 31);

// Test 3: XRR Space-delimited XY file
const xrrPath = path.join(__dirname, '../../data/sample_XRR.xy');
const xrrContent = fs.readFileSync(xrrPath, 'utf-8');
const xrrRes = parseRawDataFile(xrrContent, 'sample_XRR.xy');
console.log('XRR Result:', xrrRes);
assert.strictEqual(xrrRes.detectedDelimiter, ' ');
assert.deepStrictEqual(xrrRes.columnNames, ['X', 'Y']);
assert.strictEqual(xrrRes.rowCount, 980);

console.log('✅ ALL AUTO-DETECTION TESTS PASSED SUCCESSFULLY!');
