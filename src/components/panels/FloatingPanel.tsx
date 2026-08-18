import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  X,
  GripHorizontal,
  Minus,
  Plus,
} from 'lucide-react';
import { DockPosition, PanelId, ThemeMode } from '../../types';

interface FloatingPanelProps {
  id: PanelId;
  title: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  theme: ThemeMode;
  initialPos?: { x: number; y: number; width?: number };
  onMoveDock: (target: DockPosition) => void;
  onClose: () => void;
  onUpdatePos?: (pos: { x: number; y: number }) => void;
  children: React.ReactNode;
}

export const FloatingPanel: React.FC<FloatingPanelProps> = ({
  id,
  title,
  icon,
  badge,
  theme,
  initialPos = { x: 100, y: 100, width: 320 },
  onMoveDock,
  onClose,
  onUpdatePos,
  children,
}) => {
  const isDark = theme === 'dark';
  const [pos, setPos] = useState({ x: initialPos.x, y: initialPos.y });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0,
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag from header bar, not buttons
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: pos.x,
      startY: pos.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      const newX = Math.max(10, Math.min(window.innerWidth - 200, dragStartRef.current.startX + dx));
      const newY = Math.max(50, Math.min(window.innerHeight - 80, dragStartRef.current.startY + dy));
      setPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onUpdatePos?.(pos);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, pos, onUpdatePos]);

  return (
    <div
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: `${initialPos.width || 320}px`,
        zIndex: 50,
      }}
      className={`fixed rounded-xl border shadow-2xl overflow-hidden backdrop-blur-md transition-shadow select-none ${
        isDark
          ? 'bg-[#181a20]/95 border-[#2e323e] text-white shadow-black/60'
          : 'bg-white/95 border-slate-300 text-slate-900 shadow-slate-400/50'
      }`}
    >
      {/* Floating Window Title Bar */}
      <div
        onMouseDown={handleMouseDown}
        className={`px-3 py-2 flex items-center justify-between cursor-move ${
          isDark ? 'bg-[#121316] border-b border-[#2a2d37]' : 'bg-[#f1f5f9] border-b border-[#e2e8f0]'
        }`}
      >
        {/* Title & Icon */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <GripHorizontal className={`w-3.5 h-3.5 opacity-40 ${isDark ? 'text-white' : 'text-slate-900'}`} />
          <span className={`flex-shrink-0 ${isDark ? 'text-[#00adb5]' : 'text-[#0284c7]'}`}>
            {icon}
          </span>
          <span className="font-semibold text-xs truncate uppercase tracking-wider">{title}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {badge}

          {/* Dock Left */}
          <button
            onClick={() => onMoveDock('left')}
            className={`p-1 rounded transition-colors ${
              isDark ? 'hover:bg-[#2e323e] text-[#8b949e] hover:text-white' : 'hover:bg-slate-200 text-slate-600'
            }`}
            title="Snap to Left Dock"
          >
            <ArrowLeft className="w-3 h-3" />
          </button>

          {/* Dock Right */}
          <button
            onClick={() => onMoveDock('right')}
            className={`p-1 rounded transition-colors ${
              isDark ? 'hover:bg-[#2e323e] text-[#8b949e] hover:text-white' : 'hover:bg-slate-200 text-slate-600'
            }`}
            title="Snap to Right Dock"
          >
            <ArrowRight className="w-3 h-3" />
          </button>

          {/* Minimize toggle */}
          <button
            onClick={() => setIsMinimized((v) => !v)}
            className={`p-1 rounded transition-colors ${
              isDark ? 'hover:bg-[#2e323e] text-[#8b949e] hover:text-white' : 'hover:bg-slate-200 text-slate-600'
            }`}
            title={isMinimized ? 'Expand Window' : 'Minimize Window'}
          >
            {isMinimized ? <Plus className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className={`p-1 rounded transition-colors ${
              isDark ? 'hover:bg-red-500/20 text-[#8b949e] hover:text-red-400' : 'hover:bg-red-100 text-slate-600 hover:text-red-600'
            }`}
            title="Close Floating Window"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Floating Window Body */}
      {!isMinimized && (
        <div className="p-3 max-h-[70vh] overflow-y-auto">{children}</div>
      )}
    </div>
  );
};
