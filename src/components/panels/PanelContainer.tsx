import React, { useState, useRef } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Maximize2,
  X,
  GripVertical,
  GripHorizontal,
} from 'lucide-react';
import { DockPosition, PanelId, ThemeMode } from '../../types';

interface PanelContainerProps {
  id: PanelId;
  title: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  isCollapsed: boolean;
  dock: DockPosition;
  theme: ThemeMode;
  onToggleCollapse: () => void;
  onMoveDock: (target: DockPosition) => void;
  onClose: () => void;
  children: React.ReactNode;
}

export const PanelContainer: React.FC<PanelContainerProps> = ({
  id,
  title,
  icon,
  badge,
  isCollapsed,
  dock,
  theme,
  onToggleCollapse,
  onMoveDock,
  onClose,
  children,
}) => {
  const isDark = theme === 'dark';
  const [isDragging, setIsDragging] = useState(false);
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);
  const isResizingRef = useRef(false);

  const handleStartResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;
    const startY = e.clientY;
    const startH = contentHeight || 220;

    const handleMouseMove = (moveEvt: MouseEvent) => {
      if (!isResizingRef.current) return;
      const dy = moveEvt.clientY - startY;
      const newH = Math.max(70, Math.min(850, startH + dy));
      setContentHeight(newH);
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={`w-full rounded-xl border overflow-hidden transition-all shadow-sm flex flex-col flex-shrink-0 ${
        isDragging ? 'opacity-40 border-dashed border-[#00adb5]' : ''
      } ${
        isDark ? 'bg-[#1a1c22] border-[#2a2d37]' : 'bg-white border-[#e2e8f0]'
      }`}
    >
      {/* 1. Panel Header Bar */}
      <div
        className={`px-2.5 py-2 flex items-center justify-between select-none ${
          isDark ? 'bg-[#14161b]' : 'bg-[#f1f5f9]'
        }`}
      >
        {/* Left: Drag Grip Handle & Title */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {/* Top-Only Drag Handle for Cross-Dock Moving */}
          <div
            draggable={dock !== 'float'}
            onDragStart={(e) => {
              setIsDragging(true);
              e.dataTransfer.setData('text/plain', id);
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDragEnd={() => {
              setIsDragging(false);
            }}
            className="cursor-grab active:cursor-grabbing p-0.5 -ml-1 text-[#6b7280] hover:text-white transition-colors"
            title="Drag from top handle to move between Left and Right Docks"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          <div
            onClick={onToggleCollapse}
            className="flex items-center gap-1.5 cursor-pointer flex-1 min-w-0"
            title="Click to collapse / expand"
          >
            {isCollapsed ? (
              <ChevronRight className={`w-3 h-3 flex-shrink-0 ${isDark ? 'text-[#8b949e]' : 'text-slate-500'}`} />
            ) : (
              <ChevronDown className={`w-3 h-3 flex-shrink-0 ${isDark ? 'text-[#8b949e]' : 'text-slate-500'}`} />
            )}
            <span className={`flex-shrink-0 ${isDark ? 'text-[#00adb5]' : 'text-[#0284c7]'}`}>
              {icon}
            </span>
            <span
              className={`font-semibold text-[11px] uppercase tracking-wider truncate ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {title}
            </span>
          </div>
        </div>

        {/* Right: Badges & Quick Float / Close Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {badge}

          {/* Float button (if docked) */}
          {dock !== 'float' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveDock('float');
              }}
              className={`p-1 rounded transition-colors ${
                isDark
                  ? 'hover:bg-[#2e323e] text-[#8b949e] hover:text-white'
                  : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
              }`}
              title="Pop out as Free-Floating Window"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          )}

          {/* Close / Hide button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className={`p-1 rounded transition-colors ${
              isDark
                ? 'hover:bg-red-500/20 text-[#8b949e] hover:text-red-400'
                : 'hover:bg-red-100 text-slate-500 hover:text-red-600'
            }`}
            title="Close Panel (re-open from top 'Panels' menu)"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 2. Panel Body: Scrollable & vertically adaptive */}
      {!isCollapsed && (
        <>
          <div
            style={contentHeight ? { height: contentHeight, maxHeight: contentHeight } : undefined}
            className={`p-3 overflow-y-auto ${!contentHeight ? 'max-h-[55vh]' : ''}`}
          >
            {children}
          </div>

          {/* 3. Bottom-Only Vertical Resize Bar */}
          <div
            onMouseDown={handleStartResize}
            onDoubleClick={() => setContentHeight(undefined)}
            className={`h-2 flex items-center justify-center cursor-row-resize select-none border-t transition-colors ${
              isDark
                ? 'border-[#232731] hover:bg-[#00adb5]/20 text-[#4b5563] hover:text-[#00adb5]'
                : 'border-slate-100 hover:bg-[#0284c7]/15 text-slate-400 hover:text-[#0284c7]'
            }`}
            title="Drag up/down to vertically resize panel. Double-click to reset height."
          >
            <GripHorizontal className="w-3 h-3 opacity-60" />
          </div>
        </>
      )}
    </div>
  );
};
