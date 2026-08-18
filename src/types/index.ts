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
  seriesStyles?: Record<string, SeriesStyle>;

  // Error Bar & Uncertainty settings
  yErrorColumn?: string | null;
  xErrorColumn?: string | null;
  yErrorMap?: Record<string, ErrorSeriesMapping>;
  errorDisplayStyle?: ErrorDisplayStyle;
  errorCapSize?: number;
  errorThickness?: number;
  errorBandOpacity?: number;
  errorCustomColor?: string | null;

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

export interface SeriesStyle {
  color?: string;
  lineDash?: LineDashStyle;
  lineWidth?: number;
  markerSymbol?: MarkerSymbol;
  markerSize?: number;
  plotStyle?: 'lines' | 'markers' | 'lines+markers' | 'area' | 'bar';
  opacity?: number;
}

export type ErrorDisplayStyle = 'bars' | 'band';

export interface ErrorSeriesMapping {
  yErrCol?: string | null;
  xErrCol?: string | null;
}

export interface PlotSettings {
  title: string;
  xAxisTitle: string;
  yAxisTitle: string;
  showLegend: boolean;
  fontSize: number;
  gridColor?: string;
  isLogX?: boolean;
  isLogY?: boolean;
  polarThetaUnit?: 'degrees' | 'radians';
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
  | 'polar'
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

export type PanelId = 'datasets' | 'axes' | 'errors' | 'appearance' | 'transforms' | 'metadata';
export type DockPosition = 'left' | 'right' | 'float' | 'hidden';

export interface PanelConfig {
  id: PanelId;
  title: string;
  dock: DockPosition;
  isCollapsed: boolean;
  floatPos?: { x: number; y: number; width?: number; height?: number };
}

export interface WorkspaceLayout {
  leftWidth: number;
  rightWidth: number;
  panels: Record<PanelId, PanelConfig>;
}

export interface PeakInfo {
  x: number;
  y: number;
  index: number;
}
