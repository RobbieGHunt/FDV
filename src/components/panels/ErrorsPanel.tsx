import React from 'react';
import { Layers } from 'lucide-react';
import { Dataset, ThemeMode } from '../../types';
import { ErrorBarIcon } from '../DockContainer';

interface ErrorsPanelProps {
  activeDataset: Dataset | null;
  theme: ThemeMode;
  onUpdateDataset: (id: string, updates: Partial<Dataset>) => void;
}

export const ErrorsPanel: React.FC<ErrorsPanelProps> = ({
  activeDataset,
  theme,
  onUpdateDataset,
}) => {
  const isDark = theme === 'dark';

  if (!activeDataset) {
    return (
      <div className={`text-xs text-center py-4 ${isDark ? 'text-[#8b949e]' : 'text-slate-500'}`}>
        Select a dataset to configure error bars and uncertainty.
      </div>
    );
  }

  const numericCols = activeDataset.columns.filter((c) => activeDataset.columnTypes[c] === 'number');

  return (
    <div className="space-y-3.5">
      {/* 1. Associate Error Series per curve */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className={`text-[11px] font-medium ${isDark ? 'text-[#9ca3af]' : 'text-slate-700'}`}>
            Associate Error Series
          </label>
          <span className={`text-[10px] ${isDark ? 'text-[#6b7280]' : 'text-slate-500'}`}>
            Per-curve ±Δ
          </span>
        </div>

        {activeDataset.selectedY.map((yCol) => {
          const currentMapping = activeDataset.yErrorMap?.[yCol] || {};
          const currentYErr = currentMapping.yErrCol ?? activeDataset.yErrorColumn ?? '';
          const currentXErr = currentMapping.xErrCol ?? activeDataset.xErrorColumn ?? '';

          return (
            <div
              key={yCol}
              className={`p-2.5 rounded-lg border space-y-2 ${
                isDark ? 'bg-[#14161b] border-[#2e323e]' : 'bg-[#f8fafc] border-[#e2e8f0]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Curve: {yCol}
                </span>
                {(currentYErr || currentXErr) && (
                  <button
                    onClick={() => {
                      const nextMap = { ...(activeDataset.yErrorMap || {}) };
                      delete nextMap[yCol];
                      onUpdateDataset(activeDataset.id, {
                        yErrorMap: nextMap,
                        yErrorColumn: null,
                        xErrorColumn: null,
                      });
                    }}
                    className={`text-[10px] font-medium hover:underline ${
                      isDark ? 'text-red-400' : 'text-red-600'
                    }`}
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Y-Error Dropdown */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className={`${isDark ? 'text-[#8b949e]' : 'text-slate-600'}`}>
                    Y-Error (±ΔY / σ):
                  </span>
                </div>
                <select
                  value={currentYErr}
                  onChange={(e) => {
                    const val = e.target.value || null;
                    const nextMap = { ...(activeDataset.yErrorMap || {}) };
                    nextMap[yCol] = { ...nextMap[yCol], yErrCol: val };
                    onUpdateDataset(activeDataset.id, {
                      yErrorMap: nextMap,
                      yErrorColumn: val,
                    });
                  }}
                  className={`w-full border rounded-md px-2 py-1 text-xs focus:outline-none ${
                    isDark
                      ? 'bg-[#1a1c22] border-[#2e323e] text-white focus:border-[#00adb5]'
                      : 'bg-white border-[#cbd5e1] text-slate-900 focus:border-[#0284c7]'
                  }`}
                >
                  <option value="">(None - No Y error)</option>
                  {numericCols.map((col) => (
                    <option key={col} value={col}>
                      {col} {col === yCol ? '(Same as Y)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* X-Error Dropdown */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className={`${isDark ? 'text-[#8b949e]' : 'text-slate-600'}`}>
                    X-Error (±ΔX / σ):
                  </span>
                </div>
                <select
                  value={currentXErr}
                  onChange={(e) => {
                    const val = e.target.value || null;
                    const nextMap = { ...(activeDataset.yErrorMap || {}) };
                    nextMap[yCol] = { ...nextMap[yCol], xErrCol: val };
                    onUpdateDataset(activeDataset.id, {
                      yErrorMap: nextMap,
                      xErrorColumn: val,
                    });
                  }}
                  className={`w-full border rounded-md px-2 py-1 text-xs focus:outline-none ${
                    isDark
                      ? 'bg-[#1a1c22] border-[#2e323e] text-white focus:border-[#00adb5]'
                      : 'bg-white border-[#cbd5e1] text-slate-900 focus:border-[#0284c7]'
                  }`}
                >
                  <option value="">(None - No X error)</option>
                  {numericCols.map((col) => (
                    <option key={col} value={col}>
                      {col} {col === activeDataset.selectedX ? '(Same as X)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Error Presentation Mode */}
      <div className="space-y-1.5">
        <label className={`text-[11px] font-medium block ${isDark ? 'text-[#9ca3af]' : 'text-slate-700'}`}>
          Presentation Mode
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onUpdateDataset(activeDataset.id, { errorDisplayStyle: 'bars' })}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              (activeDataset.errorDisplayStyle ?? 'bars') === 'bars'
                ? isDark
                  ? 'bg-[#00adb5] text-black border-[#00adb5] shadow-sm'
                  : 'bg-[#0284c7] text-white border-[#0284c7] shadow-sm'
                : isDark
                ? 'bg-[#14161b] text-[#8b949e] border-[#2e323e] hover:text-white'
                : 'bg-white text-slate-700 border-[#cbd5e1] hover:bg-slate-100'
            }`}
          >
            <ErrorBarIcon className="w-3.5 h-3.5" />
            <span>Error Bars</span>
          </button>

          <button
            onClick={() => onUpdateDataset(activeDataset.id, { errorDisplayStyle: 'band' })}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeDataset.errorDisplayStyle === 'band'
                ? isDark
                  ? 'bg-[#00adb5] text-black border-[#00adb5] shadow-sm'
                  : 'bg-[#0284c7] text-white border-[#0284c7] shadow-sm'
                : isDark
                ? 'bg-[#14161b] text-[#8b949e] border-[#2e323e] hover:text-white'
                : 'bg-white text-slate-700 border-[#cbd5e1] hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Shaded Band</span>
          </button>
        </div>
      </div>

      {/* 3. Style Specific Controls */}
      {(activeDataset.errorDisplayStyle ?? 'bars') === 'bars' ? (
        /* Error Bar Options */
        <div className="space-y-3 pt-1 border-t border-[#2e323e]/50">
          {/* Cap Size */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className={`font-medium ${isDark ? 'text-[#9ca3af]' : 'text-slate-700'}`}>
                Cap Size
              </span>
              <span className={`font-mono text-[10px] ${isDark ? 'text-[#00adb5]' : 'text-[#0284c7]'}`}>
                {(activeDataset.errorCapSize ?? 4) === 0
                  ? 'No Cap (0px)'
                  : `${activeDataset.errorCapSize ?? 4} px`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={activeDataset.errorCapSize ?? 4}
                onChange={(e) =>
                  onUpdateDataset(activeDataset.id, {
                    errorCapSize: parseInt(e.target.value, 10),
                  })
                }
                className="flex-1 accent-[#0284c7] cursor-pointer"
              />
              <button
                onClick={() =>
                  onUpdateDataset(activeDataset.id, {
                    errorCapSize: (activeDataset.errorCapSize ?? 4) > 0 ? 0 : 4,
                  })
                }
                className={`px-2 py-0.5 text-[10px] rounded border font-medium transition-colors ${
                  (activeDataset.errorCapSize ?? 4) === 0
                    ? isDark
                      ? 'bg-[#242731] text-[#00adb5] border-[#00adb5]/40'
                      : 'bg-sky-50 text-[#0284c7] border-sky-300'
                    : isDark
                    ? 'bg-transparent text-[#8b949e] border-[#2e323e]'
                    : 'bg-white text-slate-600 border-[#cbd5e1]'
                }`}
                title="Toggle end caps"
              >
                {(activeDataset.errorCapSize ?? 4) === 0 ? 'No Cap' : 'Capped'}
              </button>
            </div>
          </div>

          {/* Line Thickness */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className={`font-medium ${isDark ? 'text-[#9ca3af]' : 'text-slate-700'}`}>
                Bar Thickness
              </span>
              <span className={`font-mono text-[10px] ${isDark ? 'text-[#00adb5]' : 'text-[#0284c7]'}`}>
                {(activeDataset.errorThickness ?? 1.5).toFixed(1)} px
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="4.0"
              step="0.5"
              value={activeDataset.errorThickness ?? 1.5}
              onChange={(e) =>
                onUpdateDataset(activeDataset.id, {
                  errorThickness: parseFloat(e.target.value),
                })
              }
              className="w-full accent-[#0284c7] cursor-pointer"
            />
          </div>
        </div>
      ) : (
        /* Shaded Band Options */
        <div className="space-y-2.5 pt-1 border-t border-[#2e323e]/50">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className={`font-medium ${isDark ? 'text-[#9ca3af]' : 'text-slate-700'}`}>
                Band Fill Opacity
              </span>
              <span className={`font-mono text-[10px] ${isDark ? 'text-[#00adb5]' : 'text-[#0284c7]'}`}>
                {Math.round((activeDataset.errorBandOpacity ?? 0.2) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.75"
              step="0.05"
              value={activeDataset.errorBandOpacity ?? 0.2}
              onChange={(e) =>
                onUpdateDataset(activeDataset.id, {
                  errorBandOpacity: parseFloat(e.target.value),
                })
              }
              className="w-full accent-[#0284c7] cursor-pointer"
            />
          </div>
          <p className={`text-[10px] leading-relaxed ${isDark ? 'text-[#8b949e]' : 'text-slate-500'}`}>
            Renders continuous shaded envelope between [Y - σ, Y + σ] along the curve inheriting the base line color.
          </p>
        </div>
      )}
    </div>
  );
};
