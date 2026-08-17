import React from 'react';
import {
  Upload,
  Sparkles,
  Download,
  Table,
  LineChart,
  Code2,
  SlidersHorizontal,
  FolderOpen,
  Sun,
  Moon,
  Undo2,
  Redo2,
} from 'lucide-react';
import { PlotPresetId, ThemeMode } from '../types';
import { PLOT_PRESETS } from '../core/presets';

interface HeaderProps {
  activeTab: 'plot' | 'table' | 'script';
  setActiveTab: (tab: 'plot' | 'table' | 'script') => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenFiles: () => void;
  onLoadSample: (sampleType: 'csv' | 'spectra' | 'xrr') => void;
  onExport: () => void;
  datasetCount: number;
  activePreset: PlotPresetId;
  onSelectPreset: (preset: PlotPresetId) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  theme,
  onToggleTheme,
  onOpenFiles,
  onLoadSample,
  onExport,
  datasetCount,
  activePreset,
  onSelectPreset,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}) => {
  const isDark = theme === 'dark';

  return (
    <header
      className={`h-14 border-b px-4 flex items-center justify-between select-none z-20 transition-colors duration-200 ${
        isDark ? 'bg-[#181a20] border-[#2a2d37]' : 'bg-[#f8fafc] border-[#e2e8f0]'
      }`}
    >
      {/* Left: Brand / Title & Undo/Redo & Open Data */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {/* Official FDV Vector Icon */}
          <div
            className={`w-8 h-8 rounded-lg p-1 flex items-center justify-center shadow-sm flex-shrink-0 border ${
              isDark ? 'bg-[#16181f] border-[#2e323e]' : 'bg-white border-[#cbd5e1]'
            }`}
          >
            <svg viewBox="0 0 512 512" className="w-full h-full">
              {/* Dashed drop lines */}
              <line x1="230" y1="100" x2="230" y2="432" stroke={isDark ? '#ffffff' : '#334155'} strokeWidth="20" strokeDasharray="24,20" opacity="0.8" />
              <line x1="335" y1="227" x2="335" y2="432" stroke={isDark ? '#ffffff' : '#334155'} strokeWidth="20" strokeDasharray="24,20" opacity="0.8" />
              {/* Curves */}
              <path d="M 65 432 Q 180 432 230 100 Q 280 432 425 432" fill="none" stroke={isDark ? '#00adb5' : '#0284c7'} strokeWidth="44" strokeLinecap="round" />
              <path d="M 140 432 Q 280 432 335 227 Q 380 432 425 432" fill="none" stroke="#ea580c" strokeWidth="44" strokeLinecap="round" />
              {/* Apex Dots with Colored Ring Borders */}
              <circle cx="230" cy="100" r="44" fill="#ffffff" stroke={isDark ? '#00adb5' : '#0284c7'} strokeWidth="24" />
              <circle cx="335" cy="227" r="44" fill="#ffffff" stroke="#ea580c" strokeWidth="24" />
              {/* Axes (on top) */}
              <line x1="55" y1="432" x2="445" y2="432" stroke={isDark ? '#ffffff' : '#0f172a'} strokeWidth="28" strokeLinecap="square" />
              <polygon points="445,415 475,432 445,449" fill={isDark ? '#ffffff' : '#0f172a'} />
              <line x1="75" y1="452" x2="75" y2="67" stroke={isDark ? '#ffffff' : '#0f172a'} strokeWidth="28" strokeLinecap="square" />
              <polygon points="58,67 75,37 92,67" fill={isDark ? '#ffffff' : '#0f172a'} />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`font-bold text-sm tracking-wide font-mono ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                FDV
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-semibold tracking-wider uppercase ${
                  isDark ? 'bg-[#00adb5]/20 text-[#00adb5]' : 'bg-sky-100 text-sky-700'
                }`}
              >
                App
              </span>
            </div>
            <span className={`text-[11px] hidden sm:inline ${isDark ? 'text-[#8b949e]' : 'text-slate-500'}`}>
              Flexible Data Viewer
            </span>
          </div>
        </div>

        {/* Undo / Redo History Controls */}
        <div className="flex items-center gap-1 ml-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-md border transition-all ${
              canUndo
                ? isDark
                  ? 'bg-[#20232c] hover:bg-[#282c37] text-white border-[#3a3f4d] active:scale-95 shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border-[#cbd5e1] active:scale-95 shadow-xs'
                : isDark
                ? 'bg-[#181a20] text-[#555] border-[#252830] cursor-not-allowed opacity-35'
                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-35'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded-md border transition-all ${
              canRedo
                ? isDark
                  ? 'bg-[#20232c] hover:bg-[#282c37] text-white border-[#3a3f4d] active:scale-95 shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border-[#cbd5e1] active:scale-95 shadow-xs'
                : isDark
                ? 'bg-[#181a20] text-[#555] border-[#252830] cursor-not-allowed opacity-35'
                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-35'
            }`}
            title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Vertical Divider */}
        <div className={`h-5 w-[1px] mx-1 ${isDark ? 'bg-[#2e323e]' : 'bg-[#cbd5e1]'}`} />

        {/* Open Data Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenFiles}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold text-xs rounded-md shadow-sm transition-all active:scale-95 ${
              isDark
                ? 'bg-[#00adb5] hover:bg-[#00c4cd] text-black'
                : 'bg-[#0284c7] hover:bg-[#0369a1] text-white'
            }`}
            title="Open or Drag-and-Drop data files"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Open Data</span>
          </button>

          {/* Quick Samples dropdown */}
          <div
            className={`hidden md:flex items-center gap-1 p-0.5 rounded-md border ${
              isDark ? 'bg-[#20232c] border-[#2a2d37]' : 'bg-white border-[#e2e8f0] shadow-sm'
            }`}
          >
            <span className={`text-[10px] px-1.5 font-medium ${isDark ? 'text-[#6b7280]' : 'text-slate-500'}`}>
              Samples:
            </span>
            <button
              onClick={() => onLoadSample('csv')}
              className={`px-2 py-1 text-[11px] rounded transition-colors ${
                isDark ? 'text-[#9ca3af] hover:text-white hover:bg-[#2a2d37]' : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              CSV
            </button>
            <button
              onClick={() => onLoadSample('spectra')}
              className={`px-2 py-1 text-[11px] rounded transition-colors ${
                isDark ? 'text-[#9ca3af] hover:text-white hover:bg-[#2a2d37]' : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              Spectra
            </button>
            <button
              onClick={() => onLoadSample('xrr')}
              className={`px-2 py-1 text-[11px] rounded transition-colors ${
                isDark ? 'text-[#9ca3af] hover:text-white hover:bg-[#2a2d37]' : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              XRR
            </button>
          </div>
        </div>
      </div>

      {/* Middle: Tab Navigation */}
      <div
        className={`flex items-center p-1 rounded-lg border ${
          isDark ? 'bg-[#121316] border-[#2a2d37]' : 'bg-[#e2e8f0]/80 border-[#cbd5e1]'
        }`}
      >
        <button
          onClick={() => setActiveTab('plot')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
            activeTab === 'plot'
              ? isDark
                ? 'bg-[#242731] text-white shadow-sm'
                : 'bg-white text-slate-900 shadow-sm font-semibold'
              : isDark
              ? 'text-[#8b949e] hover:text-white hover:bg-[#1a1c22]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <LineChart className={`w-3.5 h-3.5 ${isDark ? 'text-[#00adb5]' : 'text-[#0284c7]'}`} />
          <span>Plot Canvas</span>
        </button>

        <button
          onClick={() => setActiveTab('table')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
            activeTab === 'table'
              ? isDark
                ? 'bg-[#242731] text-white shadow-sm'
                : 'bg-white text-slate-900 shadow-sm font-semibold'
              : isDark
              ? 'text-[#8b949e] hover:text-white hover:bg-[#1a1c22]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Table className={`w-3.5 h-3.5 ${isDark ? 'text-[#2196f3]' : 'text-blue-600'}`} />
          <span>Data Table</span>
          {datasetCount > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isDark ? 'bg-[#2e323e] text-[#9ca3af]' : 'bg-slate-200 text-slate-700 font-semibold'
              }`}
            >
              {datasetCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('script')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
            activeTab === 'script'
              ? isDark
                ? 'bg-[#242731] text-white shadow-sm'
                : 'bg-white text-slate-900 shadow-sm font-semibold'
              : isDark
              ? 'text-[#8b949e] hover:text-white hover:bg-[#1a1c22]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Code2 className={`w-3.5 h-3.5 ${isDark ? 'text-[#ff9800]' : 'text-amber-600'}`} />
          <span>Scripts & Plotters</span>
        </button>
      </div>

      {/* Right: Preset Selector & Theme Toggle & Export */}
      <div className="flex items-center gap-2">
        {/* Preset Selector */}
        <div
          className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${
            isDark ? 'bg-[#20232c] border-[#2a2d37]' : 'bg-white border-[#cbd5e1] shadow-sm'
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 ${isDark ? 'text-[#00adb5]' : 'text-[#0284c7]'}`} />
          <select
            value={activePreset}
            onChange={(e) => onSelectPreset(e.target.value as PlotPresetId)}
            className={`bg-transparent text-xs focus:outline-none cursor-pointer font-medium ${
              isDark ? 'text-[#d1d5db]' : 'text-slate-800'
            }`}
          >
            {PLOT_PRESETS.map((p) => (
              <option
                key={p.id}
                value={p.id}
                className={isDark ? 'bg-[#1a1c22] text-white' : 'bg-white text-black'}
              >
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Theme Toggle (Dark/Light) */}
        <button
          onClick={onToggleTheme}
          className={`p-1.5 rounded-md border transition-all ${
            isDark
              ? 'bg-[#20232c] hover:bg-[#282c37] text-[#ffeb3b] border-[#3a3f4d]'
              : 'bg-white hover:bg-slate-100 text-amber-600 border-[#cbd5e1] shadow-sm'
          }`}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Export Button */}
        <button
          onClick={onExport}
          disabled={datasetCount === 0}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${
            datasetCount > 0
              ? isDark
                ? 'bg-[#20232c] hover:bg-[#282c37] text-white border-[#3a3f4d] shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-800 border-[#cbd5e1] shadow-sm'
              : isDark
              ? 'bg-[#181a20] text-[#555] border-[#252830] cursor-not-allowed opacity-50'
              : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
          }`}
        >
          <Download className={`w-3.5 h-3.5 ${isDark ? 'text-[#00adb5]' : 'text-[#0284c7]'}`} />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
