import { Dataset, ColumnStats } from '../types';

const PALETTE = [
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
];

/**
 * Intelligent detector for arbitrary delimited data files.
 */
export function parseRawDataFile(
  content: string,
  fileName: string,
  indexOffset = 0,
  overrides?: {
    delimiter?: string;
    skipRows?: number;
    hasHeader?: boolean;
    commentChar?: string;
  }
): Dataset {
  const lines = content.split(/\r?\n/).map((l) => l.trimEnd());
  const metadata: Record<string, string> = {};

  // 1. Identify comment / preamble lines
  let headerRowIndex = 0;
  const commentRegex = /^(#|\/\/|!|%|;|\*)/;

  for (let i = 0; i < Math.min(lines.length, 50); i++) {
    const line = lines[i].trim();
    if (!line) {
      headerRowIndex++;
      continue;
    }
    if (commentRegex.test(line)) {
      // Extract key: value if present
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

  if (overrides?.skipRows !== undefined) {
    headerRowIndex = overrides.skipRows;
  }

  // 2. Delimiter Sniffing from data rows
  let detectedDelimiter = ',';
  if (overrides?.delimiter && overrides.delimiter !== 'auto') {
    detectedDelimiter = overrides.delimiter;
  } else {
    // Sample non-empty rows after headerRowIndex
    const candidateLines = lines
      .slice(headerRowIndex, headerRowIndex + 20)
      .filter((l) => l.trim().length > 0 && !commentRegex.test(l.trim()));

    if (candidateLines.length > 0) {
      const counts = {
        tab: candidateLines.reduce((acc, l) => acc + (l.match(/\t/g) || []).length, 0),
        comma: candidateLines.reduce((acc, l) => acc + (l.match(/,/g) || []).length, 0),
        semicolon: candidateLines.reduce((acc, l) => acc + (l.match(/;/g) || []).length, 0),
        space: candidateLines.reduce((acc, l) => acc + (l.match(/\s+/g) || []).length, 0),
        pipe: candidateLines.reduce((acc, l) => acc + (l.match(/\|/g) || []).length, 0),
      };

      if (counts.tab > candidateLines.length * 0.8) detectedDelimiter = '\t';
      else if (counts.comma > candidateLines.length * 0.8) detectedDelimiter = ',';
      else if (counts.semicolon > candidateLines.length * 0.8) detectedDelimiter = ';';
      else if (counts.pipe > candidateLines.length * 0.8) detectedDelimiter = '|';
      else if (counts.space > candidateLines.length * 0.8) detectedDelimiter = ' ';
      else detectedDelimiter = ',';
    }
  }

  // 3. Split lines using delimiter
  const splitLine = (l: string): string[] => {
    if (detectedDelimiter === ' ') {
      return l.trim().split(/\s+/);
    }
    return l.split(detectedDelimiter).map((c) => c.trim());
  };

  const rawRows: string[][] = [];
  for (let i = headerRowIndex; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l || commentRegex.test(l)) continue;
    rawRows.push(splitLine(l));
  }

  if (rawRows.length === 0) {
    // Empty file fallback
    return createEmptyDataset(fileName, content, indexOffset);
  }

  // 4. Check if first row is header or numeric data
  const firstRow = rawRows[0];
  const isFirstRowAllNumbers = firstRow.every((val) => !isNaN(parseFloat(val)) && isFinite(Number(val)));

  let columnNames: string[] = [];
  let dataRowsStart = 0;

  if (isFirstRowAllNumbers) {
    // No text header -> generate Col 1, Col 2, ...
    columnNames = firstRow.map((_, i) => (i === 0 ? 'X' : i === 1 ? 'Y' : `Series ${i}`));
    dataRowsStart = 0;
  } else {
    // First row is header names
    columnNames = firstRow.map((c, i) => c || `Col ${i + 1}`);
    dataRowsStart = 1;
  }

  // 5. Parse data rows into column arrays
  const data: Record<string, (number | string | null)[]> = {};
  const columnTypes: Record<string, 'number' | 'string'> = {};
  const stats: Record<string, ColumnStats> = {};

  columnNames.forEach((col) => {
    data[col] = [];
  });

  const numericCounts: Record<string, number> = {};
  columnNames.forEach((col) => (numericCounts[col] = 0));

  for (let r = dataRowsStart; r < rawRows.length; r++) {
    const row = rawRows[r];
    for (let c = 0; c < columnNames.length; c++) {
      const col = columnNames[c];
      const valStr = row[c] ?? '';
      if (valStr === '' || valStr.toLowerCase() === 'nan' || valStr.toLowerCase() === 'null') {
        data[col].push(null);
      } else {
        const numVal = parseFloat(valStr);
        if (!isNaN(numVal) && isFinite(numVal)) {
          data[col].push(numVal);
          numericCounts[col]++;
        } else {
          data[col].push(valStr);
        }
      }
    }
  }

  const validRowCount = rawRows.length - dataRowsStart;

  // 6. Infer Column Types & Compute Stats
  columnNames.forEach((col) => {
    const numCount = numericCounts[col];
    const isNumeric = numCount > validRowCount * 0.5;
    columnTypes[col] = isNumeric ? 'number' : 'string';

    if (isNumeric) {
      const nums = data[col].filter((v): v is number => typeof v === 'number');
      if (nums.length > 0) {
        const min = Math.min(...nums);
        const max = Math.max(...nums);
        const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
        stats[col] = { min, max, mean, count: nums.length };
      } else {
        stats[col] = { min: null, max: null, mean: null, count: 0 };
      }
    } else {
      stats[col] = { min: null, max: null, mean: null, count: data[col].length };
    }
  });

  // 7. Auto-guess best X column and Y columns
  const numericCols = columnNames.filter((c) => columnTypes[c] === 'number');
  let selectedX = numericCols[0] || columnNames[0] || '';
  
  // Prefer obvious X-axis names
  const xKeywords = ['x', 'time', 'wavelength', 'twotheta', '2theta', 'theta', 'angle', 'q', 'wavenumber', 'energy', 't', 'freq', 'index'];
  const matchedX = numericCols.find((col) => xKeywords.some((kw) => col.toLowerCase().includes(kw)));
  if (matchedX) {
    selectedX = matchedX;
  }

  // Y columns: all numeric columns except the selected X
  let selectedY = numericCols.filter((col) => col !== selectedX);
  if (selectedY.length === 0 && numericCols.length > 0) {
    selectedY = [numericCols[0]];
  }

  const datasetId = `ds_${Date.now()}_${indexOffset}`;
  const color = PALETTE[indexOffset % PALETTE.length];

  return {
    id: datasetId,
    name: fileName.replace(/\.[^/.]+$/, ''),
    fileName,
    rawText: content,
    columns: columnNames,
    columnTypes,
    data,
    rowCount: validRowCount,
    stats,
    metadata,
    detectedDelimiter,
    headerRowIndex,
    selectedX,
    selectedY,
    color,
    markerSymbol: 'circle',
    markerSize: 6,
    lineDash: 'solid',
    isVisible: true,
    opacity: 1.0,
    lineWidth: 2.0,
    plotStyle: 'lines',
    yOffset: 0,
    yMultiplier: 1,
    loaderId: 'universal',
    loaderParams: {},
    activeTransforms: [],
    transformParams: {
      normalize: { min: 0, max: 1 },
      smooth: { window: 5 }
    },
  };
}

function createEmptyDataset(fileName: string, content: string, indexOffset: number): Dataset {
  return {
    id: `ds_${Date.now()}_${indexOffset}`,
    name: fileName,
    fileName,
    rawText: content,
    columns: ['X', 'Y'],
    columnTypes: { X: 'number', Y: 'number' },
    data: { X: [], Y: [] },
    rowCount: 0,
    stats: {
      X: { min: null, max: null, mean: null, count: 0 },
      Y: { min: null, max: null, mean: null, count: 0 },
    },
    metadata: {},
    detectedDelimiter: ',',
    headerRowIndex: 0,
    selectedX: 'X',
    selectedY: ['Y'],
    color: PALETTE[indexOffset % PALETTE.length],
    markerSymbol: 'circle',
    markerSize: 6,
    lineDash: 'solid',
    isVisible: true,
    opacity: 1.0,
    lineWidth: 2.0,
    plotStyle: 'lines',
    yOffset: 0,
    yMultiplier: 1,
    loaderId: 'universal',
    loaderParams: {},
    activeTransforms: [],
    transformParams: {
      normalize: { min: 0, max: 1 },
      smooth: { window: 5 }
    },
  };
}
