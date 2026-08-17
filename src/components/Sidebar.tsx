import React, { useState, useRef, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Trash2,
  Sliders,
  Sparkles,
  Layers,
  Settings2,
  ChevronDown,
  ChevronRight,
  Plus,
  Info,
  Wand2,
  GripHorizontal,
  Palette,
} from 'lucide-react';
import { Dataset, ThemeMode } from '../types';
import { AVAILABLE_TRANSFORMS } from '../core/transforms';

interface SidebarProps {
  datasets: Dataset[];
  activeDatasetId: string | null;
  theme: ThemeMode;
  onSelectDataset: (id: string) => void;
  onUpdateDataset: (id: string, updates: Partial<Dataset>) => void;
  onDeleteDataset: (id: string) => void;
  onAddFiles: () => void;
  onContextMenu: (e: React.MouseEvent, dataset: Dataset) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  datasets,
  activeDatasetId,
  theme,
  onSelectDataset,
  onUpdateDataset,
  onDeleteDataset,
  onAddFiles,
  onContextMenu,
}) => {
  // Collapsible sections
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    datasets: false,
    axes: false,
    appearance: false,
    transforms: false,
    metadata: false,
  });

  // Resizable datasets panel height state
  const [datasetListHeight, setDatasetListHeight] = useState<number>(190);
  const [isResizingList, setIsResizingList] = useState(false);

  const toggleSection = (sec: string) => {
    setCollapsedSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const activeDataset = datasets.find((d) => d.id === activeDatasetId) || datasets[0] || null;
  const isDark = theme === 'dark';

  // Handle horizontal divider drag for dataset list height
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingList) return;
      const newHeight = Math.max(80, Math.min(600, e.clientY - 95));
      setDatasetListHeight(newHeight);
    };
    const handleMouseUp = () => {
      if (isResizingList) setIsResizingList(false);
    };

    if (isResizingList) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingList]);

  return (
    <aside
      className={`w-full h-full flex flex-col flex-shrink-0 select-none text-xs transition-colors duration-200 ${
        isDark ? 'bg-[#181a20]' : 'bg-[#f8fafc]'
      }`}
    >
      {/* 1. Datasets Section */}
      <div className={`border-b ${isDark ? 'border-[#2a2d37]' : 'border-[#e2e8f0]'}`}>
        <div
          onClick={() => toggleSection('datasets')}
          className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
            isDark ? 'bg-[#14161b] hover:bg-[#1a1c22]' : 'bg-[#f1f5f9] hover:bg-[#e2e8f0]'
          }`}
        >
          <div className="flex items-center gap-2">
            {collapsedSections.datasets ? (
              <ChevronRight className={`w-3.5 h-3.5 ${isDark ? 'text-[#8b949e]' : 'text-slate-500'}`} />
            ) : (
              <ChevronDown className={`w-3.5 h-3.5 ${isDark ? 'text-[#8b949e]' : 'text-slate-500'}`} />
            )}
            <Layers className={`w-4 h-4 ${isDark ? 'text-[#00adb5]' : 'text-[#0284c7]'}`} />
            <span
              className={`font-semibold tracking-wide uppercase text-[11px] ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Datasets ({datasets.length})
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddFiles();
            }}
            className={`p-1 rounded transition-colors ${
              isDark
                ? 'hover:bg-[#2a2d37] text-[#9ca3af] hover:text-[#00adb5]'
                : 'hover:bg-slate-200 text-slate-600 hover:text-[#0284c7]'
            }`}
            title="Add new dataset"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {!collapsedSections.datasets && (
          <div
            style={{ height: `${datasetListHeight}px` }}
            className={`overflow-y-auto p-2 space-y-1.5 ${
              isDark ? 'bg-[#121316]/50' : 'bg-[#f8fafc]'
            }`}
          >
            {datasets.length === 0 ? (
              <div className={`p-4 text-center ${isDark ? 'text-[#6b7280]' : 'text-slate-500'}`}>
                <p className="font-medium">No datasets loaded.</p>
                <p className="text-[10px] mt-1">Drag & drop files to start.</p>
              </div>
            ) : (
              datasets.map((ds) => {
                const isActive = ds.id === (activeDataset?.id ?? '');
                return (
                  <div
                    key={ds.id}
                    onClick={() => onSelectDataset(ds.id)}
                    onContextMenu={(e) => onContextMenu(e, ds)}
                    className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border ${
                      isActive
                        ? isDark
                          ? 'bg-[#242731] border-[#00adb5] text-white shadow-sm'
                          : 'bg-white border-[#0284c7] text-slate-950 shadow-sm ring-1 ring-[#0284c7]/20'
                        : isDark
                        ? 'bg-[#1a1c22]/80 border-transparent text-[#9ca3af] hover:bg-[#20232c] hover:text-white'
                        : 'bg-white border-[#e2e8f0] text-slate-700 hover:bg-slate-50 hover:text-slate-950 shadow-xs'
                    }`}
                    title="Right-click for dataset options (color, symbol, duplicate, rename)"
                  >
                    {/* Left: Color chip + Name */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <input
                        type="color"
                        value={ds.color}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onUpdateDataset(ds.id, { color: e.target.value })}
                        className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent p-0 flex-shrink-0"
                        title="Click to change color"
                      />
                      <div className="truncate">
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
        )}

        {/* Resizer Handle for Dataset List Height */}
        {!collapsedSections.datasets && (
          <div
            onMouseDown={() => setIsResizingList(true)}
            className={`h-2 flex items-center justify-center cursor-row-resize transition-colors ${
              isDark ? 'bg-[#1e2129] hover:bg-[#00adb5]/30' : 'bg-[#e2e8f0] hover:bg-[#0284c7]/30'
            }`}
            title="Drag up or down to resize Datasets panel"
          >
            <GripHorizontal className="w-3 h-3 text-[#6b7280]" />
          </div>
        )}
      </div>

      {/* Active Dataset Inspector */}
      {activeDataset ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Section: Axes & Columns */}
          <div
            className={`rounded-xl border overflow-hidden transition-all ${
              isDark ? 'bg-[#1a1c22] border-[#2a2d37]' : 'bg-white border-[#e2e8f0] shadow-sm'
            }`}
          >
            <div
              onClick={() => toggleSection('axes')}
              className={`p-2.5 flex items-center justify-between cursor-pointer ${
                isDark ? 'bg-[#14161b]' : 'bg-[#f1f5f9]'
              }`}
            >
              <div className="flex items-center gap-2">
                {collapsedSections.axes ? (
                  <ChevronRight className={`w-3 h-3 ${isDark ? 'text-[#8b949e]' : 'text-slate-500'}`} />
                ) : (
                  <ChevronDown className={`w-3 h-3 ${isDark ? 'text-[#8b949e]' : 'text-slate-500'}`} />
                )}
                <span className={`font-semibold text-[11px] uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Axes & Columns
                </span>
              </div>
              <Sliders className={`w-3.5 h-3.5 ${isDark ? 'text-[#00adb5]' : 'text-[#0284c7]'}`} />
            </div>

            {!collapsedSections.axes && (
              <div className="p-3 space-y-3">
                {/* X-Axis Column */}
                <div className="space-y-1">
                  <label className={`text-[11px] font-medium flex items-center justify-between ${isDark ? 'text-[#9ca3af]' : 'text-slate-700'}`}>
                    <span>X-Axis Column</span>
                    <span className={`text-[10px] font-semibold ${isDark ? 'text-[#00adb5]' : 'text-[#0284c7]'}`}>Independent</span>
                  </label>
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
                </div>

                {/* Y-Axis Columns Multi-select */}
                <div className="space-y-1">
                  <label className={`text-[11px] font-medium flex items-center justify-between ${isDark ? 'text-[#9ca3af]' : 'text-slate-700'}`}>
                    <span>Y-Axis Series</span>
                    <span className={`text-[10px] ${isDark ? 'text-[#6b7280]' : 'text-slate-500'}`}>Select multiple</span>
                  </label>
                  <div
                    className={`max-h-28 overflow-y-auto space-y-1 p-1.5 rounded-lg border ${
                      isDark ? 'bg-[#14161b] border-[#2e323e]' : 'bg-[#f8fafc] border-[#e2e8f0]'
                    }`}
                  >
                    {activeDataset.columns
                      .filter((col) => col !== activeDataset.selectedX)
                      .map((col) => {
                        const isChecked = activeDataset.selectedY.includes(col);
                        return (
                          <label
                            key={col}
                            className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer transition-colors ${
                              isChecked
                                ? isDark
                                  ? 'bg-[#242731] text-white font-medium'
                                  : 'bg-sky-50 text-sky-950 font-semibold border border-sky-200'
                                : isDark
                                ? 'text-[#8b949e] hover:bg-[#181a20]'
                                : 'text-slate-700 hover:bg-slate-200'
                            }`}
                          >
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
                            <span className="truncate">{col}</span>
                          </label>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section: Plot Appearance */}
          <div
            className={`rounded-xl border overflow-hidden transition-all ${
              isDark ? 'bg-[#1a1c22] border-[#2a2d37]' : 'bg-white border-[#e2e8f0] shadow-sm'
            }`}
          >
            <div
              onClick={() => toggleSection('appearance')}
              className={`p-2.5 flex items-center justify-between cursor-pointer ${
                isDark ? 'bg-[#14161b]' : 'bg-[#f1f5f9]'
              }`}
            >
              <div className="flex items-center gap-2">
                {collapsedSections.appearance ? (
                  <ChevronRight className={`w-3 h-3 ${isDark ? 'text-[#8b949e]' : 'text-slate-500'}`} />
                ) : (
                  <ChevronDown className={`w-3 h-3 ${isDark ? 'text-[#8b949e]' : 'text-slate-500'}`} />
                )}
                <span className={`font-semibold text-[11px] uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Plot Appearance
                </span>
              </div>
              <Settings2 className={`w-3.5 h-3.5 ${isDark ? 'text-[#00adb5]' : 'text-[#0284c7]'}`} />
            </div>

            {!collapsedSections.appearance && (
              <div className="p-3 space-y-3">
                {/* Custom Color Input (Hex / RGB / Palette) */}
                <div className="space-y-1">
                  <div className={`flex items-center justify-between ${isDark ? 'text-[#9ca3af]' : 'text-slate-700'}`}>
                    <span className="font-medium">Dataset Color</span>
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
                    <span className="font-medium">Marker Size (px)</span>
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
                    <span className="font-medium">Line Width (px)</span>
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

                {/* Y-Offset (Slider + Manual Input Box) */}
                <div className="space-y-1.5">
                  <div className={`flex items-center justify-between ${isDark ? 'text-[#9ca3af]' : 'text-slate-700'}`}>
                    <span className="font-medium">Y-Offset (Stacking)</span>
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
            )}
          </div>

          {/* Section: Modular Transforms */}
          <div
            className={`rounded-xl border overflow-hidden transition-all ${
              isDark ? 'bg-[#1a1c22] border-[#2a2d37]' : 'bg-white border-[#e2e8f0] shadow-sm'
            }`}
          >
            <div
              onClick={() => toggleSection('transforms')}
              className={`p-2.5 flex items-center justify-between cursor-pointer ${
                isDark ? 'bg-[#14161b]' : 'bg-[#f1f5f9]'
              }`}
            >
              <div className="flex items-center gap-2">
                {collapsedSections.transforms ? (
                  <ChevronRight className={`w-3 h-3 ${isDark ? 'text-[#8b949e]' : 'text-slate-500'}`} />
                ) : (
                  <ChevronDown className={`w-3 h-3 ${isDark ? 'text-[#8b949e]' : 'text-slate-500'}`} />
                )}
                <span className={`font-semibold text-[11px] uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Modular Transforms
                </span>
              </div>
              <Wand2 className="w-3.5 h-3.5 text-[#ff9800]" />
            </div>

            {!collapsedSections.transforms && (
              <div className="p-3 space-y-2">
                {AVAILABLE_TRANSFORMS.map((tf) => {
                  const isActive = activeDataset.activeTransforms.includes(tf.id);
                  const isNormalize = tf.id === 'normalize_custom' || tf.id === 'normalize_01';
                  const normMin = activeDataset.transformParams?.normalize?.min ?? 0;
                  const normMax = activeDataset.transformParams?.normalize?.max ?? 1;

                  return (
                    <div
                      key={tf.id}
                      className={`p-2 rounded-lg border transition-all ${
                        isActive
                          ? isDark
                            ? 'bg-[#242731] border-[#00adb5]/40 text-white'
                            : 'bg-sky-50 border-sky-300 text-slate-950 shadow-xs'
                          : isDark
                          ? 'bg-[#14161b] border-transparent text-[#8b949e]'
                          : 'bg-[#f8fafc] border-transparent text-slate-700'
                      }`}
                    >
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => {
                            let nextT = [...activeDataset.activeTransforms];
                            if (e.target.checked) {
                              nextT.push(tf.id);
                            } else {
                              nextT = nextT.filter((t) => t !== tf.id);
                            }
                            onUpdateDataset(activeDataset.id, { activeTransforms: nextT });
                          }}
                          className="mt-0.5 rounded text-[#0284c7] focus:ring-0"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-xs">{tf.name}</div>
                          <div className={`text-[10px] leading-tight ${isDark ? 'text-[#6b7280]' : 'text-slate-500'}`}>
                            {tf.description}
                          </div>
                        </div>
                      </label>

                      {/* Configurable Range Inputs for Normalization */}
                      {isActive && isNormalize && (
                        <div className={`mt-2 pt-2 border-t flex items-center justify-between gap-2 ${isDark ? 'border-[#2e323e]' : 'border-sky-200'}`}>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] ${isDark ? 'text-[#8b949e]' : 'text-slate-600'}`}>Min:</span>
                            <input
                              type="number"
                              value={normMin}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                onUpdateDataset(activeDataset.id, {
                                  transformParams: {
                                    ...activeDataset.transformParams,
                                    normalize: { min: val, max: normMax },
                                  },
                                });
                              }}
                              className={`w-14 text-center font-mono border rounded px-1 py-0.5 text-[11px] focus:outline-none ${
                                isDark
                                  ? 'bg-[#121316] border-[#2e323e] text-white focus:border-[#00adb5]'
                                  : 'bg-white border-[#cbd5e1] text-slate-900 focus:border-[#0284c7]'
                              }`}
                            />
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] ${isDark ? 'text-[#8b949e]' : 'text-slate-600'}`}>Max:</span>
                            <input
                              type="number"
                              value={normMax}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 1;
                                onUpdateDataset(activeDataset.id, {
                                  transformParams: {
                                    ...activeDataset.transformParams,
                                    normalize: { min: normMin, max: val },
                                  },
                                });
                              }}
                              className={`w-14 text-center font-mono border rounded px-1 py-0.5 text-[11px] focus:outline-none ${
                                isDark
                                  ? 'bg-[#121316] border-[#2e323e] text-white focus:border-[#00adb5]'
                                  : 'bg-white border-[#cbd5e1] text-slate-900 focus:border-[#0284c7]'
                              }`}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: File Metadata Info */}
          {Object.keys(activeDataset.metadata).length > 0 && (
            <div
              className={`rounded-xl border overflow-hidden transition-all ${
                isDark ? 'bg-[#1a1c22] border-[#2a2d37]' : 'bg-white border-[#e2e8f0] shadow-sm'
              }`}
            >
              <div
                onClick={() => toggleSection('metadata')}
                className={`p-2.5 flex items-center justify-between cursor-pointer ${
                  isDark ? 'bg-[#14161b]' : 'bg-[#f1f5f9]'
                }`}
              >
                <div className="flex items-center gap-2">
                  {collapsedSections.metadata ? (
                    <ChevronRight className={`w-3 h-3 ${isDark ? 'text-[#8b949e]' : 'text-slate-500'}`} />
                  ) : (
                    <ChevronDown className={`w-3 h-3 ${isDark ? 'text-[#8b949e]' : 'text-slate-500'}`} />
                  )}
                  <span className={`font-semibold text-[11px] uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    File Metadata
                  </span>
                </div>
                <Info className={`w-3.5 h-3.5 ${isDark ? 'text-[#2196f3]' : 'text-[#0284c7]'}`} />
              </div>

              {!collapsedSections.metadata && (
                <div className="p-3 space-y-1 text-[11px] font-mono">
                  {Object.entries(activeDataset.metadata).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-2">
                      <span className={`${isDark ? 'text-[#6b7280]' : 'text-slate-500'}`}>{k}:</span>
                      <span className={`truncate max-w-[140px] font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className={`flex-1 flex items-center justify-center p-6 text-center ${isDark ? 'text-[#6b7280]' : 'text-slate-500'}`}>
          Select or drop a dataset to inspect parameters.
        </div>
      )}
    </aside>
  );
};
