import React, { useState } from 'react';
import { Dataset, LineDashStyle, PlotSettings, SeriesStyle, ThemeMode } from '../../types';
import {
  MoveHorizontal,
  MoveVertical,
  Palette,
  ChevronDown,
  ChevronRight,
  Compass,
} from 'lucide-react';

export const COLOR_CYCLE = [
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

interface AxesPanelProps {
  activeDataset: Dataset | null;
  theme: ThemeMode;
  plotSettings?: PlotSettings;
  activePreset?: string;
  onUpdateDataset: (id: string, updates: Partial<Dataset>) => void;
  onUpdatePlotSettings?: (updates: Partial<PlotSettings>) => void;
}

export const AxesPanel: React.FC<AxesPanelProps> = ({
  activeDataset,
  theme,
  plotSettings,
  activePreset,
  onUpdateDataset,
  onUpdatePlotSettings,
}) => {
  const isDark = theme === 'dark';
  const [expandedCurveStyles, setExpandedCurveStyles] = useState(true);

  if (!activeDataset) {
    return (
      <div className={`text-xs text-center py-4 ${isDark ? 'text-[#8b949e]' : 'text-slate-500'}`}>
        Select a dataset to configure axes.
      </div>
    );
  }

  const isLogX = Boolean(plotSettings?.isLogX);
  const isLogY = Boolean(plotSettings?.isLogY);
  const polarThetaUnit = plotSettings?.polarThetaUnit || 'degrees';
  const isPolar = activePreset === 'polar';

  const updateSeriesStyle = (col: string, updates: Partial<SeriesStyle>) => {
    const existing = activeDataset.seriesStyles?.[col] || {};
    const updatedStyles = {
      ...(activeDataset.seriesStyles || {}),
      [col]: { ...existing, ...updates },
    };
    onUpdateDataset(activeDataset.id, { seriesStyles: updatedStyles });
  };

  return (
    <div className="space-y-3.5">
      {/* 0. Polar Angle Units Toggle (Visible when Polar Plot is active) */}
      {isPolar && (
        <div className={`p-2.5 rounded-lg border space-y-1.5 ${
          isDark ? 'bg-[#14161b] border-[#00adb5]/30' : 'bg-sky-50/70 border-sky-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-semibold flex items-center gap-1.5 ${
              isDark ? 'text-[#00adb5]' : 'text-[#0284c7]'
            }`}>
              <Compass className="w-3.5 h-3.5" />
              <span>Polar Angular Axis (θ)</span>
            </span>
            <span className={`text-[10px] font-mono ${isDark ? 'text-[#8b949e]' : 'text-slate-500'}`}>
              Unit Format
            </span>
          </div>

          <div className="flex items-center gap-1.5 pt-0.5">
            <button
              onClick={() => onUpdatePlotSettings?.({ polarThetaUnit: 'degrees' })}
              className={`flex-1 py-1 text-xs font-semibold rounded-md border transition-all ${
                polarThetaUnit === 'degrees'
                  ? isDark
                    ? 'bg-[#00adb5] text-black border-[#00adb5]'
                    : 'bg-[#0284c7] text-white border-[#0284c7]'
                  : isDark
                  ? 'bg-transparent text-[#8b949e] border-[#2e323e] hover:text-white'
                  : 'bg-white text-slate-600 border-[#cbd5e1] hover:bg-slate-50'
              }`}
            >
              Degrees (0° - 360°)
            </button>
            <button
              onClick={() => onUpdatePlotSettings?.({ polarThetaUnit: 'radians' })}
              className={`flex-1 py-1 text-xs font-semibold rounded-md border transition-all ${
                polarThetaUnit === 'radians'
                  ? isDark
                    ? 'bg-[#00adb5] text-black border-[#00adb5]'
                    : 'bg-[#0284c7] text-white border-[#0284c7]'
                  : isDark
                  ? 'bg-transparent text-[#8b949e] border-[#2e323e] hover:text-white'
                  : 'bg-white text-slate-600 border-[#cbd5e1] hover:bg-slate-50'
              }`}
            >
              Radians (0 - 2π)
            </button>
          </div>
        </div>
      )}

      {/* 1. X-Axis Column & Scaling */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className={`text-[11px] font-medium flex items-center gap-1 ${isDark ? 'text-[#9ca3af]' : 'text-slate-700'}`}>
            <MoveHorizontal className="w-3 h-3" />
            <span>{isPolar ? 'Angular Column (θ / Theta)' : 'X-Axis Column'}</span>
          </label>
          <span className={`text-[10px] font-semibold ${isDark ? 'text-[#00adb5]' : 'text-[#0284c7]'}`}>Independent</span>
        </div>
        <select
          value={activeDataset.selectedX}
          onChange={(e) => onUpdateDataset(activeDataset.id, { selectedX: e.target.value })}
          className={`w-full border rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none ${
            isDark
              ? 'bg-[#14161b] border-[#2e323e] text-white focus:border-[#00adb5]'
              : 'bg-white border-[#cbd5e1] text-slate-900 focus:border-[#0284c7]'
          }`}
        >
          {activeDataset.columns.map((col) => (
            <option key={col} value={col}>
              {col} ({activeDataset.columnTypes[col] || 'num'})
            </option>
          ))}
        </select>

        {/* X-Axis Log Scale Toggle (Only in Cartesian mode) */}
        {!isPolar && (
          <div className="flex items-center justify-between pt-1">
            <span className={`text-[10px] font-medium ${isDark ? 'text-[#8b949e]' : 'text-slate-600'}`}>
              X-Axis Scale:
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onUpdatePlotSettings?.({ isLogX: false })}
                className={`px-2 py-0.5 text-[10px] font-semibold rounded border transition-all ${
                  !isLogX
                    ? isDark
                      ? 'bg-[#00adb5] text-black border-[#00adb5]'
                      : 'bg-[#0284c7] text-white border-[#0284c7]'
                    : isDark
                    ? 'bg-transparent text-[#8b949e] border-[#2e323e]'
                    : 'bg-white text-slate-600 border-[#cbd5e1]'
                }`}
              >
                Linear
              </button>
              <button
                onClick={() => onUpdatePlotSettings?.({ isLogX: true })}
                className={`px-2 py-0.5 text-[10px] font-semibold rounded border transition-all ${
                  isLogX
                    ? isDark
                      ? 'bg-[#00adb5] text-black border-[#00adb5]'
                      : 'bg-[#0284c7] text-white border-[#0284c7]'
                    : isDark
                    ? 'bg-transparent text-[#8b949e] border-[#2e323e]'
                    : 'bg-white text-slate-600 border-[#cbd5e1]'
                }`}
                title="Logarithmic X scale with scientific powers of 10 (10^x)"
              >
                Log₁₀ (10ˣ)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Y-Axis Columns Multi-select & Scaling */}
      <div className="space-y-1.5 pt-2 border-t border-[#2e323e]/50">
        <div className="flex items-center justify-between">
          <label className={`text-[11px] font-medium flex items-center gap-1 ${isDark ? 'text-[#9ca3af]' : 'text-slate-700'}`}>
            <MoveVertical className="w-3 h-3" />
            <span>{isPolar ? 'Radial Series (r / Radius)' : 'Y-Axis Series'}</span>
          </label>
          <span className={`text-[10px] ${isDark ? 'text-[#6b7280]' : 'text-slate-500'}`}>Select multiple</span>
        </div>
        <div
          className={`max-h-36 overflow-y-auto space-y-1 p-1.5 rounded-lg border ${
            isDark ? 'bg-[#14161b] border-[#2e323e]' : 'bg-[#f8fafc] border-[#e2e8f0]'
          }`}
        >
          {activeDataset.columns
            .filter((col) => col !== activeDataset.selectedX)
            .map((col, idx) => {
              const isChecked = activeDataset.selectedY.includes(col);
              const curveColor =
                activeDataset.seriesStyles?.[col]?.color ||
                COLOR_CYCLE[idx % COLOR_CYCLE.length] ||
                activeDataset.color;

              return (
                <label
                  key={col}
                  className={`flex items-center justify-between p-1.5 rounded-md cursor-pointer transition-colors ${
                    isChecked
                      ? isDark
                        ? 'bg-[#242731] text-white font-medium'
                        : 'bg-sky-50 text-sky-950 font-semibold border border-sky-200'
                      : isDark
                      ? 'text-[#8b949e] hover:bg-[#181a20]'
                      : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        let nextY = [...activeDataset.selectedY];
                        if (e.target.checked) {
                          nextY.push(col);
                        } else {
                          nextY = nextY.filter((y) => y !== col);
                        }
                        if (nextY.length === 0) nextY = [col];
                        onUpdateDataset(activeDataset.id, { selectedY: nextY });
                      }}
                      className="rounded text-[#0284c7] focus:ring-0"
                    />
                    <span className="truncate text-xs">{col}</span>
                  </div>

                  {isChecked && (
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0 border border-white/20 shadow-xs"
                      style={{ backgroundColor: curveColor }}
                      title={`Curve color: ${curveColor}`}
                    />
                  )}
                </label>
              );
            })}
        </div>

        {/* Y-Axis Log Scale Toggle (Only in Cartesian mode) */}
        {!isPolar && (
          <div className="flex items-center justify-between pt-1">
            <span className={`text-[10px] font-medium ${isDark ? 'text-[#8b949e]' : 'text-slate-600'}`}>
              Y-Axis Scale:
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onUpdatePlotSettings?.({ isLogY: false })}
                className={`px-2 py-0.5 text-[10px] font-semibold rounded border transition-all ${
                  !isLogY
                    ? isDark
                      ? 'bg-[#00adb5] text-black border-[#00adb5]'
                      : 'bg-[#0284c7] text-white border-[#0284c7]'
                    : isDark
                    ? 'bg-transparent text-[#8b949e] border-[#2e323e]'
                    : 'bg-white text-slate-600 border-[#cbd5e1]'
                }`}
              >
                Linear
              </button>
              <button
                onClick={() => onUpdatePlotSettings?.({ isLogY: true })}
                className={`px-2 py-0.5 text-[10px] font-semibold rounded border transition-all ${
                  isLogY
                    ? isDark
                      ? 'bg-[#00adb5] text-black border-[#00adb5]'
                      : 'bg-[#0284c7] text-white border-[#0284c7]'
                    : isDark
                    ? 'bg-transparent text-[#8b949e] border-[#2e323e]'
                    : 'bg-white text-slate-600 border-[#cbd5e1]'
                }`}
                title="Logarithmic Y scale with scientific powers of 10 (10^x)"
              >
                Log₁₀ (10ˣ)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Individual Curve Styles & Colors Configuration */}
      {activeDataset.selectedY.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[#2e323e]/50">
          <div
            onClick={() => setExpandedCurveStyles((v) => !v)}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <span className={`text-[11px] font-semibold flex items-center gap-1 ${isDark ? 'text-[#d1d5db]' : 'text-slate-800'}`}>
              <Palette className="w-3.5 h-3.5 text-[#00adb5]" />
              <span>Individual Curve Styles & Colors</span>
            </span>
            {expandedCurveStyles ? (
              <ChevronDown className="w-3 h-3 text-[#8b949e]" />
            ) : (
              <ChevronRight className="w-3 h-3 text-[#8b949e]" />
            )}
          </div>

          {expandedCurveStyles && (
            <div className="space-y-2.5 pt-1">
              {activeDataset.selectedY.map((yCol, idx) => {
                const sStyle = activeDataset.seriesStyles?.[yCol] || {};
                const curveColor =
                  sStyle.color || COLOR_CYCLE[idx % COLOR_CYCLE.length] || activeDataset.color;
                const lineDash = sStyle.lineDash || activeDataset.lineDash || 'solid';
                const lineWidth = sStyle.lineWidth || activeDataset.lineWidth || 2;

                return (
                  <div
                    key={yCol}
                    className={`p-2 rounded-lg border space-y-2 ${
                      isDark ? 'bg-[#14161b] border-[#2a2d37]' : 'bg-[#f8fafc] border-[#e2e8f0]'
                    }`}
                  >
                    {/* Curve Name & Color Swatch */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
                        <input
                          type="color"
                          value={curveColor.startsWith('#') ? curveColor : '#00adb5'}
                          onChange={(e) => updateSeriesStyle(yCol, { color: e.target.value })}
                          className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent flex-shrink-0"
                          title="Click to choose custom curve color"
                        />
                        <span className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {yCol}
                        </span>
                      </div>
                      <span className={`text-[10px] font-mono ${isDark ? 'text-[#8b949e]' : 'text-slate-500'}`}>
                        Curve #{idx + 1}
                      </span>
                    </div>

                    {/* Line Dash & Line Width Controls */}
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <label className={`block mb-1 ${isDark ? 'text-[#8b949e]' : 'text-slate-600'}`}>
                          Line Pattern
                        </label>
                        <select
                          value={lineDash}
                          onChange={(e) =>
                            updateSeriesStyle(yCol, { lineDash: e.target.value as LineDashStyle })
                          }
                          className={`w-full border rounded px-1.5 py-1 text-xs ${
                            isDark
                              ? 'bg-[#1e2129] border-[#2e323e] text-white'
                              : 'bg-white border-[#cbd5e1] text-slate-900'
                          }`}
                        >
                          <option value="solid">Solid ──</option>
                          <option value="dash">Dashed - -</option>
                          <option value="dot">Dotted ···</option>
                          <option value="dashdot">Dash-Dot -·-</option>
                        </select>
                      </div>

                      <div>
                        <label className={`block mb-1 ${isDark ? 'text-[#8b949e]' : 'text-slate-600'}`}>
                          Width: {lineWidth}px
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="6"
                          step="0.5"
                          value={lineWidth}
                          onChange={(e) =>
                            updateSeriesStyle(yCol, { lineWidth: parseFloat(e.target.value) })
                          }
                          className="w-full h-1.5 accent-[#00adb5] cursor-pointer mt-1"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
