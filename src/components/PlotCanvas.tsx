import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import Plot from 'react-plotly.js';
import {
  Move,
  ZoomIn,
  Grid,
  Crosshair,
  RotateCcw,
  Sliders,
  Flame,
  SplitSquareVertical,
  SplitSquareHorizontal,
  GripHorizontal,
  GripVertical,
  MousePointer,
} from 'lucide-react';
import { Dataset, PlotPresetId, ThemeMode, PlotSettings } from '../types';
import { applyTransforms, detectPeaks } from '../core/transforms';

interface PlotCanvasProps {
  datasets: Dataset[];
  activeDatasetId: string | null;
  selectedPointIndex: number | null;
  onSelectPoint: (index: number | null) => void;
  activePreset: PlotPresetId;
  theme: ThemeMode;
  plotSettings: PlotSettings;
  onOpenFiles: () => void;
}

export const PlotCanvas: React.FC<PlotCanvasProps> = ({
  datasets,
  activeDatasetId,
  selectedPointIndex,
  onSelectPoint,
  activePreset,
  theme,
  plotSettings,
  onOpenFiles,
}) => {
  // Interaction & tool toggles: Pan, Box Zoom, or Point Selection Cursor
  const [interactionMode, setInteractionMode] = useState<'pan' | 'zoom' | 'select'>('pan');
  const [showGrid, setShowGrid] = useState(true);
  const [showCrosshair, setShowCrosshair] = useState(false);
  const [showPeaks, setShowPeaks] = useState(false);

  // Plotly UI revision counter to preserve smooth zoom across updates
  const [uiRevision, setUiRevision] = useState<number>(1);

  // Reference lines
  const [showVLine, setShowVLine] = useState(false);
  const [vLineX, setVLineX] = useState<number | null>(null);
  const [showHLine, setShowHLine] = useState(false);
  const [hLineY, setHLineY] = useState<number | null>(null);

  // Dragging state for reference lines
  const [isDraggingVLine, setIsDraggingVLine] = useState(false);
  const [isDraggingHLine, setIsDraggingHLine] = useState(false);

  const plotContainerRef = useRef<HTMLDivElement>(null);
  const coordHudRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  const visibleDatasets = useMemo(() => datasets.filter((d) => d.isVisible), [datasets]);

  // Construct processed Plotly traces with active transforms
  const { plotData, defaultXRange, defaultYRange, allPeaks } = useMemo(() => {
    const traces: any[] = [];
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    const detectedPeakList: { x: number; y: number; datasetName: string }[] = [];

    visibleDatasets.forEach((ds) => {
      const rawX = ds.data[ds.selectedX] || [];

      ds.selectedY.forEach((yCol) => {
        const rawY = ds.data[yCol] || [];
        const { x: xVals, y: baseTransformedY } = applyTransforms(
          rawX,
          rawY,
          ds.activeTransforms,
          ds.transformParams
        );

        const yVals = baseTransformedY.map((y) =>
          typeof y === 'number' ? y * ds.yMultiplier + ds.yOffset : y
        );

        // Track bounding extents
        xVals.forEach((x, i) => {
          if (typeof x === 'number' && !isNaN(x)) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
          }
          const y = yVals[i];
          if (typeof y === 'number' && !isNaN(y)) {
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        });

        // Run peak finding if toggled
        if (showPeaks && xVals.length > 5) {
          const peaks = detectPeaks(xVals, yVals, 15, 0.05);
          peaks.forEach((pk) => {
            detectedPeakList.push({
              x: pk.x,
              y: pk.y,
              datasetName: ds.name,
            });
          });
        }

        // Trace styles based on plotStyle and presets
        let mode: 'lines' | 'markers' | 'lines+markers' = 'lines';
        if (activePreset === 'scatter' || ds.plotStyle === 'markers') {
          mode = 'markers';
        } else if (activePreset === 'line_scatter' || ds.plotStyle === 'lines+markers') {
          mode = 'lines+markers';
        } else if (ds.plotStyle === 'lines') {
          mode = 'lines';
        }

        const trace: any = {
          x: xVals,
          y: yVals,
          name: `${ds.name} - ${yCol}`,
          type: 'scatter',
          mode: mode,
          line: {
            color: ds.color,
            width: ds.lineWidth,
            dash: ds.lineDash || 'solid',
          },
          marker: {
            color: ds.color,
            size: ds.markerSize || 6,
            symbol: ds.markerSymbol || 'circle',
          },
          fill:
            activePreset === 'area' || ds.plotStyle === 'area'
              ? 'tozeroy'
              : undefined,
          fillcolor:
            activePreset === 'area' || ds.plotStyle === 'area'
              ? `${ds.color}25`
              : undefined,
          opacity: ds.opacity,
          hoverlabel: {
            bgcolor: isDark ? '#1a1c22' : '#ffffff',
            bordercolor: ds.color,
            font: { family: 'JetBrains Mono', size: 12, color: isDark ? '#ffffff' : '#000000' },
          },
        };

        traces.push(trace);
      });
    });

    // Add peak annotations trace
    if (showPeaks && detectedPeakList.length > 0) {
      traces.push({
        x: detectedPeakList.map((p) => p.x),
        y: detectedPeakList.map((p) => p.y),
        mode: 'markers+text',
        type: 'scatter',
        name: 'Peaks Detected',
        text: detectedPeakList.map((p) => ` ${p.y.toFixed(2)}`),
        textposition: 'top center',
        textfont: { family: 'JetBrains Mono', size: 10, color: '#ea580c' },
        marker: {
          symbol: 'triangle-down',
          size: 11,
          color: '#ea580c',
        },
        hoverinfo: 'text',
      });
    }

    // Add Data Selection Cursor Marker (Only when Selection Tool is active)
    if (interactionMode === 'select' && selectedPointIndex !== null) {
      const activeDs = visibleDatasets.find((d) => d.id === activeDatasetId) || visibleDatasets[0];
      if (activeDs && selectedPointIndex >= 0 && selectedPointIndex < activeDs.rowCount) {
        const selX = activeDs.data[activeDs.selectedX]?.[selectedPointIndex];
        activeDs.selectedY.forEach((yCol) => {
          const selY = activeDs.data[yCol]?.[selectedPointIndex];
          if (typeof selX === 'number' && typeof selY === 'number') {
            traces.push({
              x: [selX],
              y: [selY + activeDs.yOffset],
              mode: 'markers+text',
              type: 'scatter',
              name: 'Data Selection Cursor',
              text: [`Row #${selectedPointIndex + 1}`],
              textposition: 'top center',
              textfont: {
                family: 'JetBrains Mono',
                size: 11,
                color: isDark ? '#ffeb3b' : '#b45309',
              },
              marker: {
                symbol: 'circle-open',
                size: 16,
                color: '#ff9800',
                line: {
                  width: 3.5,
                  color: isDark ? '#ffeb3b' : '#d97706',
                },
              },
              hoverinfo: 'text',
              hovertext: `Selected Row #${selectedPointIndex + 1}: X=${selX}, Y=${selY}`,
              showlegend: false,
            });
          }
        });
      }
    }

    return {
      plotData: traces,
      defaultXRange: minX !== Infinity ? [minX, maxX] : undefined,
      defaultYRange: minY !== Infinity ? [minY, maxY] : undefined,
      allPeaks: detectedPeakList,
    };
  }, [visibleDatasets, activeDatasetId, selectedPointIndex, interactionMode, activePreset, showPeaks, isDark]);

  const effectiveVLineX = vLineX ?? (defaultXRange ? (defaultXRange[0] + defaultXRange[1]) / 2 : 0);
  const effectiveHLineY = hLineY ?? (defaultYRange ? (defaultYRange[0] + defaultYRange[1]) / 2 : 0);

  // Direct DOM-based continuous cursor coordinate reader (only active when showCrosshair is true)
  const handleMouseMoveOverPlot = (e: React.MouseEvent<HTMLDivElement>) => {
    if (interactionMode === 'select') {
      if (coordHudRef.current) {
        coordHudRef.current.innerHTML = selectedPointIndex !== null
          ? `<span class="text-[#ff9800] font-semibold">Selection Active: Row #${selectedPointIndex + 1}</span>`
          : `<span class="text-[#00adb5] font-semibold">Select Tool Active: Click data point</span>`;
      }
      return;
    }

    if (!showCrosshair) {
      if (coordHudRef.current) {
        coordHudRef.current.innerHTML = `<span class="text-[#6b7280]">Crosshairs disabled</span>`;
      }
      return;
    }

    const plotDiv: any = plotContainerRef.current?.querySelector('.js-plotly-plot');
    if (plotDiv && plotDiv._fullLayout) {
      const xaxis = plotDiv._fullLayout.xaxis;
      const yaxis = plotDiv._fullLayout.yaxis;
      if (xaxis && yaxis) {
        const rect = plotDiv.getBoundingClientRect();
        const clientX = e.clientX - rect.left - xaxis._offset;
        const clientY = e.clientY - rect.top - yaxis._offset;

        if (clientX >= 0 && clientX <= xaxis._length && clientY >= 0 && clientY <= yaxis._length) {
          const xVal = xaxis.p2c(clientX);
          const yVal = yaxis.p2c(clientY);
          if (coordHudRef.current) {
            coordHudRef.current.innerHTML = `<span>X: <strong class="text-[#00adb5]">${xVal.toFixed(
              4
            )}</strong> | Y: <strong class="text-[#ff9800]">${yVal.toFixed(4)}</strong></span>`;
          }
          return;
        }
      }
    }

    if (coordHudRef.current) {
      coordHudRef.current.innerHTML = `<span class="text-[#888]">Hover on plot space</span>`;
    }
  };

  // Convert data coordinates to pixel coordinates for interactive draggable line overlay
  const getLinePixelPositions = useCallback(() => {
    const plotDiv: any = plotContainerRef.current?.querySelector('.js-plotly-plot');
    if (!plotDiv || !plotDiv._fullLayout) return { pxX: null, pxY: null, plotRect: null };
    const xaxis = plotDiv._fullLayout.xaxis;
    const yaxis = plotDiv._fullLayout.yaxis;
    if (!xaxis || !yaxis) return { pxX: null, pxY: null, plotRect: null };

    const pxX = xaxis._offset + xaxis.c2p(effectiveVLineX);
    const pxY = yaxis._offset + yaxis.c2p(effectiveHLineY);
    const plotRect = {
      left: xaxis._offset,
      top: yaxis._offset,
      width: xaxis._length,
      height: yaxis._length,
    };
    return { pxX, pxY, plotRect };
  }, [effectiveVLineX, effectiveHLineY]);

  const [linePixels, setLinePixels] = useState<{
    pxX: number | null;
    pxY: number | null;
    plotRect: { left: number; top: number; width: number; height: number } | null;
  }>({ pxX: null, pxY: null, plotRect: null });

  // Update line pixels on resize/redraw
  useEffect(() => {
    const timer = setTimeout(() => {
      setLinePixels(getLinePixelPositions());
    }, 50);
    return () => clearTimeout(timer);
  }, [getLinePixelPositions, visibleDatasets, showVLine, showHLine]);

  // Window mouse move / up listeners for reference line dragging
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      const plotDiv: any = plotContainerRef.current?.querySelector('.js-plotly-plot');
      if (!plotDiv || !plotDiv._fullLayout) return;
      const xaxis = plotDiv._fullLayout.xaxis;
      const yaxis = plotDiv._fullLayout.yaxis;
      if (!xaxis || !yaxis) return;

      const rect = plotDiv.getBoundingClientRect();
      const clientX = e.clientX - rect.left - xaxis._offset;
      const clientY = e.clientY - rect.top - yaxis._offset;

      if (isDraggingVLine) {
        const clampedX = Math.max(0, Math.min(xaxis._length, clientX));
        const newXVal = xaxis.p2c(clampedX);
        setVLineX(newXVal);
      }

      if (isDraggingHLine) {
        const clampedY = Math.max(0, Math.min(yaxis._length, clientY));
        const newYVal = yaxis.p2c(clampedY);
        setHLineY(newYVal);
      }
    };

    const handleWindowMouseUp = () => {
      setIsDraggingVLine(false);
      setIsDraggingHLine(false);
    };

    if (isDraggingVLine || isDraggingHLine) {
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isDraggingVLine, isDraggingHLine]);

  const handleRelayout = () => {
    setTimeout(() => {
      setLinePixels(getLinePixelPositions());
    }, 20);
  };

  const handleResetPlot = () => {
    // Increment uirevision to reset Plotly axes ranges back to data extent
    setUiRevision((rev) => rev + 1);
    const plotDiv: any = plotContainerRef.current?.querySelector('.js-plotly-plot');
    if (plotDiv) {
      (window as any).Plotly?.relayout(plotDiv, {
        'xaxis.autorange': true,
        'yaxis.autorange': true,
      });
    }
    setTimeout(() => {
      setLinePixels(getLinePixelPositions());
    }, 50);
  };

  const primaryXTitle = plotSettings.xAxisTitle || visibleDatasets[0]?.selectedX || 'X-Axis';
  const primaryYTitle =
    plotSettings.yAxisTitle || visibleDatasets[0]?.selectedY?.join(', ') || 'Intensity / Value';
  const plotTitle = plotSettings.title || '';

  const isLogY = activePreset === 'log_y' || activePreset === 'log_log';
  const isLogX = activePreset === 'log_log';

  return (
    <div
      ref={plotContainerRef}
      onMouseMove={handleMouseMoveOverPlot}
      className={`relative w-full h-full flex flex-col select-none overflow-hidden transition-colors duration-200 ${
        isDark ? 'bg-[#121316]' : 'bg-[#ffffff]'
      }`}
    >
      {/* 1. Custom Interactive Toolbar */}
      <div
        className={`h-11 border-b px-4 flex items-center justify-between text-xs z-10 select-none transition-colors ${
          isDark ? 'bg-[#181a20]/90 border-[#2a2d37]' : 'bg-[#f8fafc] border-[#e2e8f0]'
        }`}
      >
        {/* Left tools: Mode & Nav & Reset */}
        <div className="flex items-center gap-1.5">
          <div
            className={`flex items-center gap-1 p-0.5 rounded-lg border ${
              isDark ? 'bg-[#121316] border-[#2a2d37]' : 'bg-slate-100 border-[#cbd5e1]'
            }`}
          >
            {/* Pan Mode */}
            <button
              onClick={() => setInteractionMode('pan')}
              className={`p-1.5 rounded transition-all ${
                interactionMode === 'pan'
                  ? isDark
                    ? 'bg-[#00adb5] text-black shadow-sm font-semibold'
                    : 'bg-[#0284c7] text-white shadow-sm font-semibold'
                  : isDark
                  ? 'text-[#8b949e] hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Pan Mode (Click & drag to move curve)"
            >
              <Move className="w-3.5 h-3.5" />
            </button>

            {/* Box Zoom Mode */}
            <button
              onClick={() => setInteractionMode('zoom')}
              className={`p-1.5 rounded transition-all ${
                interactionMode === 'zoom'
                  ? isDark
                    ? 'bg-[#00adb5] text-black shadow-sm font-semibold'
                    : 'bg-[#0284c7] text-white shadow-sm font-semibold'
                  : isDark
                  ? 'text-[#8b949e] hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Box Zoom Mode (Click & drag rectangular area)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            {/* Data Point Select Tool */}
            <button
              onClick={() => setInteractionMode('select')}
              className={`p-1.5 rounded transition-all flex items-center gap-1 ${
                interactionMode === 'select'
                  ? isDark
                    ? 'bg-[#ff9800] text-black shadow-sm font-bold'
                    : 'bg-amber-500 text-white shadow-sm font-bold'
                  : isDark
                  ? 'text-[#8b949e] hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Data Selection Tool (Click a data point to select & inspect in table)"
            >
              <MousePointer className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Dedicated Plot Reset Button */}
          <button
            onClick={handleResetPlot}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[11px] font-medium transition-all ${
              isDark
                ? 'bg-[#20232c] hover:bg-[#282c37] text-white border-[#3a3f4d] shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-800 border-[#cbd5e1] shadow-sm'
            }`}
            title="Reset View / Auto-Fit Data (Fits all data points)"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isDark ? 'text-[#00adb5]' : 'text-[#0284c7]'}`} />
            <span>Reset View</span>
          </button>
        </div>

        {/* Center tools: Grid, Crosshair, Reference Lines, Peaks */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] transition-all ${
              showGrid
                ? isDark
                  ? 'bg-[#242731] border-[#00adb5]/40 text-white'
                  : 'bg-sky-50 border-sky-400 text-sky-950 font-semibold shadow-xs'
                : isDark
                ? 'bg-transparent border-[#2a2d37] text-[#8b949e] hover:text-white'
                : 'bg-transparent border-[#cbd5e1] text-slate-600 hover:text-slate-900'
            }`}
            title="Toggle Gridlines"
          >
            <Grid className={`w-3 h-3 ${isDark ? 'text-[#00adb5]' : 'text-[#0284c7]'}`} />
            <span>Grid</span>
          </button>

          <button
            onClick={() => {
              const nextVal = !showCrosshair;
              setShowCrosshair(nextVal);
              if (!nextVal && coordHudRef.current && interactionMode !== 'select') {
                coordHudRef.current.innerHTML = `<span class="text-[#6b7280]">Crosshairs disabled</span>`;
              }
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] transition-all ${
              showCrosshair
                ? isDark
                  ? 'bg-[#242731] border-[#00adb5]/40 text-white font-medium'
                  : 'bg-sky-50 border-sky-400 text-sky-950 font-semibold shadow-xs'
                : isDark
                ? 'bg-transparent border-[#2a2d37] text-[#8b949e] hover:text-white'
                : 'bg-transparent border-[#cbd5e1] text-slate-600 hover:text-slate-900'
            }`}
            title="Toggle Cursor Crosshairs & Coordinate Reader"
          >
            <Crosshair className={`w-3 h-3 ${isDark ? 'text-[#00adb5]' : 'text-[#0284c7]'}`} />
            <span>Crosshairs</span>
          </button>

          {/* V-Line with manual edit */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowVLine(!showVLine)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] transition-all ${
                showVLine
                  ? 'bg-[#00adb5]/20 border-[#00adb5] text-[#00adb5] font-medium'
                  : isDark
                  ? 'bg-transparent border-[#2a2d37] text-[#8b949e] hover:text-white'
                  : 'bg-transparent border-[#cbd5e1] text-slate-600 hover:text-slate-900'
              }`}
              title="Toggle Vertical Line (Click & drag on plot or enter value)"
            >
              <SplitSquareVertical className="w-3 h-3" />
              <span>V-Line</span>
            </button>

            {showVLine && (
              <input
                type="number"
                step="0.01"
                value={effectiveVLineX}
                onChange={(e) => setVLineX(parseFloat(e.target.value) || 0)}
                className={`w-16 font-mono text-center border rounded px-1 py-0.5 text-[11px] text-[#00adb5] focus:outline-none focus:border-[#00adb5] ${
                  isDark ? 'bg-[#121316] border-[#2e323e]' : 'bg-white border-[#cbd5e1]'
                }`}
                title="Enter custom V-Line X coordinate manually"
              />
            )}
          </div>

          {/* H-Line with manual edit */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowHLine(!showHLine)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] transition-all ${
                showHLine
                  ? 'bg-[#ff9800]/20 border-[#ff9800] text-[#ff9800] font-medium'
                  : isDark
                  ? 'bg-transparent border-[#2a2d37] text-[#8b949e] hover:text-white'
                  : 'bg-transparent border-[#cbd5e1] text-slate-600 hover:text-slate-900'
              }`}
              title="Toggle Horizontal Line (Click & drag on plot or enter value)"
            >
              <SplitSquareHorizontal className="w-3 h-3" />
              <span>H-Line</span>
            </button>

            {showHLine && (
              <input
                type="number"
                step="0.01"
                value={effectiveHLineY}
                onChange={(e) => setHLineY(parseFloat(e.target.value) || 0)}
                className={`w-16 font-mono text-center border rounded px-1 py-0.5 text-[11px] text-[#ff9800] focus:outline-none focus:border-[#ff9800] ${
                  isDark ? 'bg-[#121316] border-[#2e323e]' : 'bg-white border-[#cbd5e1]'
                }`}
                title="Enter custom H-Line Y coordinate manually"
              />
            )}
          </div>

          <button
            onClick={() => setShowPeaks(!showPeaks)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] transition-all ${
              showPeaks
                ? isDark
                  ? 'bg-[#ff9800]/20 border-[#ff9800] text-[#ff9800] font-medium'
                  : 'bg-amber-50 border-amber-400 text-amber-900 font-semibold shadow-xs'
                : isDark
                ? 'bg-transparent border-[#2a2d37] text-[#8b949e] hover:text-white'
                : 'bg-transparent border-[#cbd5e1] text-slate-600 hover:text-slate-900'
            }`}
            title="Auto-detect & label prominent peaks"
          >
            <Flame className="w-3 h-3 text-[#ea580c]" />
            <span>Find Peaks</span>
          </button>
        </div>

        {/* Right tools: Real-time Coordinate HUD */}
        <div
          ref={coordHudRef}
          className={`font-mono text-[11px] px-3 py-1 rounded-lg border min-w-[210px] text-center ${
            isDark
              ? 'bg-[#121316] border-[#2a2d37] text-[#9ca3af]'
              : 'bg-white border-[#cbd5e1] text-slate-800 shadow-xs'
          }`}
        >
          <span className={`${isDark ? 'text-[#6b7280]' : 'text-slate-500'}`}>
            {interactionMode === 'select'
              ? 'Select Tool: Click point to inspect in table'
              : showCrosshair
              ? 'Hover on plot space'
              : 'Crosshairs disabled'}
          </span>
        </div>
      </div>

      {/* 2. Main Plot Area */}
      <div className="flex-1 w-full h-full relative">
        {visibleDatasets.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 text-[#6b7280]">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-xl border ${
                isDark ? 'bg-[#1e2129] border-[#2e323e]' : 'bg-white border-[#cbd5e1]'
              }`}
            >
              <Crosshair className={`w-8 h-8 ${isDark ? 'text-[#00adb5]' : 'text-[#0284c7]'}`} />
            </div>
            <h3 className={`text-base font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              No Data Loaded
            </h3>
            <p className={`text-xs max-w-sm mb-4 ${isDark ? 'text-[#8b949e]' : 'text-slate-500'}`}>
              Drag and drop arbitrary data files anywhere onto the window, or click Open Data to start plotting.
            </p>
            <button
              onClick={onOpenFiles}
              className={`px-4 py-2 font-semibold text-xs rounded-lg shadow-md transition-all active:scale-95 ${
                isDark
                  ? 'bg-[#00adb5] hover:bg-[#00c4cd] text-black shadow-[#00adb5]/20'
                  : 'bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-sky-500/20'
              }`}
            >
              Open Data File(s)
            </button>
          </div>
        ) : (
          <>
            <Plot
              data={plotData}
              layout={{
                uirevision: uiRevision, // Preserves zoom & pan smoothly
                autosize: true,
                dragmode: interactionMode === 'select' ? 'pan' : interactionMode,
                title: plotTitle
                  ? { text: plotTitle, font: { color: isDark ? '#ffffff' : '#0f172a', size: 14 } }
                  : undefined,
                paper_bgcolor: isDark ? '#121316' : '#f8fafc',
                plot_bgcolor: isDark ? '#121316' : '#ffffff',
                margin: { l: 65, r: 35, t: plotTitle ? 50 : 30, b: 55 },
                showlegend:
                  plotSettings.showLegend &&
                  (visibleDatasets.length > 1 ||
                    visibleDatasets.some((d) => d.selectedY.length > 1)),
                legend: {
                  orientation: 'h',
                  yanchor: 'bottom',
                  y: 1.02,
                  xanchor: 'right',
                  x: 1,
                  font: { color: isDark ? '#d1d5db' : '#334155', size: 11 },
                },
                xaxis: {
                  title: {
                    text: primaryXTitle,
                    font: { color: isDark ? '#d1d5db' : '#0f172a', size: 12 },
                  },
                  type: isLogX ? 'log' : 'linear',
                  exponentformat: 'power',
                  showexponent: 'all',
                  dtick: isLogX ? 1 : undefined,
                  showgrid: showGrid,
                  gridcolor: isDark ? '#22252e' : '#e2e8f0',
                  linecolor: isDark ? '#2e323e' : '#475569',
                  tickcolor: isDark ? '#2e323e' : '#475569',
                  tickfont: { color: isDark ? '#8b949e' : '#334155', size: 10 },
                  zeroline: false,
                  showspikes: showCrosshair,
                  spikemode: showCrosshair ? 'across' : undefined,
                  spikesnap: 'cursor',
                  spikethickness: 1,
                  spikecolor: '#888888',
                },
                yaxis: {
                  title: {
                    text: primaryYTitle,
                    font: { color: isDark ? '#d1d5db' : '#0f172a', size: 12 },
                  },
                  type: isLogY ? 'log' : 'linear',
                  exponentformat: 'power',
                  showexponent: 'all',
                  dtick: isLogY ? 1 : undefined,
                  showgrid: showGrid,
                  gridcolor: isDark ? '#22252e' : '#e2e8f0',
                  linecolor: isDark ? '#2e323e' : '#475569',
                  tickcolor: isDark ? '#2e323e' : '#475569',
                  tickfont: { color: isDark ? '#8b949e' : '#334155', size: 10 },
                  zeroline: false,
                  showspikes: showCrosshair,
                  spikemode: showCrosshair ? 'across' : undefined,
                  spikesnap: 'cursor',
                  spikethickness: 1,
                  spikecolor: '#888888',
                },
              }}
              config={{
                responsive: true,
                scrollZoom: true,
                displayModeBar: false,
              }}
              onClick={(eventData: any) => {
                if (interactionMode === 'select' && eventData && eventData.points && eventData.points.length > 0) {
                  const pt = eventData.points[0];
                  const ptIdx = pt.pointIndex ?? pt.pointNumber;
                  if (typeof ptIdx === 'number') {
                    onSelectPoint(ptIdx);
                  }
                }
              }}
              onRelayout={handleRelayout}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
            />

            {/* Interactive Draggable Reference Lines Overlay */}
            {linePixels.plotRect && (
              <div
                className="absolute inset-0 pointer-events-none overflow-hidden"
                style={{
                  left: linePixels.plotRect.left,
                  top: linePixels.plotRect.top,
                  width: linePixels.plotRect.width,
                  height: linePixels.plotRect.height,
                }}
              >
                {/* V-Line */}
                {showVLine && linePixels.pxX !== null && (
                  <div
                    style={{
                      left: linePixels.pxX - linePixels.plotRect.left,
                      top: 0,
                      bottom: 0,
                    }}
                    className="absolute w-0.5 bg-[#00adb5] pointer-events-auto"
                  >
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setIsDraggingVLine(true);
                      }}
                      className="absolute top-2 -left-2.5 px-1.5 py-0.5 bg-[#00adb5] text-black font-mono text-[10px] font-bold rounded cursor-ew-resize shadow-md select-none flex items-center gap-0.5"
                    >
                      <GripVertical className="w-2.5 h-2.5" />
                      <span>X={effectiveVLineX.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* H-Line */}
                {showHLine && linePixels.pxY !== null && (
                  <div
                    style={{
                      top: linePixels.pxY - linePixels.plotRect.top,
                      left: 0,
                      right: 0,
                    }}
                    className="absolute h-0.5 bg-[#ff9800] pointer-events-auto"
                  >
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setIsDraggingHLine(true);
                      }}
                      className="absolute left-2 -top-2.5 px-1.5 py-0.5 bg-[#ff9800] text-black font-mono text-[10px] font-bold rounded cursor-ns-resize shadow-md select-none flex items-center gap-0.5"
                    >
                      <GripHorizontal className="w-2.5 h-2.5" />
                      <span>Y={effectiveHLineY.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
