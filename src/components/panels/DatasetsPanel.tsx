import React, { useState } from 'react';
import { Eye, EyeOff, Trash2, Plus, GripHorizontal, Database } from 'lucide-react';
import { Dataset, ThemeMode } from '../../types';

interface DatasetsPanelProps {
  datasets: Dataset[];
  activeDatasetId: string | null;
  theme: ThemeMode;
  onSelectDataset: (id: string) => void;
  onUpdateDataset: (id: string, updates: Partial<Dataset>) => void;
  onDeleteDataset: (id: string) => void;
  onAddFiles: () => void;
  onContextMenu: (e: React.MouseEvent, dataset: Dataset) => void;
}

export const DatasetsPanel: React.FC<DatasetsPanelProps> = ({
  datasets,
  activeDatasetId,
  theme,
  onSelectDataset,
  onUpdateDataset,
  onDeleteDataset,
  onAddFiles,
  onContextMenu,
}) => {
  const isDark = theme === 'dark';

  return (
    <div className="space-y-2">
      {/* Top action row */}
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-medium ${isDark ? 'text-[#9ca3af]' : 'text-slate-600'}`}>
          {datasets.length} {datasets.length === 1 ? 'Dataset' : 'Datasets'} Loaded
        </span>
        <button
          onClick={onAddFiles}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-colors ${
            isDark
              ? 'bg-[#20232c] hover:bg-[#00adb5]/20 text-[#00adb5] border border-[#00adb5]/30'
              : 'bg-sky-50 hover:bg-sky-100 text-[#0284c7] border border-sky-200'
          }`}
          title="Add additional files"
        >
          <Plus className="w-3 h-3" />
          <span>Add Data</span>
        </button>
      </div>

      {/* Dataset List */}
      <div
        className={`max-h-56 overflow-y-auto space-y-1.5 p-1 rounded-lg border ${
          isDark ? 'bg-[#14161b] border-[#2e323e]' : 'bg-[#f8fafc] border-[#e2e8f0]'
        }`}
      >
        {datasets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-4 text-center">
            <Database className={`w-6 h-6 mb-1.5 opacity-30 ${isDark ? 'text-white' : 'text-slate-900'}`} />
            <p className={`text-xs ${isDark ? 'text-[#8b949e]' : 'text-slate-500'}`}>No datasets loaded</p>
            <button
              onClick={onAddFiles}
              className={`mt-2 text-xs font-medium underline ${
                isDark ? 'text-[#00adb5]' : 'text-[#0284c7]'
              }`}
            >
              Open a file
            </button>
          </div>
        ) : (
          datasets.map((ds) => {
            const isActive = ds.id === activeDatasetId;
            return (
              <div
                key={ds.id}
                onClick={() => onSelectDataset(ds.id)}
                onContextMenu={(e) => onContextMenu(e, ds)}
                className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border ${
                  isActive
                    ? isDark
                      ? 'bg-[#242731] border-[#00adb5]/60 text-white shadow-sm'
                      : 'bg-white border-[#0284c7] text-slate-900 shadow-sm ring-1 ring-[#0284c7]/20'
                    : isDark
                    ? 'bg-[#1a1c22] border-[#242731] text-[#9ca3af] hover:bg-[#20232c]'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {/* Left: Color dot & name */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: ds.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className={`font-semibold text-[11px] truncate ${isActive && !isDark ? 'text-slate-900' : ''}`}>
                      {ds.name}
                    </div>
                    <div className={`text-[10px] flex items-center gap-1.5 font-mono ${isDark ? 'text-[#6b7280]' : 'text-slate-500'}`}>
                      <span>{ds.rowCount} pts</span>
                      <span>•</span>
                      <span>
                        {ds.detectedDelimiter === '\t'
                          ? 'TSV'
                          : ds.detectedDelimiter === ' '
                          ? 'Space'
                          : 'CSV'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateDataset(ds.id, { isVisible: !ds.isVisible });
                    }}
                    className={`p-1 rounded transition-colors ${
                      isDark
                        ? 'hover:bg-[#323644] text-[#8b949e] hover:text-white'
                        : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
                    }`}
                    title={ds.isVisible ? 'Hide dataset' : 'Show dataset'}
                  >
                    {ds.isVisible ? (
                      <Eye className="w-3.5 h-3.5" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-[#ff5722]" />
                    )}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDataset(ds.id);
                    }}
                    className={`p-1 rounded transition-colors opacity-0 group-hover:opacity-100 ${
                      isDark
                        ? 'hover:bg-[#323644] text-[#8b949e] hover:text-[#ff5722]'
                        : 'hover:bg-slate-200 text-slate-500 hover:text-red-600'
                    }`}
                    title="Remove dataset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
