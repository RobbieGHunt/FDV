import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { DockContainer, ErrorBarIcon } from './components/DockContainer';
import { FloatingPanel } from './components/panels/FloatingPanel';
import { DatasetsPanel } from './components/panels/DatasetsPanel';
import { AxesPanel } from './components/panels/AxesPanel';
import { ErrorsPanel } from './components/panels/ErrorsPanel';
import { AppearancePanel } from './components/panels/AppearancePanel';
import { TransformsPanel } from './components/panels/TransformsPanel';
import { MetadataPanel } from './components/panels/MetadataPanel';
import { PlotCanvas } from './components/PlotCanvas';
import { DataTable } from './components/DataTable';
import { ScriptEditor } from './components/ScriptEditor';
import { ExportModal } from './components/ExportModal';
import { DropZone } from './components/DropZone';
import { ContextMenu } from './components/ContextMenu';
import {
  Dataset,
  DockPosition,
  PanelConfig,
  PanelId,
  PlotPresetId,
  ThemeMode,
  PlotSettings,
} from './types';
import { parseRawDataFile } from './core/smartDetector';
import { SAMPLE_CSV, SAMPLE_SPECTRA, SAMPLE_XRR, SAMPLE_POLAR } from './core/samples';
import {
  Database,
  Sliders,
  Activity,
  Settings2,
  Wand2,
  Info,
} from 'lucide-react';

declare global {
  interface Window {
    electronAPI?: {
      openFiles: () => Promise<Array<{ path: string; name: string; content: string }>>;
      runPythonScript: (payload: any) => Promise<any>;
      isElectron?: boolean;
    };
  }
}

const DEFAULT_PANEL_CONFIGS: Record<PanelId, PanelConfig> = {
  datasets: { id: 'datasets', title: 'Loaded Datasets', dock: 'left', isCollapsed: false },
  axes: { id: 'axes', title: 'Axes & Columns', dock: 'left', isCollapsed: false },
  errors: { id: 'errors', title: 'Error Bars & Uncertainty', dock: 'right', isCollapsed: false },
  appearance: { id: 'appearance', title: 'Plot Appearance', dock: 'right', isCollapsed: false },
  transforms: { id: 'transforms', title: 'Data Transforms', dock: 'right', isCollapsed: false },
  metadata: { id: 'metadata', title: 'File Metadata', dock: 'right', isCollapsed: false },
};

export const App: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);

  // Undo / Redo History Stack (up to 50 snapshots)
  const [history, setHistory] = useState<Dataset[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const [activeTab, setActiveTab] = useState<'plot' | 'table' | 'script'>(() => {
    try {
      const saved = localStorage.getItem('fdv_active_tab');
      if (saved === 'plot' || saved === 'table' || saved === 'script') return saved;
    } catch (e) {}
    return 'plot';
  });

  const [activePreset, setActivePreset] = useState<PlotPresetId>(() => {
    try {
      const saved = localStorage.getItem('fdv_active_preset');
      if (saved) return saved as PlotPresetId;
    } catch (e) {}
    return 'auto';
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Theme state persisted to LocalStorage
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('fdv_theme_mode');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {}
    return 'dark';
  });

  // Dockable Panels Configuration State with LocalStorage Persistence
  const [panelConfigs, setPanelConfigs] = useState<Record<PanelId, PanelConfig>>(() => {
    try {
      const saved = localStorage.getItem('fdv_panel_configs');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_PANEL_CONFIGS, ...parsed };
      }
    } catch (e) {}
    return DEFAULT_PANEL_CONFIGS;
  });

  // Resizable Left & Right Dock widths
  const [leftDockWidth, setLeftDockWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('fdv_left_dock_width');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 200 && val <= 600) return val;
      }
    } catch (e) {}
    return 280;
  });

  const [rightDockWidth, setRightDockWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('fdv_right_dock_width');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 200 && val <= 600) return val;
      }
    } catch (e) {}
    return 300;
  });

  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  // Save dock layout state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('fdv_panel_configs', JSON.stringify(panelConfigs));
    } catch (e) {}
  }, [panelConfigs]);

  useEffect(() => {
    try {
      localStorage.setItem('fdv_left_dock_width', leftDockWidth.toString());
    } catch (e) {}
  }, [leftDockWidth]);

  useEffect(() => {
    try {
      localStorage.setItem('fdv_right_dock_width', rightDockWidth.toString());
    } catch (e) {}
  }, [rightDockWidth]);

  // Persist Theme & Active Tab & Preset
  useEffect(() => {
    try {
      localStorage.setItem('fdv_theme_mode', theme);
    } catch (e) {}
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('fdv_active_tab', activeTab);
    } catch (e) {}
  }, [activeTab]);

  useEffect(() => {
    try {
      localStorage.setItem('fdv_active_preset', activePreset);
    } catch (e) {}
  }, [activePreset]);

  // Global mouse handlers for dock resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        const newWidth = Math.max(200, Math.min(600, e.clientX));
        setLeftDockWidth(newWidth);
      }
      if (isResizingRight) {
        const newWidth = Math.max(200, Math.min(600, window.innerWidth - e.clientX));
        setRightDockWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };

    if (isResizingLeft || isResizingRight) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingLeft, isResizingRight]);

  const [plotSettings, setPlotSettings] = useState<PlotSettings>({
    title: '',
    xAxisTitle: '',
    yAxisTitle: '',
    showLegend: true,
    fontSize: 12,
  });

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    dataset: Dataset | null;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    dataset: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to commit new datasets state and append to undo/redo history
  const commitDatasets = useCallback(
    (newDatasets: Dataset[]) => {
      setDatasets(newDatasets);
      setHistory((prev) => {
        const upToCurrent = prev.slice(0, historyIndex + 1);
        const nextStack = [...upToCurrent, newDatasets];
        if (nextStack.length > 50) nextStack.shift();
        return nextStack;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 49));
    },
    [historyIndex]
  );

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    const nextIdx = historyIndex - 1;
    const targetSnapshot = history[nextIdx];
    if (targetSnapshot) {
      setHistoryIndex(nextIdx);
      setDatasets(targetSnapshot);
      if (activeDatasetId && !targetSnapshot.some((d) => d.id === activeDatasetId)) {
        setActiveDatasetId(targetSnapshot.length > 0 ? targetSnapshot[0].id : null);
      }
    }
  }, [canUndo, history, historyIndex, activeDatasetId]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    const nextIdx = historyIndex + 1;
    const targetSnapshot = history[nextIdx];
    if (targetSnapshot) {
      setHistoryIndex(nextIdx);
      setDatasets(targetSnapshot);
      if (activeDatasetId && !targetSnapshot.some((d) => d.id === activeDatasetId)) {
        setActiveDatasetId(targetSnapshot.length > 0 ? targetSnapshot[0].id : null);
      }
    }
  }, [canRedo, history, historyIndex, activeDatasetId]);

  // Global keyboard shortcuts for Undo (Ctrl+Z) and Redo (Ctrl+Y / Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Panel layout manipulation handlers
  const handleToggleCollapse = (id: PanelId) => {
    setPanelConfigs((prev) => ({
      ...prev,
      [id]: { ...prev[id], isCollapsed: !prev[id].isCollapsed },
    }));
  };

  const handleMoveDock = (id: PanelId, target: DockPosition) => {
    setPanelConfigs((prev) => ({
      ...prev,
      [id]: { ...prev[id], dock: target },
    }));
  };

  const handleClosePanel = (id: PanelId) => {
    setPanelConfigs((prev) => ({
      ...prev,
      [id]: { ...prev[id], dock: 'hidden' },
    }));
  };

  const handleTogglePanelVisibility = (id: PanelId) => {
    setPanelConfigs((prev) => {
      const current = prev[id].dock;
      const isVisible = current !== 'hidden';
      return {
        ...prev,
        [id]: { ...prev[id], dock: isVisible ? 'hidden' : 'left' },
      };
    });
  };

  const handleApplyLayoutPreset = (preset: 'default' | 'focused' | 'reset') => {
    if (preset === 'default') {
      // Balanced: Distribute only currently visible panels evenly across left and right
      setPanelConfigs((prev) => {
        const visiblePanelIds = (Object.keys(prev) as PanelId[]).filter(
          (pid) => prev[pid].dock !== 'hidden'
        );
        const next = { ...prev };
        visiblePanelIds.forEach((pid, idx) => {
          next[pid] = {
            ...next[pid],
            dock: idx % 2 === 0 ? 'left' : 'right',
          };
        });
        return next;
      });
      setLeftDockWidth(280);
      setRightDockWidth(280);
    } else if (preset === 'focused') {
      // Focused: Move all currently visible panels to Left dock (so right collapses and canvas maximizes)
      setPanelConfigs((prev) => {
        const next = { ...prev };
        (Object.keys(prev) as PanelId[]).forEach((pid) => {
          if (next[pid].dock !== 'hidden') {
            next[pid] = { ...next[pid], dock: 'left' };
          }
        });
        return next;
      });
      setLeftDockWidth(280);
    } else if (preset === 'reset') {
      localStorage.removeItem('fdv_panel_configs');
      localStorage.removeItem('fdv_left_dock_width');
      localStorage.removeItem('fdv_right_dock_width');
      setPanelConfigs(DEFAULT_PANEL_CONFIGS);
      setLeftDockWidth(280);
      setRightDockWidth(300);
    }
  };

  // Initial Load: sample data
  useEffect(() => {
    const initialDatasets: Dataset[] = [];
    const spectraDataset = parseRawDataFile(SAMPLE_SPECTRA, 'sample_spectra.txt', 0);
    initialDatasets.push(spectraDataset);

    const xrrDataset = parseRawDataFile(SAMPLE_XRR, 'sample_XRR.xy', 1);
    xrrDataset.isVisible = false;
    initialDatasets.push(xrrDataset);

    const csvDataset = parseRawDataFile(SAMPLE_CSV, 'sample_data_basic.csv', 2);
    csvDataset.isVisible = false;
    initialDatasets.push(csvDataset);

    setDatasets(initialDatasets);
    setActiveDatasetId(spectraDataset.id);
    setHistory([initialDatasets]);
    setHistoryIndex(0);
  }, []);

  // Native & Drag-and-Drop file open
  const handleOpenFiles = async () => {
    if (window.electronAPI?.openFiles) {
      try {
        const files = await window.electronAPI.openFiles();
        if (files && files.length > 0) {
          const newDatasets = files.map((f, i) =>
            parseRawDataFile(f.content, f.name, datasets.length + i, f.path)
          );
          const updated = [...datasets, ...newDatasets];
          commitDatasets(updated);
          setActiveDatasetId(newDatasets[0].id);
        }
      } catch (err) {
        console.error('Failed to open files via Electron API:', err);
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleNativeFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newDatasets: Dataset[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const content = await file.text();
      const ds = parseRawDataFile(content, file.name, datasets.length + i);
      newDatasets.push(ds);
    }

    if (newDatasets.length > 0) {
      const updated = [...datasets, ...newDatasets];
      commitDatasets(updated);
      setActiveDatasetId(newDatasets[0].id);
    }
    e.target.value = '';
  };

  const handleLoadSample = (sampleType: 'csv' | 'spectra' | 'xrr' | 'polar') => {
    let content = SAMPLE_CSV;
    let name = 'sample_basic.csv';
    if (sampleType === 'spectra') {
      content = SAMPLE_SPECTRA;
      name = 'sample_spectra.txt';
    } else if (sampleType === 'xrr') {
      content = SAMPLE_XRR;
      name = 'sample_xrr.xy';
    } else if (sampleType === 'polar') {
      content = SAMPLE_POLAR;
      name = 'sample_polar_figure_eight.csv';
    }

    const parsed = parseRawDataFile(content, name, datasets.length);
    if (sampleType === 'polar') {
      setActivePreset('polar');
      if (parsed.columns.includes('theta_deg')) {
        parsed.selectedX = 'theta_deg';
        parsed.selectedY = parsed.columns.filter((c) => c.startsWith('r_') && c !== 'r_err');
      }
    }
    const updated = [...datasets, parsed];
    commitDatasets(updated);
    setActiveDatasetId(parsed.id);
  };

  // Dataset State Modifications with Undo/Redo commit
  const handleUpdateDataset = (id: string, updates: Partial<Dataset>) => {
    const updated = datasets.map((d) => (d.id === id ? { ...d, ...updates } : d));
    commitDatasets(updated);
  };

  const handleRemoveDataset = (id: string) => {
    const filtered = datasets.filter((d) => d.id !== id);
    if (activeDatasetId === id) {
      setActiveDatasetId(filtered.length > 0 ? filtered[0].id : null);
    }
    commitDatasets(filtered);
  };

  const handleDuplicateDataset = (id: string) => {
    const src = datasets.find((d) => d.id === id);
    if (!src) return;
    const duplicated: Dataset = {
      ...src,
      id: `dataset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${src.name} (Copy)`,
      yOffset: src.yOffset + 0.1,
    };
    const updated = [...datasets, duplicated];
    commitDatasets(updated);
    setActiveDatasetId(duplicated.id);
  };

  const activeDataset = datasets.find((d) => d.id === activeDatasetId) || datasets[0] || null;
  const hasLeftPanels = Object.values(panelConfigs).some((p) => p.dock === 'left');
  const hasRightPanels = Object.values(panelConfigs).some((p) => p.dock === 'right');

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

  const renderFloatingPanelContent = (id: PanelId) => {
    switch (id) {
      case 'datasets':
        return (
          <DatasetsPanel
            datasets={datasets}
            activeDatasetId={activeDatasetId}
            theme={theme}
            onSelectDataset={setActiveDatasetId}
            onUpdateDataset={handleUpdateDataset}
            onDeleteDataset={handleRemoveDataset}
            onAddFiles={handleOpenFiles}
            onContextMenu={(e, dataset) => {
              e.preventDefault();
              setContextMenu({
                isOpen: true,
                x: e.clientX,
                y: e.clientY,
                dataset,
              });
            }}
          />
        );
      case 'axes':
        return (
          <AxesPanel
            activeDataset={activeDataset}
            theme={theme}
            plotSettings={plotSettings}
            activePreset={activePreset}
            onUpdateDataset={handleUpdateDataset}
            onUpdatePlotSettings={(updates) =>
              setPlotSettings((prev) => ({ ...prev, ...updates }))
            }
          />
        );
      case 'errors':
        return (
          <ErrorsPanel
            activeDataset={activeDataset}
            theme={theme}
            onUpdateDataset={handleUpdateDataset}
          />
        );
      case 'appearance':
        return (
          <AppearancePanel
            activeDataset={activeDataset}
            theme={theme}
            onUpdateDataset={handleUpdateDataset}
          />
        );
      case 'transforms':
        return (
          <TransformsPanel
            activeDataset={activeDataset}
            theme={theme}
            onUpdateDataset={handleUpdateDataset}
          />
        );
      case 'metadata':
        return (
          <MetadataPanel
            activeDataset={activeDataset}
            theme={theme}
          />
        );
    }
  };

  return (
    <div
      className={`w-screen h-screen flex flex-col overflow-hidden font-sans select-none transition-colors duration-200 ${
        theme === 'dark' ? 'bg-[#121316] text-[#e1e4e8]' : 'bg-[#f8fafc] text-slate-800'
      }`}
    >
      {/* Hidden File Input for browser fallback */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleNativeFileInputChange}
        multiple
        accept=".csv,.tsv,.txt,.xy,.dat,.asc"
        className="hidden"
      />

      {/* 1. Header Navigation Bar with Panels Menu & Undo/Redo Tools */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        onOpenFiles={handleOpenFiles}
        onLoadSample={handleLoadSample}
        onExport={() => setIsExportOpen(true)}
        datasetCount={datasets.length}
        activePreset={activePreset}
        onSelectPreset={setActivePreset}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        panelConfigs={panelConfigs}
        onTogglePanelVisibility={handleTogglePanelVisibility}
        onMovePanelDock={handleMoveDock}
        onApplyLayoutPreset={handleApplyLayoutPreset}
      />

      {/* 2. Main Workspace Layout with Left Dock, Center Canvas, and Right Dock */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Resizable Dock Container (or Slim Drop Target when empty) */}
        <div
          style={hasLeftPanels ? { width: leftDockWidth } : undefined}
          className={`flex-shrink-0 h-full overflow-hidden flex ${hasLeftPanels ? '' : 'w-10'}`}
        >
          <DockContainer
            dock="left"
            panelConfigs={panelConfigs}
            datasets={datasets}
            activeDatasetId={activeDatasetId}
            theme={theme}
            plotSettings={plotSettings}
            activePreset={activePreset}
            onUpdatePlotSettings={(updates) =>
              setPlotSettings((prev) => ({ ...prev, ...updates }))
            }
            onSelectDataset={setActiveDatasetId}
            onUpdateDataset={handleUpdateDataset}
            onDeleteDataset={handleRemoveDataset}
            onAddFiles={handleOpenFiles}
            onContextMenu={(e, dataset) => {
              e.preventDefault();
              setContextMenu({
                isOpen: true,
                x: e.clientX,
                y: e.clientY,
                dataset,
              });
            }}
            onToggleCollapse={handleToggleCollapse}
            onMoveDock={handleMoveDock}
            onClosePanel={handleClosePanel}
          />
        </div>

        {/* Draggable Vertical Splitter Handle for Left Dock */}
        {hasLeftPanels && (
          <div
            onMouseDown={() => setIsResizingLeft(true)}
            className={`w-1 hover:w-1.5 h-full cursor-col-resize z-20 transition-all flex items-center justify-center select-none ${
              theme === 'dark'
                ? 'bg-[#2a2d37] hover:bg-[#00adb5]'
                : 'bg-[#cbd5e1] hover:bg-[#0284c7]'
            }`}
            title="Drag to resize left dock"
          />
        )}

        {/* Center Content View (Plot Canvas, Tabular Inspector, or Script Editor) */}
        <div className="flex-1 h-full overflow-hidden flex flex-col min-w-0">
          {activeTab === 'plot' && (
            <PlotCanvas
              datasets={datasets}
              activeDatasetId={activeDatasetId}
              selectedPointIndex={selectedPointIndex}
              onSelectPoint={setSelectedPointIndex}
              plotSettings={plotSettings}
              activePreset={activePreset}
              theme={theme}
              onOpenFiles={handleOpenFiles}
              onLoadSample={handleLoadSample}
            />
          )}

          {activeTab === 'table' && (
            <DataTable
              datasets={datasets}
              activeDatasetId={activeDatasetId}
              selectedPointIndex={selectedPointIndex}
              onSelectPoint={setSelectedPointIndex}
              onUpdateDataset={handleUpdateDataset}
              onSelectDataset={setActiveDatasetId}
              theme={theme}
            />
          )}

          {activeTab === 'script' && (
            <ScriptEditor
              datasets={datasets}
              activeDatasetId={activeDatasetId}
              plotSettings={plotSettings}
              activePreset={activePreset}
              theme={theme}
              onUpdatePlotSettings={(updates) =>
                setPlotSettings((prev) => ({ ...prev, ...updates }))
              }
              onSelectPreset={setActivePreset}
              onRunScript={(code, type) => {
                console.log(`Executed ${type} script:`, code);
              }}
            />
          )}
        </div>

        {/* Draggable Vertical Splitter Handle for Right Dock */}
        {hasRightPanels && (
          <div
            onMouseDown={() => setIsResizingRight(true)}
            className={`w-1 hover:w-1.5 h-full cursor-col-resize z-20 transition-all flex items-center justify-center select-none ${
              theme === 'dark'
                ? 'bg-[#2a2d37] hover:bg-[#00adb5]'
                : 'bg-[#cbd5e1] hover:bg-[#0284c7]'
            }`}
            title="Drag to resize right dock"
          />
        )}

        {/* Right Resizable Dock Container (or Slim Drop Target when empty) */}
        <div
          style={hasRightPanels ? { width: rightDockWidth } : undefined}
          className={`flex-shrink-0 h-full overflow-hidden flex ${hasRightPanels ? '' : 'w-10'}`}
        >
          <DockContainer
            dock="right"
            panelConfigs={panelConfigs}
            datasets={datasets}
            activeDatasetId={activeDatasetId}
            theme={theme}
            plotSettings={plotSettings}
            activePreset={activePreset}
            onUpdatePlotSettings={(updates) =>
              setPlotSettings((prev) => ({ ...prev, ...updates }))
            }
            onSelectDataset={setActiveDatasetId}
            onUpdateDataset={handleUpdateDataset}
            onDeleteDataset={handleRemoveDataset}
            onAddFiles={handleOpenFiles}
            onContextMenu={(e, dataset) => {
              e.preventDefault();
              setContextMenu({
                isOpen: true,
                x: e.clientX,
                y: e.clientY,
                dataset,
              });
            }}
            onToggleCollapse={handleToggleCollapse}
            onMoveDock={handleMoveDock}
            onClosePanel={handleClosePanel}
          />
        </div>

        {/* 3. Floating Windows Layer */}
        {(Object.keys(panelConfigs) as PanelId[])
          .filter((pid) => panelConfigs[pid].dock === 'float')
          .map((pid) => {
            const conf = panelConfigs[pid];
            return (
              <FloatingPanel
                key={pid}
                id={pid}
                title={conf.title}
                icon={getPanelIcon(pid)}
                theme={theme}
                initialPos={
                  conf.floatPos || {
                    x: 120 + Math.random() * 80,
                    y: 80 + Math.random() * 50,
                    width: 320,
                  }
                }
                onMoveDock={(target) => handleMoveDock(pid, target)}
                onClose={() => handleClosePanel(pid)}
                onUpdatePos={(pos) =>
                  setPanelConfigs((prev) => ({
                    ...prev,
                    [pid]: { ...prev[pid], floatPos: pos },
                  }))
                }
              >
                {renderFloatingPanelContent(pid)}
              </FloatingPanel>
            );
          })}
      </div>

      {/* 4. Drag and Drop Overlay Indicator */}
      <DropZone isDragging={isDragging} />

      {/* 5. Right-Click Context Menu */}
      {contextMenu.isOpen && contextMenu.dataset && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          dataset={contextMenu.dataset}
          onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
          onUpdate={(updates) => {
            if (contextMenu.dataset) {
              handleUpdateDataset(contextMenu.dataset.id, updates);
            }
          }}
          onDuplicate={(ds) => {
            handleDuplicateDataset(ds.id);
          }}
          onRename={() => {}}
          onDelete={() => {
            if (contextMenu.dataset) {
              handleRemoveDataset(contextMenu.dataset.id);
            }
          }}
          onExportCSV={() => {}}
        />
      )}

      {/* 6. Publication Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        datasets={datasets}
        activeDatasetId={activeDatasetId}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
};
