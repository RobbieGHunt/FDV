import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  Table,
  LineChart,
  Code2,
  FolderOpen,
  Sun,
  Moon,
  Undo2,
  Redo2,
  ChevronDown,
  LayoutGrid,
  Database,
  Sliders,
  Activity,
  Settings2,
  Wand2,
  Info,
  Check,
  FileText,
} from 'lucide-react';
import {
  DockPosition,
  PanelConfig,
  PanelId,
  PlotPresetId,
  ThemeMode,
} from '../types';
import { PLOT_PRESETS } from '../core/presets';
import { ErrorBarIcon } from './DockContainer';

interface HeaderProps {
  activeTab: 'plot' | 'table' | 'script';
  setActiveTab: (tab: 'plot' | 'table' | 'script') => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenFiles: () => void;
  onLoadSample: (sampleType: 'csv' | 'spectra' | 'xrr' | 'polar') => void;
  onExport: () => void;
  datasetCount: number;
  activePreset: PlotPresetId;
  onSelectPreset: (preset: PlotPresetId) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;

  // Panel layout controls
  panelConfigs: Record<PanelId, PanelConfig>;
  onTogglePanelVisibility: (id: PanelId) => void;
  onMovePanelDock: (id: PanelId, target: DockPosition) => void;
  onApplyLayoutPreset: (preset: 'default' | 'focused' | 'reset') => void;
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
  panelConfigs,
  onTogglePanelVisibility,
  onMovePanelDock,
  onApplyLayoutPreset,
}) => {
  const isDark = theme === 'dark';

  // Dropdown states
  const [isOpenMenuOpen, setIsOpenMenuOpen] = useState(false);
  const [isPanelsMenuOpen, setIsPanelsMenuOpen] = useState(false);

  const openMenuRef = useRef<HTMLDivElement>(null);
  const panelsMenuRef = useRef<HTMLDivElement>(null);

  // Click outside listeners
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openMenuRef.current && !openMenuRef.current.contains(e.target as Node)) {
        setIsOpenMenuOpen(false);
      }
      if (panelsMenuRef.current && !panelsMenuRef.current.contains(e.target as Node)) {
        setIsPanelsMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPanelIcon = (id: PanelId) => {
    switch (id) {
      case 'datasets':
        return <Database className="w-3.5 h-3.5" />;
      case 'axes':
        return <Sliders className="w-3.5 h-3.5" />;
      case 'errors':
        return <ErrorBarIcon />;
      case 'appearance':
        return <Settings2 className="w-3.5 h-3.5" />;
      case 'transforms':
        return <Wand2 className="w-3.5 h-3.5 text-[#ff9800]" />;
      case 'metadata':
        return <Info className="w-3.5 h-3.5 text-[#0284c7]" />;
    }
  };

  const getDockBadge = (dock: DockPosition) => {
    switch (dock) {
      case 'left':
        return (
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-medium ${
            isDark ? 'bg-[#00adb5]/20 text-[#00adb5]' : 'bg-sky-100 text-sky-700'
          }`}>
            Left
          </span>
        );
      case 'right':
        return (
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-medium ${
            isDark ? 'bg-[#ff9800]/20 text-[#ff9800]' : 'bg-amber-100 text-amber-800'
          }`}>
            Right
          </span>
        );
      case 'float':
        return (
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-medium ${
            isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
          }`}>
            Floating
          </span>
        );
      case 'hidden':
        return (
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-medium ${
            isDark ? 'bg-[#2a2d37] text-[#6b7280]' : 'bg-slate-200 text-slate-500'
          }`}>
            Hidden
          </span>
        );
    }
  };

  return (
    <header
      className={`h-14 border-b px-4 flex items-center justify-between select-none z-30 transition-colors duration-200 ${
        isDark ? 'bg-[#181a20] border-[#2a2d37]' : 'bg-[#f8fafc] border-[#e2e8f0]'
      }`}
    >
      {/* Left: Brand / Title & Undo/Redo & Open Data Split Dropdown */}
      <div className="flex items-center gap-2.5">
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
            <div className="flex items-center gap-1.5">
              <span
                className={`font-bold text-sm tracking-wide font-mono ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                FDV
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-semibold tracking-wider uppercase ${
                  isDark ? 'bg-[#00adb5]/20 text-[#00adb5]' : 'bg-sky-100 text-sky-700'
                }`}
              >
                App
              </span>
            </div>
          </div>
        </div>

        {/* Undo / Redo History Controls */}
        <div className="flex items-center gap-1 ml-0.5">
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
        <div className={`h-5 w-[1px] mx-0.5 ${isDark ? 'bg-[#2e323e]' : 'bg-[#cbd5e1]'}`} />

        {/* Open Data Split Dropdown (With Demo Samples submenu) */}
        <div className="relative" ref={openMenuRef}>
          <div className="flex items-center rounded-md shadow-sm overflow-hidden">
            <button
              onClick={onOpenFiles}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold text-xs transition-all active:scale-95 ${
                isDark
                  ? 'bg-[#00adb5] hover:bg-[#00c4cd] text-black'
                  : 'bg-[#0284c7] hover:bg-[#0369a1] text-white'
              }`}
              title="Open or Drag-and-Drop data files"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Open Data</span>
            </button>
            <button
              onClick={() => setIsOpenMenuOpen((v) => !v)}
              className={`px-1.5 py-1.5 border-l transition-colors ${
                isDark
                  ? 'bg-[#00adb5] hover:bg-[#00c4cd] text-black border-black/20'
                  : 'bg-[#0284c7] hover:bg-[#0369a1] text-white border-white/20'
              }`}
              title="Open file options & sample data"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Open Data Dropdown Menu */}
          {isOpenMenuOpen && (
            <div
              className={`absolute left-0 mt-1.5 w-60 rounded-xl border shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 ${
                isDark ? 'bg-[#181a20] border-[#2e323e] text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              <button
                onClick={() => {
                  setIsOpenMenuOpen(false);
                  onOpenFiles();
                }}
                className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors ${
                  isDark ? 'hover:bg-[#242731]' : 'hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-3.5 h-3.5 text-[#00adb5]" />
                  <span className="font-semibold">Open Local Files...</span>
                </div>
                <span className={`text-[10px] font-mono ${isDark ? 'text-[#6b7280]' : 'text-slate-400'}`}>Ctrl+O</span>
              </button>

              <div className={`my-1 border-t ${isDark ? 'border-[#2a2d37]' : 'border-slate-200'}`} />

              <div className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-[#6b7280]' : 'text-slate-400'}`}>
                Load Demo Datasets
              </div>

              <button
                onClick={() => {
                  setIsOpenMenuOpen(false);
                  onLoadSample('spectra');
                }}
                className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 transition-colors ${
                  isDark ? 'hover:bg-[#242731]' : 'hover:bg-slate-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-[#0284c7]" />
                <div>
                  <div className="font-medium">UV-Vis Spectra (.txt)</div>
                  <div className={`text-[10px] ${isDark ? 'text-[#6b7280]' : 'text-slate-500'}`}>Teal dye demo absorption</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsOpenMenuOpen(false);
                  onLoadSample('xrr');
                }}
                className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 transition-colors ${
                  isDark ? 'hover:bg-[#242731]' : 'hover:bg-slate-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-[#ff9800]" />
                <div>
                  <div className="font-medium">XRR Reflectivity (.xy)</div>
                  <div className={`text-[10px] ${isDark ? 'text-[#6b7280]' : 'text-slate-500'}`}>Wide dynamic range curve</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsOpenMenuOpen(false);
                  onLoadSample('csv');
                }}
                className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 transition-colors ${
                  isDark ? 'hover:bg-[#242731]' : 'hover:bg-slate-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-[#4caf50]" />
                <div>
                  <div className="font-medium">Multi-Curve Basic (.csv)</div>
                  <div className={`text-[10px] ${isDark ? 'text-[#6b7280]' : 'text-slate-500'}`}>Multiple series benchmark</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsOpenMenuOpen(false);
                  onLoadSample('polar');
                }}
                className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 transition-colors ${
                  isDark ? 'hover:bg-[#242731]' : 'hover:bg-slate-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-[#e91e63]" />
                <div>
                  <div className="font-medium">Polar Figure Eight (.csv)</div>
                  <div className={`text-[10px] ${isDark ? 'text-[#6b7280]' : 'text-slate-500'}`}>Lemniscate (r, θ) Loops</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Panels Dropdown Menu */}
        <div className="relative" ref={panelsMenuRef}>
          <button
            onClick={() => setIsPanelsMenuOpen((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md border transition-all ${
              isPanelsMenuOpen
                ? isDark
                  ? 'bg-[#242731] border-[#00adb5] text-white'
                  : 'bg-sky-50 border-[#0284c7] text-[#0284c7]'
                : isDark
                ? 'bg-[#20232c] hover:bg-[#282c37] text-[#d1d5db] border-[#3a3f4d]'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-[#cbd5e1] shadow-xs'
            }`}
            title="Configure dockable panels and workspace layout"
          >
            <LayoutGrid className={`w-3.5 h-3.5 ${isDark ? 'text-[#00adb5]' : 'text-[#0284c7]'}`} />
            <span>Panels</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {/* Panels Dropdown Card */}
          {isPanelsMenuOpen && (
            <div
              className={`absolute left-0 mt-1.5 w-72 rounded-xl border shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 ${
                isDark ? 'bg-[#181a20] border-[#2e323e] text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              <div className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between ${
                isDark ? 'text-[#8b949e]' : 'text-slate-500'
              }`}>
                <span>Active Panels & Docking</span>
                <span>Location</span>
              </div>

              {/* Panel List */}
              <div className="space-y-1 my-1">
                {(Object.keys(panelConfigs) as PanelId[]).map((id) => {
                  const conf = panelConfigs[id];
                  const isVisible = conf.dock !== 'hidden';

                  return (
                    <div
                      key={id}
                      onClick={() => onTogglePanelVisibility(id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                        isVisible
                          ? isDark
                            ? 'bg-[#242731] text-white'
                            : 'bg-slate-100 text-slate-900 font-medium'
                          : isDark
                          ? 'text-[#6b7280] hover:bg-[#20232c]'
                          : 'text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isVisible
                              ? isDark
                                ? 'bg-[#00adb5] border-[#00adb5] text-black'
                                : 'bg-[#0284c7] border-[#0284c7] text-white'
                              : isDark
                              ? 'border-[#3a3f4d]'
                              : 'border-slate-300'
                          }`}
                        >
                          {isVisible && <Check className="w-3 h-3" />}
                        </div>
                        <span className={`flex-shrink-0 ${isDark ? 'text-[#00adb5]' : 'text-[#0284c7]'}`}>
                          {getPanelIcon(id)}
                        </span>
                        <span className="text-xs">{conf.title}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {getDockBadge(conf.dock)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={`my-2 border-t ${isDark ? 'border-[#2a2d37]' : 'border-slate-200'}`} />

              {/* Workspace Presets */}
              <div className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                isDark ? 'text-[#8b949e]' : 'text-slate-500'
              }`}>
                Workspace Presets
              </div>

              <div className="space-y-1 mt-1">
                <button
                  onClick={() => {
                    onApplyLayoutPreset('default');
                    setIsPanelsMenuOpen(false);
                  }}
                  className={`w-full px-2 py-1.5 text-left text-xs rounded-md transition-colors ${
                    isDark ? 'hover:bg-[#242731] text-[#d1d5db]' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  ✦ Balanced Split (Left + Right Docks)
                </button>
                <button
                  onClick={() => {
                    onApplyLayoutPreset('focused');
                    setIsPanelsMenuOpen(false);
                  }}
                  className={`w-full px-2 py-1.5 text-left text-xs rounded-md transition-colors ${
                    isDark ? 'hover:bg-[#242731] text-[#d1d5db]' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  ✦ Focused Plot View (Left Dock Only)
                </button>
                <button
                  onClick={() => {
                    onApplyLayoutPreset('reset');
                    setIsPanelsMenuOpen(false);
                  }}
                  className={`w-full px-2 py-1.5 text-left text-xs rounded-md text-red-400 hover:text-red-300 transition-colors ${
                    isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50 text-red-600'
                  }`}
                >
                  ↺ Reset All Panels to Default
                </button>
              </div>
            </div>
          )}
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
