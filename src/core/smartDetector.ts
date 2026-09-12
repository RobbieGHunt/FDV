import { Dataset, ColumnStats, LineDashStyle, MarkerSymbol } from '../types';
import { COLOR_CYCLE } from './colors';
import { computeColumnStats } from './mathUtils';

/**
 * Intelligent detector for arbitrary delimited data files.
 */
export function parseRawDataFile(
  content: string,
  fileName: string,
  indexOffset = 0,
  overrides?:
    | {
        delimiter?: string;
        skipRows?: number;
        hasHeader?: boolean;
        commentChar?: string;
      }
    | string,
  filePath?: string
): Dataset {
  const actualFilePath = typeof overrides === 'string' ? overrides : filePath;
  const actualOverrides = typeof overrides === 'object' ? overrides : undefined;
  const lines = content.split(/\r?\n/).map((l) => l.trimEnd());
  const metadata: Record<string, string> = {};

  // 1. Identify comment / preamble lines (supporting #, ##, //, ///, !, %, =, ;, *)
  let headerRowIndex = 0;
  const commentRegex = /^(?:#+|\/{2,}|!+|%+|=+|;+|\*+)\s*/;


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

  if (actualOverrides?.skipRows !== undefined) {
    headerRowIndex = actualOverrides.skipRows;
  }

  // 2. Delimiter Sniffing from data rows
  let detectedDelimiter = ',';
  if (actualOverrides?.delimiter && actualOverrides.delimiter !== 'auto') {
    detectedDelimiter = actualOverrides.delimiter;
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
      stats[col] = computeColumnStats(data[col]);
    } else {
      stats[col] = { min: null, max: null, mean: null, count: data[col].length };
    }
  });

  // 7. Auto-guess best X column, Y columns, and Error columns
  const numericCols = columnNames.filter((c) => columnTypes[c] === 'number');
  let selectedX = numericCols[0] || columnNames[0] || '';
  
  // Prefer obvious X-axis names
  const xKeywords = ['x', 'time', 'wavelength', 'twotheta', '2theta', 'theta', 'angle', 'q', 'wavenumber', 'energy', 't', 'freq', 'index'];
  const matchedX = numericCols.find((col) => xKeywords.some((kw) => col.toLowerCase() === kw || col.toLowerCase().startsWith(kw + '_') || col.toLowerCase().includes(kw)));
  if (matchedX) {
    selectedX = matchedX;
  }

  // Detect error/uncertainty columns
  const errKeywords = ['err', 'error', 'std', 'sigma', 'uncertainty', 'sd', '+-', 'delta'];
  const errorCols = numericCols.filter((col) =>
    col !== selectedX && errKeywords.some((kw) => col.toLowerCase().includes(kw))
  );

  // Y columns: numeric columns excluding selected X and auto-detected error columns
  let candidateY = numericCols.filter((col) => col !== selectedX && !errorCols.includes(col));
  if (candidateY.length === 0) {
    candidateY = numericCols.filter((col) => col !== selectedX);
  }
  let selectedY = candidateY.length > 0 ? candidateY : [numericCols[0] || 'Y'];

  // Map error columns to primary Y curves
  const yErrorMap: Record<string, { yErrCol?: string | null; xErrCol?: string | null }> = {};
  let defaultYErrCol: string | null = null;
  let defaultXErrCol: string | null = null;

  const xErrMatch = errorCols.find((ec) => ec.toLowerCase().includes('x_') || ec.toLowerCase().includes('_x') || ec.toLowerCase() === 'dx');
  if (xErrMatch) {
    defaultXErrCol = xErrMatch;
  }

  selectedY.forEach((yCol) => {
    const exactMatch = errorCols.find((ec) =>
      ec.toLowerCase().includes(yCol.toLowerCase()) && ec !== xErrMatch
    );
    const genericMatch = errorCols.find((ec) => ec !== xErrMatch);
    const matchedErr = exactMatch || (errorCols.length === 1 ? genericMatch : null);
    if (matchedErr) {
      yErrorMap[yCol] = { yErrCol: matchedErr, xErrCol: defaultXErrCol };
      if (!defaultYErrCol) defaultYErrCol = matchedErr;
    }
  });

  const datasetId = `ds_${Date.now()}_${indexOffset}`;
  let color = COLOR_CYCLE[indexOffset % COLOR_CYCLE.length];
  let lineDash: LineDashStyle = 'solid';
  let markerSymbol: MarkerSymbol = 'circle';
  let lineWidth = 2.0;

  // Extract plot style attributes if present in file metadata comments (e.g. # COLOR: #ff0000, ## Line Color: blue)
  for (const [metaKey, metaVal] of Object.entries(metadata)) {
    const cleanKey = metaKey.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanVal = metaVal.trim();
    if (['color', 'linecolor', 'curvecolor'].includes(cleanKey) && cleanVal) {
      color = cleanVal;
    } else if (['linedash', 'linestyle', 'dash'].includes(cleanKey)) {
      if (['solid', 'dash', 'dot', 'dashdot'].includes(cleanVal.toLowerCase())) {
        lineDash = cleanVal.toLowerCase() as LineDashStyle;
      }
    } else if (['marker', 'markersymbol', 'symbol'].includes(cleanKey)) {
      if (
        ['circle', 'square', 'diamond', 'cross', 'x', 'triangle-up', 'triangle-down', 'star'].includes(
          cleanVal.toLowerCase()
        )
      ) {
        markerSymbol = cleanVal.toLowerCase() as MarkerSymbol;
      }
    } else if (['linewidth', 'width'].includes(cleanKey)) {
      const num = parseFloat(cleanVal);
      if (!isNaN(num) && num > 0) lineWidth = num;
    }
  }


  return {
    id: datasetId,
    name: fileName.replace(/\.[^/.]+$/, ''),
    fileName,
    filePath: actualFilePath,
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
    markerSymbol,
    markerSize: 6,
    lineDash,
    isVisible: true,
    opacity: 1.0,
    lineWidth,
    plotStyle: 'lines',

    yOffset: 0,
    yMultiplier: 1,

    // Error Bar & Uncertainty settings
    yErrorColumn: defaultYErrCol,
    xErrorColumn: defaultXErrCol,
    yErrorMap,
    errorDisplayStyle: 'bars',
    errorCapSize: 4,
    errorThickness: 1.5,
    errorBandOpacity: 0.20,
    errorCustomColor: null,

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
    color: COLOR_CYCLE[indexOffset % COLOR_CYCLE.length],
    markerSymbol: 'circle',
    markerSize: 6,
    lineDash: 'solid',
    isVisible: true,
    opacity: 1.0,
    lineWidth: 2.0,
    plotStyle: 'lines',
    yOffset: 0,
    yMultiplier: 1,

    // Error Bar & Uncertainty settings
    yErrorColumn: null,
    xErrorColumn: null,
    yErrorMap: {},
    errorDisplayStyle: 'bars',
    errorCapSize: 4,
    errorThickness: 1.5,
    errorBandOpacity: 0.20,
    errorCustomColor: null,

    loaderId: 'universal',
    loaderParams: {},
    activeTransforms: [],
    transformParams: {
      normalize: { min: 0, max: 1 },
      smooth: { window: 5 }
    },
  };
}
