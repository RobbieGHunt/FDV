import React, { useState } from 'react';
import {
  Database,
  Sliders,
  Settings2,
  Wand2,
  Info,
} from 'lucide-react';
import {
  Dataset,
  DockPosition,
  PanelConfig,
  PanelId,
  PlotSettings,
  ThemeMode,
} from '../types';
import { PanelContainer } from './panels/PanelContainer';
import { DatasetsPanel } from './panels/DatasetsPanel';
import { AxesPanel } from './panels/AxesPanel';
import { ErrorsPanel } from './panels/ErrorsPanel';
import { AppearancePanel } from './panels/AppearancePanel';
import { TransformsPanel } from './panels/TransformsPanel';
import { MetadataPanel } from './panels/MetadataPanel';

export const ErrorBarIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <line x1="12" y1="3" x2="12" y2="21" />
    <line x1="6" y1="3" x2="18" y2="3" />
    <line x1="6" y1="21" x2="18" y2="21" />
    <circle cx="12" cy="12" r="2.5" fill="currentColor" />
  </svg>
);

interface DockContainerProps {
  dock: 'left' | 'right';
  panelConfigs: Record<PanelId, PanelConfig>;
  datasets: Dataset[];
  activeDatasetId: string | null;
  theme: ThemeMode;
  plotSettings?: PlotSettings;
  activePreset?: string;
  onUpdatePlotSettings?: (updates: Partial<PlotSettings>) => void;
  onSelectDataset: (id: string) => void;
  onUpdateDataset: (id: string, updates: Partial<Dataset>) => void;
  onDeleteDataset: (id: string) => void;
  onAddFiles: () => void;
  onContextMenu: (e: React.MouseEvent, dataset: Dataset) => void;
  onToggleCollapse: (id: PanelId) => void;
  onMoveDock: (id: PanelId, target: DockPosition) => void;
  onClosePanel: (id: PanelId) => void;
}

export const DockContainer: React.FC<DockContainerProps> = ({
  dock,
  panelConfigs,
  datasets,
  activeDatasetId,
  theme,
  plotSettings,
  activePreset,
  onUpdatePlotSettings,
  onSelectDataset,
  onUpdateDataset,
  onDeleteDataset,
  onAddFiles,
  onContextMenu,
  onToggleCollapse,
  onMoveDock,
  onClosePanel,
}) => {
  const isDark = theme === 'dark';
  const [isDragOver, setIsDragOver] = useState(false);
  const activeDataset = datasets.find((d) => d.id === activeDatasetId) || datasets[0] || null;

  // Filter panels assigned to this dock
  const dockedPanels = (Object.keys(panelConfigs) as PanelId[]).filter(
    (pid) => panelConfigs[pid].dock === dock
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const panelId = e.dataTransfer.getData('text/plain') as PanelId;
    if (panelId && panelConfigs[panelId]) {
      onMoveDock(panelId, dock);
    }
  };

  if (dockedPanels.length === 0) {
    return (
      <aside
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-10 h-full border-r border-l border-dashed flex flex-col items-center justify-center p-1.5 text-center transition-all select-none ${
          isDragOver
            ? isDark
              ? 'bg-[#00adb5]/20 border-[#00adb5] text-[#00adb5]'
              : 'bg-sky-100 border-[#0284c7] text-[#0284c7]'
            : isDark
            ? 'bg-[#121316]/40 border-[#2e323e]/40 text-[#6b7280] hover:border-[#00adb5]/50'
            : 'bg-slate-50/50 border-slate-200 text-slate-400 hover:border-[#0284c7]/50'
        }`}
        title={`Drop panel here to dock on the ${dock}`}
      >
        <div className="text-[9px] font-bold uppercase tracking-widest -rotate-90 whitespace-nowrap opacity-60">
          Drop {dock === 'left' ? 'Left' : 'Right'}
        </div>
      </aside>
    );
  }

  const renderPanelContent = (id: PanelId) => {
    switch (id) {
      case 'datasets':
        return (
          <DatasetsPanel
            datasets={datasets}
            activeDatasetId={activeDatasetId}
            theme={theme}
            onSelectDataset={onSelectDataset}
            onUpdateDataset={onUpdateDataset}
            onDeleteDataset={onDeleteDataset}
            onAddFiles={onAddFiles}
            onContextMenu={onContextMenu}
          />
        );
      case 'axes':
        return (
          <AxesPanel
            activeDataset={activeDataset}
            theme={theme}
            plotSettings={plotSettings}
            activePreset={activePreset}
            onUpdateDataset={onUpdateDataset}
            onUpdatePlotSettings={onUpdatePlotSettings}
          />
        );
      case 'errors':
        return (
          <ErrorsPanel
            activeDataset={activeDataset}
            theme={theme}
            onUpdateDataset={onUpdateDataset}
          />
        );
      case 'appearance':
        return (
          <AppearancePanel
            activeDataset={activeDataset}
            theme={theme}
            onUpdateDataset={onUpdateDataset}
          />
        );
      case 'transforms':
        return (
          <TransformsPanel
            activeDataset={activeDataset}
            theme={theme}
            onUpdateDataset={onUpdateDataset}
          />
        );
      case 'metadata':
        return (
          <MetadataPanel
            activeDataset={activeDataset}
            theme={theme}
          />
        );
      default:
        return null;
    }
  };

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

  const getPanelBadge = (id: PanelId) => {
    if (id === 'errors' && activeDataset) {
      const hasError =
        activeDataset.yErrorColumn ||
        activeDataset.xErrorColumn ||
        Object.values(activeDataset.yErrorMap || {}).some((m) => m.yErrCol || m.xErrCol);
      if (hasError) {
        return (
          <span
            className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
              isDark ? 'bg-[#00adb5]/20 text-[#00adb5]' : 'bg-sky-100 text-sky-700'
            }`}
          >
            {activeDataset.errorDisplayStyle === 'band' ? 'Shaded' : 'Whiskers'}
          </span>
        );
      }
    }
    if (id === 'transforms' && activeDataset && activeDataset.activeTransforms.length > 0) {
      return (
        <span
          className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
            isDark ? 'bg-[#ff9800]/20 text-[#ff9800]' : 'bg-amber-100 text-amber-800'
          }`}
        >
          {activeDataset.activeTransforms.length} active
        </span>
      );
    }
    return undefined;
  };

  return (
    <aside
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full h-full flex flex-col overflow-y-auto overflow-x-hidden p-2.5 space-y-2.5 select-none transition-colors ${
        isDragOver ? (isDark ? 'bg-[#1a1c22]/90 ring-2 ring-[#00adb5]' : 'bg-sky-50 ring-2 ring-[#0284c7]') : isDark ? 'bg-[#121316]' : 'bg-[#f8fafc]'
      }`}
    >
      {dockedPanels.map((id) => {
        const conf = panelConfigs[id];
        return (
          <PanelContainer
            key={id}
            id={id}
            title={conf.title}
            icon={getPanelIcon(id)}
            badge={getPanelBadge(id)}
            isCollapsed={conf.isCollapsed}
            dock={dock}
            theme={theme}
            onToggleCollapse={() => onToggleCollapse(id)}
            onMoveDock={(target) => onMoveDock(id, target)}
            onClose={() => onClosePanel(id)}
          >
            {renderPanelContent(id)}
          </PanelContainer>
        );
      })}
    </aside>
  );
};
