import React from 'react';
import { Dataset, ThemeMode } from '../../types';

interface AppearancePanelProps {
  activeDataset: Dataset | null;
  theme: ThemeMode;
  onUpdateDataset: (id: string, updates: Partial<Dataset>) => void;
}

export const AppearancePanel: React.FC<AppearancePanelProps> = ({
  activeDataset,
  theme,
  onUpdateDataset,
}) => {
  const isDark = theme === 'dark';

  if (!activeDataset) {
    return (
      <div className={`text-xs text-center py-4 ${isDark ? 'text-[#8b949e]' : 'text-slate-500'}`}>
        Select a dataset to customize plot styling.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Custom Color Input */}
      <div className="space-y-1">
        <div className={`flex items-center justify-between ${isDark ? 'text-[#9ca3af]' : 'text-slate-700'}`}>
          <span className="font-medium text-[11px]">Dataset Color</span>
          <span className={`text-[10px] font-mono ${isDark ? 'text-[#6b7280]' : 'text-slate-500'}`}>Hex / RGB</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={activeDataset.color.startsWith('#') ? activeDataset.color : '#0284c7'}
            onChange={(e) => onUpdateDataset(activeDataset.id, { color: e.target.value })}
            className="w-8 h-7 rounded border-0 cursor-pointer bg-transparent p-0 flex-shrink-0"
            title="Choose from color palette"
          />
          <input
            type="text"
            value={activeDataset.color}
            placeholder="#0284c7 or rgb(2, 132, 199)"
            onChange={(e) => onUpdateDataset(activeDataset.id, { color: e.target.value })}
            className={`flex-1 border rounded-lg px-2.5 py-1 font-mono text-xs focus:outline-none ${
              isDark
                ? 'bg-[#14161b] border-[#2e323e] text-white focus:border-[#00adb5]'
                : 'bg-white border-[#cbd5e1] text-slate-900 focus:border-[#0284c7]'
            }`}
          />
        </div>
      </div>

      {/* Trace Style & Symbol */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className={`text-[11px] font-medium block mb-1 ${isDark ? 'text-[#9ca3af]' : 'text-slate-700'}`}>
            Trace Mode
          </span>
          <select
            value={activeDataset.plotStyle}
            onChange={(e) => onUpdateDataset(activeDataset.id, { plotStyle: e.target.value as any })}
            className={`w-full border rounded-lg px-2 py-1 text-xs focus:outline-none ${
              isDark
                ? 'bg-[#14161b] border-[#2e323e] text-white focus:border-[#00adb5]'
                : 'bg-white border-[#cbd5e1] text-slate-900 focus:border-[#0284c7]'
            }`}
          >
            <option value="lines">Lines</option>
            <option value="markers">Scatter Points</option>
            <option value="lines+markers">Lines + Points</option>
            <option value="area">Filled Area</option>
          </select>
        </div>

        <div>
          <span className={`text-[11px] font-medium block mb-1 ${isDark ? 'text-[#9ca3af]' : 'text-slate-700'}`}>
            Marker Symbol
          </span>
          <select
            value={activeDataset.markerSymbol || 'circle'}
            onChange={(e) => onUpdateDataset(activeDataset.id, { markerSymbol: e.target.value as any })}
            className={`w-full border rounded-lg px-2 py-1 text-xs focus:outline-none ${
              isDark
                ? 'bg-[#14161b] border-[#2e323e] text-white focus:border-[#00adb5]'
                : 'bg-white border-[#cbd5e1] text-slate-900 focus:border-[#0284c7]'
            }`}
          >
            <option value="circle">Circle</option>
            <option value="square">Square</option>
            <option value="diamond">Diamond</option>
            <option value="cross">Cross</option>
            <option value="triangle-up">Triangle</option>
            <option value="star">Star</option>
          </select>
        </div>
      </div>

      {/* Marker Size (Slider + Manual Input) */}
      <div className="space-y-1.5">
        <div className={`flex items-center justify-between ${isDark ? 'text-[#9ca3af]' : 'text-slate-700'}`}>
          <span className="font-medium text-[11px]">Marker Size (px)</span>
          <input
            type="number"
            min="1"
            max="25"
            step="1"
            value={activeDataset.markerSize || 6}
            onChange={(e) =>
              onUpdateDataset(activeDataset.id, {
                markerSize: Math.max(1, parseInt(e.target.value) || 6),
              })
            }
            className={`w-16 text-center font-mono border rounded-md px-1.5 py-0.5 text-xs focus:outline-none ${
              isDark
                ? 'bg-[#14161b] border-[#2e323e] text-white focus:border-[#00adb5]'
                : 'bg-white border-[#cbd5e1] text-slate-900 focus:border-[#0284c7]'
            }`}
          />
        </div>
        <input
          type="range"
          min="2"
          max="20"
          step="1"
          value={activeDataset.markerSize || 6}
          onChange={(e) =>
            onUpdateDataset(activeDataset.id, { markerSize: parseInt(e.target.value) })
          }
          className={`w-full cursor-pointer ${isDark ? 'accent-[#00adb5]' : 'accent-[#0284c7]'}`}
        />
      </div>

      {/* Line Width (Slider + Manual Input Box) */}
      <div className="space-y-1.5">
        <div className={`flex items-center justify-between ${isDark ? 'text-[#9ca3af]' : 'text-slate-700'}`}>
          <span className="font-medium text-[11px]">Line Width (px)</span>
          <input
            type="number"
            min="0.1"
            max="10"
            step="0.5"
            value={activeDataset.lineWidth}
            onChange={(e) =>
              onUpdateDataset(activeDataset.id, {
                lineWidth: Math.max(0.1, parseFloat(e.target.value) || 1),
              })
            }
            className={`w-16 text-center font-mono border rounded-md px-1.5 py-0.5 text-xs focus:outline-none ${
              isDark
                ? 'bg-[#14161b] border-[#2e323e] text-white focus:border-[#00adb5]'
                : 'bg-white border-[#cbd5e1] text-slate-900 focus:border-[#0284c7]'
            }`}
          />
        </div>
        <input
          type="range"
          min="0.5"
          max="8"
          step="0.5"
          value={activeDataset.lineWidth}
          onChange={(e) => onUpdateDataset(activeDataset.id, { lineWidth: parseFloat(e.target.value) })}
          className={`w-full cursor-pointer ${isDark ? 'accent-[#00adb5]' : 'accent-[#0284c7]'}`}
        />
      </div>

      {/* Line Dash Style */}
      <div className="space-y-1">
        <span className={`text-[11px] font-medium block ${isDark ? 'text-[#9ca3af]' : 'text-slate-700'}`}>
          Line Dash Style
        </span>
        <select
          value={activeDataset.lineDash || 'solid'}
          onChange={(e) => onUpdateDataset(activeDataset.id, { lineDash: e.target.value as any })}
          className={`w-full border rounded-lg px-2 py-1 text-xs focus:outline-none ${
            isDark
              ? 'bg-[#14161b] border-[#2e323e] text-white focus:border-[#00adb5]'
              : 'bg-white border-[#cbd5e1] text-slate-900 focus:border-[#0284c7]'
          }`}
        >
          <option value="solid">Solid (━━━━━)</option>
          <option value="dash">Dashed (━━ ━━)</option>
          <option value="dot">Dotted (•••••)</option>
          <option value="dashdot">Dash-Dot (━ • ━)</option>
        </select>
      </div>

      {/* Y-Offset (Stacking) */}
      <div className="space-y-1.5">
        <div className={`flex items-center justify-between ${isDark ? 'text-[#9ca3af]' : 'text-slate-700'}`}>
          <span className="font-medium text-[11px]">Y-Offset (Waterfall Stacking)</span>
          <input
            type="number"
            step="0.1"
            value={activeDataset.yOffset}
            onChange={(e) =>
              onUpdateDataset(activeDataset.id, {
                yOffset: parseFloat(e.target.value) || 0,
              })
            }
            className={`w-16 text-center font-mono border rounded-md px-1.5 py-0.5 text-xs focus:outline-none ${
              isDark
                ? 'bg-[#14161b] border-[#2e323e] text-white focus:border-[#00adb5]'
                : 'bg-white border-[#cbd5e1] text-slate-900 focus:border-[#0284c7]'
            }`}
          />
        </div>
        <input
          type="range"
          min="-50"
          max="50"
          step="0.5"
          value={activeDataset.yOffset}
          onChange={(e) => onUpdateDataset(activeDataset.id, { yOffset: parseFloat(e.target.value) })}
          className={`w-full cursor-pointer ${isDark ? 'accent-[#00adb5]' : 'accent-[#0284c7]'}`}
        />
      </div>
    </div>
  );
};
