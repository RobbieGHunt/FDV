import React, { useEffect, useRef, useState } from 'react';
import {
  Palette,
  Shapes,
  Eye,
  Copy,
  Trash2,
  Download,
  Edit2,
  Activity,
  CircleDot,
  TrendingUp,
} from 'lucide-react';
import { Dataset, MarkerSymbol, LineDashStyle } from '../types';

interface ContextMenuProps {
  x: number;
  y: number;
  dataset: Dataset;
  onClose: () => void;
  onUpdate: (updates: Partial<Dataset>) => void;
  onDuplicate: (dataset: Dataset) => void;
  onRename: () => void;
  onDelete: () => void;
  onExportCSV: () => void;
}

const PALETTE = [
  '#00adb5',
  '#ff5722',
  '#2196f3',
  '#4caf50',
  '#e91e63',
  '#9c27b0',
  '#ff9800',
  '#00bcd4',
  '#f44336',
  '#ffeb3b',
  '#ffffff',
  '#aaaaaa',
];

const SYMBOLS: { id: MarkerSymbol; label: string }[] = [
  { id: 'circle', label: 'Circle' },
  { id: 'square', label: 'Square' },
  { id: 'diamond', label: 'Diamond' },
  { id: 'cross', label: 'Cross' },
  { id: 'triangle-up', label: 'Triangle' },
  { id: 'star', label: 'Star' },
];

const DASH_STYLES: { id: LineDashStyle; label: string }[] = [
  { id: 'solid', label: 'Solid' },
  { id: 'dash', label: 'Dashed' },
  { id: 'dot', label: 'Dotted' },
  { id: 'dashdot', label: 'Dash-Dot' },
];

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  dataset,
  onClose,
  onUpdate,
  onDuplicate,
  onRename,
  onDelete,
  onExportCSV,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [customColor, setCustomColor] = useState(dataset.color);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Adjust positioning if near screen edges
  const adjustedX = Math.min(x, window.innerWidth - 260);
  const adjustedY = Math.min(y, window.innerHeight - 440);

  return (
    <div
      ref={menuRef}
      style={{ left: adjustedX, top: adjustedY }}
      className="fixed z-50 w-64 bg-[#1a1c22] border border-[#2e323e] rounded-xl shadow-2xl p-1.5 text-xs text-[#e1e4e8] select-none animate-fade-in divide-y divide-[#2a2d37]"
    >
      {/* Title */}
      <div className="px-2.5 py-1.5 font-semibold text-[11px] text-[#8b949e] truncate flex items-center justify-between">
        <span className="truncate">{dataset.name}</span>
        <span className="text-[10px] text-[#00adb5] font-mono">{dataset.rowCount} pts</span>
      </div>

      {/* Colors Swatches + Arbitrary Color Input */}
      <div className="py-1.5 px-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#6b7280] uppercase font-semibold">Plot Color</span>
          <span className="text-[10px] text-[#8b949e] font-mono">{dataset.color}</span>
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => {
                onUpdate({ color: c });
                setCustomColor(c);
              }}
              style={{ backgroundColor: c }}
              className={`w-5 h-5 rounded-md border transition-transform hover:scale-110 ${
                dataset.color === c ? 'border-white scale-105 shadow' : 'border-transparent'
              }`}
              title={c}
            />
          ))}
        </div>
        <div className="flex items-center gap-1.5 pt-1">
          <input
            type="color"
            value={dataset.color.startsWith('#') ? dataset.color : '#00adb5'}
            onChange={(e) => {
              onUpdate({ color: e.target.value });
              setCustomColor(e.target.value);
            }}
            className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent p-0 flex-shrink-0"
            title="Custom color picker"
          />
          <input
            type="text"
            placeholder="#Hex or rgb(...)"
            value={customColor}
            onChange={(e) => {
              setCustomColor(e.target.value);
              onUpdate({ color: e.target.value });
            }}
            className="flex-1 bg-[#121316] border border-[#2e323e] rounded px-2 py-0.5 font-mono text-[11px] text-white focus:outline-none focus:border-[#00adb5]"
          />
        </div>
      </div>

      {/* Symbol & Marker Size */}
      <div className="py-1.5 px-1 space-y-1.5">
        <div className="flex items-center justify-between px-1.5">
          <span className="text-[10px] text-[#6b7280] uppercase font-semibold">Marker Symbol</span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-[#8b949e]">Size:</span>
            <input
              type="number"
              min="1"
              max="25"
              value={dataset.markerSize || 6}
              onChange={(e) =>
                onUpdate({ markerSize: Math.max(1, parseInt(e.target.value) || 6) })
              }
              className="w-10 bg-[#121316] border border-[#2e323e] rounded text-center text-[10px] font-mono text-white py-0.2"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1 px-1">
          {SYMBOLS.map((sym) => (
            <button
              key={sym.id}
              onClick={() => {
                onUpdate({ markerSymbol: sym.id });
              }}
              className={`px-1.5 py-1 rounded text-[11px] text-center transition-colors ${
                dataset.markerSymbol === sym.id
                  ? 'bg-[#00adb5] text-black font-semibold'
                  : 'bg-[#14161b] text-[#9ca3af] hover:text-white'
              }`}
            >
              {sym.label}
            </button>
          ))}
        </div>
      </div>

      {/* Line Dash Style */}
      <div className="py-1.5 px-1 space-y-1">
        <span className="text-[10px] text-[#6b7280] uppercase font-semibold px-1.5">Line Style</span>
        <div className="grid grid-cols-2 gap-1 px-1">
          {DASH_STYLES.map((dash) => (
            <button
              key={dash.id}
              onClick={() => {
                onUpdate({ lineDash: dash.id });
              }}
              className={`px-2 py-1 rounded text-[11px] text-center transition-colors ${
                dataset.lineDash === dash.id
                  ? 'bg-[#00adb5] text-black font-semibold'
                  : 'bg-[#14161b] text-[#9ca3af] hover:text-white'
              }`}
            >
              {dash.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions: Rename, Duplicate, Export CSV, Delete */}
      <div className="py-1 space-y-0.5">
        <button
          onClick={() => {
            onRename();
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-[#242731] text-[#9ca3af] hover:text-white transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5 text-[#00adb5]" />
          <span>Rename Dataset</span>
        </button>

        <button
          onClick={() => {
            onDuplicate(dataset);
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-[#242731] text-[#9ca3af] hover:text-white transition-colors"
        >
          <Copy className="w-3.5 h-3.5 text-[#2196f3]" />
          <span>Duplicate Dataset</span>
        </button>

        <button
          onClick={() => {
            onExportCSV();
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-[#242731] text-[#9ca3af] hover:text-white transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-[#ff9800]" />
          <span>Export CSV</span>
        </button>

        <button
          onClick={() => {
            onDelete();
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Dataset</span>
        </button>
      </div>
    </div>
  );
};
