export interface ColumnStats {
  min: number | null;
  max: number | null;
  mean: number | null;
  count: number;
}

export type MarkerSymbol =
  | 'circle'
  | 'square'
  | 'diamond'
  | 'cross'
  | 'x'
  | 'triangle-up'
  | 'triangle-down'
  | 'star';

export type LineDashStyle = 'solid' | 'dash' | 'dot' | 'dashdot';

export interface Dataset {
  id: string;
  name: string;
  fileName: string;
  filePath?: string;
  rawText: string;
  columns: string[];
  columnTypes: Record<string, 'number' | 'string'>;
  data: Record<string, (number | string | null)[]>;
  rowCount: number;
  stats: Record<string, ColumnStats>;
  metadata: Record<string, string>;
  detectedDelimiter: string;
  headerRowIndex: number;

  // Display & Plotting settings
  selectedX: string;
  selectedY: string[];
  color: string;
  markerSymbol: MarkerSymbol;
  markerSize: number;
  lineDash: LineDashStyle;
  isVisible: boolean;
  opacity: number;
  lineWidth: number;
  plotStyle: 'lines' | 'markers' | 'lines+markers' | 'area' | 'bar';
  yOffset: number;
  yMultiplier: number;

  // Modular pipelines
  loaderId: string;
  loaderParams: Record<string, any>;
  activeTransforms: string[];
  transformParams: {
    normalize?: { min: number; max: number };
    smooth?: { window: number };
    [key: string]: any;
  };
}

export interface PlotSettings {
  title: string;
  xAxisTitle: string;
  yAxisTitle: string;
  showLegend: boolean;
  fontSize: number;
  gridColor?: string;
}

export interface PlotTemplate {
  id: string;
  name: string;
  description: string;
  plotPreset: PlotPresetId;
  plotSettings: PlotSettings;
  defaultTransforms: string[];
  customScript: string;
  isBuiltIn?: boolean;
}

export interface LoaderTemplate {
  id: string;
  name: string;
  description: string;
  code: string;
  defaultParams?: Record<string, any>;
  isBuiltIn?: boolean;
}

export interface TransformTemplate {
  id: string;
  name: string;
  description: string;
  code: string;
  isBuiltIn?: boolean;
}

export type ThemeMode = 'dark' | 'light';

export type PlotBackend = 'plotly' | 'canvas';

export type PlotPresetId =
  | 'auto'
  | 'line'
  | 'scatter'
  | 'line_scatter'
  | 'area'
  | 'log_y'
  | 'log_log'
  | 'waterfall'
  | 'derivative';

export interface MarkerLine {
  id: string;
  type: 'x' | 'y';
  value: number;
  color: string;
  label: string;
  visible: boolean;
}

export interface PeakInfo {
  x: number;
  y: number;
  index: number;
}
