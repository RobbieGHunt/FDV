import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Download,
  FileSpreadsheet,
  ArrowUpDown,
  Trash2,
  Edit2,
  Check,
  X,
  Target,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Dataset, ThemeMode, ColumnStats } from '../types';
import { computeColumnStats, escapeCsvField, sanitizeFileName } from '../core/mathUtils';

interface DataTableProps {
  datasets: Dataset[];
  activeDatasetId: string | null;
  selectedPointIndex: number | null;
  onSelectPoint: (index: number | null) => void;
  onUpdateDataset: (id: string, updates: Partial<Dataset>) => void;
  theme: ThemeMode;
  onSelectDataset: (id: string) => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  datasets,
  activeDatasetId,
  selectedPointIndex,
  onSelectPoint,
  onUpdateDataset,
  theme,
  onSelectDataset,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination state for high-volume performance (prevents 100k DOM allocations)
  const [pageSize, setPageSize] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; col: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  const currentDataset = datasets.find((d) => d.id === activeDatasetId) || datasets[0] || null;

  // Compute full table rows (Infinite scrolling, no pagination limit)
  const filteredRows = useMemo(() => {
    if (!currentDataset) return [];

    const cols = currentDataset.columns;
    const len = currentDataset.rowCount;
    const rows: { _origIdx: number; [key: string]: any }[] = [];

    for (let i = 0; i < len; i++) {
      const row: { _origIdx: number; [key: string]: any } = { _origIdx: i };
      cols.forEach((col) => {
        row[col] = currentDataset.data[col]?.[i] ?? '';
      });
      rows.push(row);
    }

    // Filter
    let res = rows;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      res = res.filter((r) =>
        cols.some((c) => String(r[c]).toLowerCase().includes(term))
      );
    }

    // Sort
    if (sortColumn) {
      res.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        return sortDirection === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return res;
  }, [currentDataset, searchTerm, sortColumn, sortDirection]);

  // Total pages and paginated slice for windowed rendering
  const totalPages = pageSize === Infinity ? 1 : Math.max(1, Math.ceil(filteredRows.length / pageSize));

  // Reset page when dataset or search filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [currentDataset?.id, searchTerm]);

  // Auto-jump to page containing selected point when selected from plot
  useEffect(() => {
    if (selectedPointIndex !== null && filteredRows.length > 0 && pageSize !== Infinity) {
      const targetIdx = filteredRows.findIndex((r) => r._origIdx === selectedPointIndex);
      if (targetIdx >= 0) {
        const neededPage = Math.floor(targetIdx / pageSize) + 1;
        if (neededPage !== currentPage) {
          setCurrentPage(neededPage);
        }
      }
    }
  }, [selectedPointIndex, filteredRows, pageSize]);

  const paginatedRows = useMemo(() => {
    if (pageSize === Infinity) return filteredRows;
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Scroll to selected point row automatically when cursor moves from plot
  useEffect(() => {
    if (selectedPointIndex !== null && tableContainerRef.current) {
      const targetRow = tableContainerRef.current.querySelector(
        `[data-row-index="${selectedPointIndex}"]`
      ) as HTMLElement | null;
      if (targetRow) {
        targetRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedPointIndex, currentPage]);

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  // 1. In-Memory Cell Editing
  const startEditing = (rowIdx: number, col: string, currentVal: any) => {
    setEditingCell({ rowIdx, col });
    setEditValue(String(currentVal ?? ''));
  };

  const commitCellEdit = () => {
    if (!editingCell || !currentDataset) return;
    const { rowIdx, col } = editingCell;

    const colData = [...(currentDataset.data[col] || [])];
    const parsedNum = parseFloat(editValue);
    const finalVal =
      !isNaN(parsedNum) && isFinite(Number(editValue)) && editValue.trim() !== ''
        ? parsedNum
        : editValue;

    colData[rowIdx] = finalVal;

    // Recalculate stats for the edited column
    const newStats: Record<string, ColumnStats> = {
      ...currentDataset.stats,
      [col]: computeColumnStats(colData),
    };

    const newData = {
      ...currentDataset.data,
      [col]: colData,
    };

    // Update in-memory dataset only — strictly does NOT touch rawText or file on disk
    onUpdateDataset(currentDataset.id, {
      data: newData,
      stats: newStats,
    });

    setEditingCell(null);
  };

  const cancelCellEdit = () => {
    setEditingCell(null);
  };

  // 2. In-Memory Row Deletion
  const handleDeleteRow = (origIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentDataset) return;

    const cols = currentDataset.columns;
    const newData: Record<string, (number | string | null)[]> = {};
    const newStats: Record<string, ColumnStats> = {};

    cols.forEach((col) => {
      const arr = [...(currentDataset.data[col] || [])];
      arr.splice(origIdx, 1);
      newData[col] = arr;
      newStats[col] = computeColumnStats(arr);
    });

    const newRowCount = currentDataset.rowCount - 1;

    // Update in-memory dataset only
    onUpdateDataset(currentDataset.id, {
      data: newData,
      rowCount: newRowCount,
      stats: newStats,
    });

    if (selectedPointIndex === origIdx) {
      onSelectPoint(null);
    } else if (selectedPointIndex !== null && selectedPointIndex > origIdx) {
      onSelectPoint(selectedPointIndex - 1);
    }
  };

  const handleExportCSV = () => {
    if (!currentDataset) return;
    const cols = currentDataset.columns;
    const header = cols.map(escapeCsvField).join(',');
    const rows = filteredRows.map((r) => cols.map((c) => escapeCsvField(r[c])).join(','));
    const fileContent = [header, ...rows].join('\n');
    const blob = new Blob([fileContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = sanitizeFileName(currentDataset.name);
    link.download = `${safeName}_processed.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!currentDataset) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 text-[#6b7280]">
        <FileSpreadsheet className="w-12 h-12 text-[#2e323e] mb-3" />
        <h3 className={`text-base font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>No Data Available</h3>
        <p className={`text-xs ${isDark ? 'text-[#8b949e]' : 'text-slate-500'}`}>Load or drop a dataset to inspect raw and processed tabular rows.</p>
      </div>
    );
  }

  return (
    <div className={`w-full h-full flex flex-col select-text transition-colors duration-200 ${isDark ? 'bg-[#121316]' : 'bg-[#f8fafc]'}`}>
      {/* 1. Header Toolbar */}
      <div className={`h-12 border-b px-4 flex items-center justify-between text-xs select-none ${isDark ? 'bg-[#181a20] border-[#2a2d37]' : 'bg-[#ffffff] border-[#e2e8f0]'}`}>
        {/* Left: Dataset dropdown & Search */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`${isDark ? 'text-[#8b949e]' : 'text-slate-600 font-medium'}`}>Active Dataset:</span>
            <select
              value={currentDataset.id}
              onChange={(e) => onSelectDataset(e.target.value)}
              className={`border rounded-lg px-2.5 py-1 font-medium focus:outline-none ${
                isDark
                  ? 'bg-[#121316] border-[#2a2d37] text-white focus:border-[#00adb5]'
                  : 'bg-white border-[#cbd5e1] text-slate-900 focus:border-[#0284c7]'
              }`}
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.rowCount} rows)
                </option>
              ))}
            </select>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#6b7280] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search table..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-8 pr-3 py-1 border rounded-lg text-xs focus:outline-none ${
                isDark
                  ? 'bg-[#121316] border-[#2a2d37] text-white placeholder-[#555] focus:border-[#00adb5]'
                  : 'bg-white border-[#cbd5e1] text-slate-900 placeholder-slate-400 focus:border-[#0284c7]'
              }`}
            />
          </div>
        </div>

        {/* Right: Info, Pagination & Export */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {selectedPointIndex !== null && (
              <span className={`font-mono text-[11px] px-2 py-0.5 rounded border flex items-center gap-1.5 ${
                isDark ? 'bg-[#00adb5]/10 border-[#00adb5]/40 text-[#00adb5]' : 'bg-sky-50 border-sky-300 text-sky-700 font-medium'
              }`}>
                <Target className="w-3.5 h-3.5" />
                <span>Selected: Row #{selectedPointIndex + 1}</span>
                <button
                  onClick={() => onSelectPoint(null)}
                  className="hover:opacity-70 p-0.5"
                  title="Clear selection"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Pagination Controls */}
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-mono ${
              isDark ? 'bg-[#14161b] border-[#2a2d37] text-[#8b949e]' : 'bg-slate-50 border-[#cbd5e1] text-slate-600'
            }`}>
              <span>Rows/Page:</span>
              <select
                value={pageSize === Infinity ? 'all' : pageSize}
                onChange={(e) => {
                  const val = e.target.value === 'all' ? Infinity : parseInt(e.target.value, 10);
                  setPageSize(val);
                  setCurrentPage(1);
                }}
                className={`bg-transparent border-0 focus:outline-none cursor-pointer font-semibold ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <option value={100} className={isDark ? 'bg-[#181a20]' : 'bg-white'}>100</option>
                <option value={250} className={isDark ? 'bg-[#181a20]' : 'bg-white'}>250</option>
                <option value={500} className={isDark ? 'bg-[#181a20]' : 'bg-white'}>500</option>
                <option value={1000} className={isDark ? 'bg-[#181a20]' : 'bg-white'}>1000</option>
                <option value="all" className={isDark ? 'bg-[#181a20]' : 'bg-white'}>All</option>
              </select>

              {pageSize !== Infinity && totalPages > 1 && (
                <>
                  <span className="opacity-40">|</span>
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-0.5 rounded hover:bg-[#2a2d37] disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <span className="font-semibold text-[10px]">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-0.5 rounded hover:bg-[#2a2d37] disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Next page"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </>
              )}

              <span className="opacity-40">|</span>
              <span>
                {filteredRows.length === 0
                  ? '0 rows'
                  : `${pageSize === Infinity ? 1 : Math.min(filteredRows.length, (currentPage - 1) * pageSize + 1)}–${
                      pageSize === Infinity ? filteredRows.length : Math.min(filteredRows.length, currentPage * pageSize)
                    } of ${filteredRows.length}`}
              </span>
            </div>
          </div>

          <button
            onClick={handleExportCSV}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md border transition-colors ${
              isDark
                ? 'bg-[#242731] hover:bg-[#2e323e] text-white border-[#3a3f4d]'
                : 'bg-white hover:bg-slate-100 text-slate-800 border-[#cbd5e1] shadow-xs'
            }`}
          >
            <Download className={`w-3.5 h-3.5 ${isDark ? 'text-[#00adb5]' : 'text-[#0284c7]'}`} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Infinitely Scrollable Spreadsheet Table Container */}
      <div ref={tableContainerRef} className="flex-1 overflow-auto relative">
        <table className="w-full text-left border-collapse font-mono text-xs">
          <thead>
            <tr className={`sticky top-0 z-20 border-b shadow-sm ${isDark ? 'bg-[#181a20] border-[#2a2d37]' : 'bg-[#f1f5f9] border-[#cbd5e1]'}`}>
              <th className={`p-2.5 w-14 font-semibold text-center ${isDark ? 'text-[#6b7280]' : 'text-slate-500'}`}>#</th>
              {currentDataset.columns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className={`p-2.5 font-semibold cursor-pointer hover:bg-[#2e323e]/40 transition-colors ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col}</span>
                    <ArrowUpDown className="w-3 h-3 text-[#6b7280]" />
                    {col === currentDataset.selectedX && (
                      <span className={`text-[10px] px-1 py-0.2 rounded font-sans ${isDark ? 'bg-[#00adb5]/20 text-[#00adb5]' : 'bg-sky-100 text-sky-800'}`}>
                        X
                      </span>
                    )}
                    {currentDataset.selectedY.includes(col) && (
                      <span className="text-[10px] px-1 py-0.2 rounded bg-[#ff5722]/20 text-[#ff5722] font-sans">
                        Y
                      </span>
                    )}
                  </div>
                </th>
              ))}
              <th className={`p-2.5 w-12 text-center font-semibold ${isDark ? 'text-[#6b7280]' : 'text-slate-500'}`}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={currentDataset.columns.length + 2} className="p-8 text-center text-[#6b7280]">
                  No matching records found.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => {
                const origIdx = row._origIdx;
                const isSelected = selectedPointIndex === origIdx;

                return (
                  <tr
                    key={origIdx}
                    data-row-index={origIdx}
                    onClick={() => onSelectPoint(isSelected ? null : origIdx)}
                    className={`group border-b transition-colors cursor-pointer ${
                      isSelected
                        ? isDark
                          ? 'bg-[#00adb5]/20 border-l-4 border-l-[#00adb5] text-white font-semibold'
                          : 'bg-sky-100 border-l-4 border-l-[#0284c7] text-sky-950 font-semibold'
                        : isDark
                        ? origIdx % 2 === 0
                          ? 'bg-[#121316] border-[#1e2129]'
                          : 'bg-[#16181f] border-[#1e2129]'
                        : origIdx % 2 === 0
                        ? 'bg-white border-[#f1f5f9]'
                        : 'bg-[#f8fafc] border-[#f1f5f9]'
                    } ${
                      !isSelected &&
                      (isDark ? 'hover:bg-[#1f232e]' : 'hover:bg-slate-100')
                    }`}
                  >
                    <td className={`p-2 text-center text-[11px] font-mono ${
                      isSelected
                        ? isDark ? 'text-[#00adb5]' : 'text-[#0284c7]'
                        : isDark ? 'text-[#6b7280]' : 'text-slate-400'
                    }`}>
                      {origIdx + 1}
                    </td>

                    {currentDataset.columns.map((col) => {
                      const isEditing = editingCell?.rowIdx === origIdx && editingCell?.col === col;

                      return (
                        <td
                          key={col}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            startEditing(origIdx, col, row[col]);
                          }}
                          className={`p-2 select-text ${
                            isSelected
                              ? isDark ? 'text-white' : 'text-slate-950'
                              : isDark ? 'text-[#d1d5db]' : 'text-slate-800'
                          }`}
                          title="Double-click to edit cell value"
                        >
                          {isEditing ? (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                autoFocus
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') commitCellEdit();
                                  if (e.key === 'Escape') cancelCellEdit();
                                }}
                                onBlur={commitCellEdit}
                                className={`px-1.5 py-0.5 font-mono text-xs border rounded w-full focus:outline-none ${
                                  isDark
                                    ? 'bg-[#1b1f29] border-[#00adb5] text-white'
                                    : 'bg-white border-[#0284c7] text-slate-900 shadow-sm'
                                }`}
                              />
                            </div>
                          ) : (
                            <span className="hover:underline cursor-text">
                              {typeof row[col] === 'number'
                                ? row[col].toLocaleString(undefined, { maximumFractionDigits: 6 })
                                : row[col]}
                            </span>
                          )}
                        </td>
                      );
                    })}

                    {/* Row Delete Action */}
                    <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleDeleteRow(origIdx, e)}
                        className={`p-1 rounded transition-colors opacity-0 group-hover:opacity-100 ${
                          isDark
                            ? 'hover:bg-red-500/20 text-[#8b949e] hover:text-red-400'
                            : 'hover:bg-red-100 text-slate-400 hover:text-red-600'
                        }`}
                        title="Delete this row from loaded dataset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Status Footer */}
      <div className={`h-8 border-t px-4 flex items-center justify-between text-[11px] font-mono select-none ${isDark ? 'bg-[#181a20] border-[#2a2d37] text-[#6b7280]' : 'bg-[#ffffff] border-[#e2e8f0] text-slate-500'}`}>
        <span>Double-click any cell to edit value inline • Hover row to delete</span>
        <span>Changes apply in-memory to active session (raw data files preserved)</span>
      </div>
    </div>
  );
};
