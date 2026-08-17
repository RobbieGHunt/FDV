import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PlotCanvas } from './components/PlotCanvas';
import { DataTable } from './components/DataTable';
import { ScriptEditor } from './components/ScriptEditor';
import { ExportModal } from './components/ExportModal';
import { DropZone } from './components/DropZone';
import { ContextMenu } from './components/ContextMenu';
import { Dataset, PlotPresetId, ThemeMode, PlotSettings } from './types';
import { parseRawDataFile } from './core/smartDetector';
import { SAMPLE_CSV, SAMPLE_SPECTRA, SAMPLE_XRR } from './core/samples';

declare global {
  interface Window {
    electronAPI?: {
      openFiles: () => Promise<Array<{ path: string; name: string; content: string }>>;
      runPythonScript: (payload: any) => Promise<any>;
      isElectron?: boolean;
    };
  }
}

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

  // Resizable Sidebar width persisted to LocalStorage
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('fdv_sidebar_width');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 220 && val <= 650) return val;
      }
    } catch (e) {}
    return 320;
  });

  const [isResizingSidebar, setIsResizingSidebar] = useState(false);

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
      setHistory((prevHistory) => {
        const trimmed = prevHistory.slice(0, historyIndex + 1);
        const nextHistory = [...trimmed, newDatasets];
        if (nextHistory.length > 50) {
          nextHistory.shift();
        }
        return nextHistory;
      });
      setHistoryIndex((prevIndex) => {
        const nextIdx = prevIndex + 1;
        return nextIdx >= 50 ? 49 : nextIdx;
      });
    },
    [historyIndex]
  );

  // Undo and Redo actions
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex >= 0 && historyIndex < history.length - 1;

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const targetState = history[prevIndex];
      if (targetState) {
        setHistoryIndex(prevIndex);
        setDatasets(targetState);
        if (targetState.length > 0 && !targetState.some((d) => d.id === activeDatasetId)) {
          setActiveDatasetId(targetState[0].id);
        }
      }
    }
  }, [history, historyIndex, activeDatasetId]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const targetState = history[nextIndex];
      if (targetState) {
        setHistoryIndex(nextIndex);
        setDatasets(targetState);
        if (targetState.length > 0 && !targetState.some((d) => d.id === activeDatasetId)) {
          setActiveDatasetId(targetState[0].id);
        }
      }
    }
  }, [history, historyIndex, activeDatasetId]);

  // Global Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Skip if actively typing inside an input or textarea
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') &&
        (target as HTMLInputElement).type === 'text'
      ) {
        return;
      }

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

  // Sync theme changes to LocalStorage and root document class
  useEffect(() => {
    try {
      localStorage.setItem('fdv_theme_mode', theme);
    } catch (e) {}
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Sync tab & preset to LocalStorage
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

  useEffect(() => {
    try {
      localStorage.setItem('fdv_sidebar_width', sidebarWidth.toString());
    } catch (e) {}
  }, [sidebarWidth]);

  // Load sample dataset on startup if empty
  useEffect(() => {
    if (datasets.length === 0 && history.length === 0) {
      const initialDataset = parseRawDataFile(SAMPLE_SPECTRA, 'sample_spectra.txt', 0);
      setDatasets([initialDataset]);
      setHistory([[initialDataset]]);
      setHistoryIndex(0);
      setActiveDatasetId(initialDataset.id);
    }
  }, []);

  // Resizable Sidebar drag listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingSidebar) return;
      const newWidth = Math.max(220, Math.min(650, e.clientX));
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => {
      if (isResizingSidebar) setIsResizingSidebar(false);
    };

    if (isResizingSidebar) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSidebar]);

  // Global Drag and Drop
  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter++;
      if (e.dataTransfer && e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter = 0;
      setIsDragging(false);

      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const fileList = Array.from(e.dataTransfer.files);
        const newDatasets: Dataset[] = [];

        for (let i = 0; i < fileList.length; i++) {
          const file = fileList[i];
          try {
            const text = await file.text();
            const parsed = parseRawDataFile(text, file.name, datasets.length + i);
            newDatasets.push(parsed);
          } catch (err) {
            console.error('Error reading dropped file:', file.name, err);
          }
        }

        if (newDatasets.length > 0) {
          const updated = [...datasets, ...newDatasets];
          commitDatasets(updated);
          setActiveDatasetId(newDatasets[0].id);
        }
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [datasets, commitDatasets]);

  // File Open Handlers
  const handleOpenFiles = async () => {
    if (window.electronAPI?.openFiles) {
      try {
        const filesData = await window.electronAPI.openFiles();
        if (filesData && filesData.length > 0) {
          const newDatasets: Dataset[] = [];
          for (let i = 0; i < filesData.length; i++) {
            const f = filesData[i];
            const parsed = parseRawDataFile(f.content, f.name, datasets.length + i);
            if (f.path) parsed.filePath = f.path;
            newDatasets.push(parsed);
          }
          if (newDatasets.length > 0) {
            const updated = [...datasets, ...newDatasets];
            commitDatasets(updated);
            setActiveDatasetId(newDatasets[0].id);
          }
        }
      } catch (err) {
        console.error('Error opening files via Electron dialog:', err);
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
      try {
        const text = await file.text();
        const parsed = parseRawDataFile(text, file.name, datasets.length + i);
        newDatasets.push(parsed);
      } catch (err) {
        console.error('Failed to read file:', file.name, err);
      }
    }

    if (newDatasets.length > 0) {
      const updated = [...datasets, ...newDatasets];
      commitDatasets(updated);
      setActiveDatasetId(newDatasets[0].id);
    }
    e.target.value = '';
  };

  const handleLoadSample = (sampleType: 'csv' | 'spectra' | 'xrr') => {
    let content = SAMPLE_CSV;
    let name = 'sample_basic.csv';
    if (sampleType === 'spectra') {
      content = SAMPLE_SPECTRA;
      name = 'sample_spectra.txt';
    } else if (sampleType === 'xrr') {
      content = SAMPLE_XRR;
      name = 'sample_xrr.xy';
    }

    const parsed = parseRawDataFile(content, name, datasets.length);
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

      {/* 1. Header Navigation Bar with Undo/Redo Tools */}
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
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Resizable Sidebar */}
        <div style={{ width: sidebarWidth }} className="flex-shrink-0 h-full overflow-hidden">
          <Sidebar
            datasets={datasets}
            activeDatasetId={activeDatasetId}
            onSelectDataset={setActiveDatasetId}
            onUpdateDataset={handleUpdateDataset}
            onDeleteDataset={handleRemoveDataset}
            onAddFiles={handleOpenFiles}
            theme={theme}
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
        </div>

        {/* Draggable Vertical Splitter Handle */}
        <div
          onMouseDown={() => setIsResizingSidebar(true)}
          className={`w-1 hover:w-1.5 h-full cursor-col-resize z-30 transition-all flex items-center justify-center select-none ${
            theme === 'dark'
              ? 'bg-[#2a2d37] hover:bg-[#00adb5]'
              : 'bg-[#cbd5e1] hover:bg-[#0284c7]'
          }`}
          title="Drag to resize sidebar width"
        />

        {/* Center Content View (Plot Canvas, Tabular Inspector, or Script Editor) */}
        <div className="flex-1 h-full overflow-hidden flex flex-col">
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
      </div>

      {/* 3. Drag and Drop Overlay Indicator */}
      <DropZone isDragging={isDragging} />

      {/* 4. Right-Click Context Menu */}
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

      {/* 5. Publication Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        datasets={datasets}
        activeDatasetId={activeDatasetId}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
};
