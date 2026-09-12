import { PlotTemplate, LoaderTemplate, TransformTemplate } from '../types';

// ==========================================
// 1. PLOT TEMPLATES
// ==========================================

export const BUILTIN_TEMPLATES: PlotTemplate[] = [
  {
    id: 'template_xrr',
    name: 'X-Ray Reflectivity (XRR)',
    description: 'Logarithmic Y-scale for reflectivity decay across orders of magnitude with Q momentum transfer vector.',
    plotPreset: 'line',
    plotSettings: {
      title: 'X-Ray Reflectivity (XRR) Profile',
      xAxisTitle: 'Q (1/Å) or 2-Theta (deg)',
      yAxisTitle: 'Reflectivity R(Q) [Log Scale]',
      showLegend: true,
      fontSize: 12,
      isLogY: true,
    },
    defaultTransforms: [],
    customScript: `"""
X-Ray Reflectivity (XRR) Plotter
Configures high-dynamic-range logarithmic intensity scaling.
"""
import plotly.express as px
import plotly.graph_objects as go

def plot_plotly(df, params):
    fig = go.Figure()
    x_col = params.get("x_column", df.columns[0])
    y_col = params.get("y_column", df.columns[1])
    
    fig.add_trace(go.Scatter(
        x=df[x_col], 
        y=df[y_col], 
        mode="lines", 
        name="Reflectivity",
        line=dict(width=2, color="#00adb5")
    ))
    fig.update_layout(
        template="plotly_dark",
        title="X-Ray Reflectivity (XRR)",
        xaxis=dict(title="Q (1/Å)", showgrid=True),
        yaxis=dict(title="Reflectivity (Log)", type="log", exponentformat="power", showgrid=True)
    )
    return fig
`,
    isBuiltIn: true,
  },
  {
    id: 'template_uvvis',
    name: 'UV-Vis Spectroscopy',
    description: 'Absorption / Transmittance spectra plotted vs Wavelength (nm) with baseline normalization.',
    plotPreset: 'line',
    plotSettings: {
      title: 'UV-Vis Absorption Spectrum',
      xAxisTitle: 'Wavelength (nm)',
      yAxisTitle: 'Absorbance (a.u.)',
      showLegend: true,
      fontSize: 12,
    },
    defaultTransforms: ['baseline_min'],
    customScript: `"""
UV-Vis Spectroscopy Plotter
Plots Absorbance vs Wavelength with peak annotations.
"""
import plotly.graph_objects as go

def plot_plotly(df, params):
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=df[df.columns[0]], 
        y=df[df.columns[1]], 
        mode="lines", 
        name="Absorption",
        line=dict(width=2.5, color="#ff5722")
    ))
    fig.update_layout(
        title="UV-Vis Spectrum",
        xaxis_title="Wavelength (nm)",
        yaxis_title="Absorbance (a.u.)"
    )
    return fig
`,
    isBuiltIn: true,
  },
  {
    id: 'template_xrd',
    name: 'X-Ray Diffraction (XRD)',
    description: 'Diffraction patterns vs 2-Theta (deg) with prominent peak labeling.',
    plotPreset: 'line',
    plotSettings: {
      title: 'X-Ray Diffraction Pattern',
      xAxisTitle: '2-Theta (deg)',
      yAxisTitle: 'Intensity (Counts / a.u.)',
      showLegend: true,
      fontSize: 12,
    },
    defaultTransforms: ['baseline_min'],
    customScript: `"""
XRD Diffractogram Plotter
Plots 2-Theta angle vs Bragg peak intensity.
"""
import plotly.graph_objects as go

def plot_plotly(df, params):
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=df[df.columns[0]], 
        y=df[df.columns[1]], 
        mode="lines", 
        name="Diffraction Peaks"
    ))
    fig.update_layout(title="XRD Pattern", xaxis_title="2-Theta (deg)", yaxis_title="Intensity (counts)")
    return fig
`,
    isBuiltIn: true,
  },
  {
    id: 'template_waterfall',
    name: 'Waterfall / Series Comparison',
    description: 'Vertically stacked multiple curves for comparing temperature or time series.',
    plotPreset: 'waterfall',
    plotSettings: {
      title: 'Series Comparison (Waterfall Stack)',
      xAxisTitle: 'Independent Variable',
      yAxisTitle: 'Intensity (Stacked Offset)',
      showLegend: true,
      fontSize: 12,
    },
    defaultTransforms: ['normalize_01'],
    customScript: `"""
Waterfall Stacked Plotter
Plots multiple datasets with sequential vertical offsets.
"""
import plotly.graph_objects as go
import numpy as np

def plot_plotly(df, params):
    fig = go.Figure()
    if df.empty or len(df.columns) < 2:
        return fig
        
    x_col = params.get("x_column", df.columns[0])
    y_cols = [c for c in df.columns if c != x_col]
    offset_step = float(params.get("offset_step", 0.25))
    
    colors = ["#00adb5", "#ea580c", "#22c55e", "#a855f7", "#3b82f6", "#eab308"]
    
    for idx, col in enumerate(y_cols):
        y_vals = df[col].to_numpy(dtype=float)
        valid_mask = np.isfinite(y_vals)
        if not np.any(valid_mask):
            continue
            
        y_min = np.nanmin(y_vals[valid_mask])
        y_max = np.nanmax(y_vals[valid_mask])
        
        if y_max > y_min:
            y_norm = (y_vals - y_min) / (y_max - y_min)
        else:
            y_norm = np.zeros_like(y_vals)
            
        y_stacked = y_norm + (idx * offset_step)
        color = colors[idx % len(colors)]
        
        fig.add_trace(go.Scatter(
            x=df[x_col],
            y=y_stacked,
            mode="lines",
            name=f"{col} (+{idx * offset_step:.2f})",
            line=dict(color=color, width=2)
        ))
        
    fig.update_layout(
        template="plotly_dark",
        title="Series Comparison (Waterfall Stack)",
        xaxis=dict(title=str(x_col), showgrid=True),
        yaxis=dict(title="Normalized Intensity + Offset", showgrid=True),
        legend=dict(x=1.02, y=1)
    )
    return fig
`,
    isBuiltIn: true,
  },
  {
    id: 'template_linear_default',
    name: 'General Linear Plot',
    description: 'Standard linear XY plot with auto-detected axis titles.',
    plotPreset: 'line',
    plotSettings: {
      title: '',
      xAxisTitle: '',
      yAxisTitle: '',
      showLegend: true,
      fontSize: 12,
    },
    defaultTransforms: [],
    customScript: `"""
General Linear Plotter
Standard responsive Plotly line trace.
"""
import plotly.express as px

def plot_plotly(df, params):
    fig = px.line(df, x=df.columns[0], y=df.columns[1])
    return fig
`,
    isBuiltIn: true,
  },
];

const STORAGE_KEY_PLOTS = 'fdv_custom_plot_templates_v1';
const STORAGE_KEY_LOADERS = 'fdv_custom_loader_templates_v1';
const STORAGE_KEY_TRANSFORMS = 'fdv_custom_transform_templates_v1';

export function getStoredTemplates(): PlotTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PLOTS);
    if (!raw) return BUILTIN_TEMPLATES;
    const userCustom: PlotTemplate[] = JSON.parse(raw);
    return [...BUILTIN_TEMPLATES, ...userCustom];
  } catch (e) {
    return BUILTIN_TEMPLATES;
  }
}

export function saveCustomTemplate(template: PlotTemplate): PlotTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PLOTS);
    const existing: PlotTemplate[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter((t) => t.id !== template.id);
    const next = [...filtered, template];
    localStorage.setItem(STORAGE_KEY_PLOTS, JSON.stringify(next));
    return [...BUILTIN_TEMPLATES, ...next];
  } catch (e) {
    return [...BUILTIN_TEMPLATES, template];
  }
}

export function deleteCustomTemplate(templateId: string): PlotTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PLOTS);
    if (!raw) return BUILTIN_TEMPLATES;
    const existing: PlotTemplate[] = JSON.parse(raw);
    const next = existing.filter((t) => t.id !== templateId);
    localStorage.setItem(STORAGE_KEY_PLOTS, JSON.stringify(next));
    return [...BUILTIN_TEMPLATES, ...next];
  } catch (e) {
    return BUILTIN_TEMPLATES;
  }
}

// ==========================================
// 2. DATA LOADER TEMPLATES
// ==========================================

export const BUILTIN_LOADERS: LoaderTemplate[] = [
  {
    id: 'loader_uvvis',
    name: 'UV-Vis Spectroscopy Loader',
    description: 'Extracts Wavelength and Intensity from OceanOptics / Cary spectrometer text exports, ignoring metadata headers.',
    code: `"""
UV-Vis Spectroscopy Loader
Extracts wavelength and intensity columns, skipping instrument metadata header.
"""
import pandas as pd
import numpy as np

def load_data(file_path, params):
    # Skip metadata lines starting with '#'
    df = pd.read_csv(file_path, sep=r"\\s+", skiprows=10, header=None, comment="#")
    df.columns = ["Wavelength (nm)", "Intensity"]
    return df
`,
    isBuiltIn: true,
  },
  {
    id: 'loader_xrr',
    name: 'X-Ray Reflectivity (XRR) Loader',
    description: 'Parses 2-Theta vs Intensity scattering curves and calculates wavevector Q (1/Å) for Cu K-alpha (1.5406 Å).',
    code: `"""
X-Ray Reflectivity Loader
Converts TwoTheta angles (deg) to Q momentum transfer vector (1/Å) for Cu K-alpha (1.5406 Å).
"""
import pandas as pd
import numpy as np

def load_data(file_path, params):
    try:
        wavelength = float(params.get("wavelength", 1.5406))
    except (ValueError, TypeError):
        wavelength = 1.5406
        
    if wavelength <= 0:
        wavelength = 1.5406
        
    df_raw = pd.read_csv(file_path, sep=r"\\s+", skiprows=params.get("skip_rows", 0), header=None, comment="#")
    df = pd.DataFrame()
    df["TwoTheta (deg)"] = pd.to_numeric(df_raw.iloc[:, 0], errors='coerce')
    df["Intensity"] = pd.to_numeric(df_raw.iloc[:, 1], errors='coerce')
    df = df.dropna().reset_index(drop=True)
    
    # Calculate Q = 4*pi/lambda * sin(theta)
    theta_rad = np.radians(df["TwoTheta (deg)"] / 2.0)
    df["Q (1/Å)"] = (4.0 * np.pi / wavelength) * np.sin(theta_rad)
    return df
`,
    isBuiltIn: true,
  },
  {
    id: 'loader_generic_delimited',
    name: 'Delimited ASCII / CSV Loader',
    description: 'Standard configurable delimiter loader with automatic header detection.',
    code: `"""
Generic Delimited ASCII Loader
Handles comma, tab, or whitespace separated values with customizable column headers.
"""
import pandas as pd

def load_data(file_path, params):
    delimiter = params.get("delimiter", ",")
    skiprows = params.get("skiprows", 0)
    df = pd.read_csv(file_path, sep=delimiter, skiprows=skiprows)
    return df
`,
    isBuiltIn: true,
  },
];

export function getStoredLoaders(): LoaderTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOADERS);
    if (!raw) return BUILTIN_LOADERS;
    const userCustom: LoaderTemplate[] = JSON.parse(raw);
    return [...BUILTIN_LOADERS, ...userCustom];
  } catch (e) {
    return BUILTIN_LOADERS;
  }
}

export function saveCustomLoader(loader: LoaderTemplate): LoaderTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOADERS);
    const existing: LoaderTemplate[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter((l) => l.id !== loader.id);
    const next = [...filtered, loader];
    localStorage.setItem(STORAGE_KEY_LOADERS, JSON.stringify(next));
    return [...BUILTIN_LOADERS, ...next];
  } catch (e) {
    return [...BUILTIN_LOADERS, loader];
  }
}

export function deleteCustomLoader(loaderId: string): LoaderTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOADERS);
    if (!raw) return BUILTIN_LOADERS;
    const existing: LoaderTemplate[] = JSON.parse(raw);
    const next = existing.filter((l) => l.id !== loaderId);
    localStorage.setItem(STORAGE_KEY_LOADERS, JSON.stringify(next));
    return [...BUILTIN_LOADERS, ...next];
  } catch (e) {
    return BUILTIN_LOADERS;
  }
}

// ==========================================
// 3. DATA TRANSFORM TEMPLATES
// ==========================================

export const BUILTIN_TRANSFORMS: TransformTemplate[] = [
  {
    id: 'transform_baseline',
    name: 'Baseline Minimum Subtraction',
    description: 'Offsets intensity series so that the lowest measured value is zero.',
    code: `"""
Baseline Subtraction Transform
Shifts Y columns so that the minimum baseline starts at 0.
"""
import pandas as pd
import numpy as np

def manipulate(df):
    result = df.copy()
    numeric_cols = result.select_dtypes(include=[np.number]).columns
    y_cols = numeric_cols[1:] if len(numeric_cols) > 1 else numeric_cols
    for col in y_cols:
        result[col] = result[col] - result[col].min()
    return result
`,
    isBuiltIn: true,
  },
  {
    id: 'transform_savgol',
    name: 'Savitzky-Golay Smoothing',
    description: 'Applies polynomial local least-squares convolution to suppress noise while preserving peak height and width.',
    code: `"""
Savitzky-Golay Smoothing Transform
Smooths data using polynomial least-squares convolution, preserving peak shape.
"""
import pandas as pd
import numpy as np

try:
    from scipy.signal import savgol_filter
    _HAS_SCIPY = True
except ImportError:
    _HAS_SCIPY = False

def _savgol_np(y, window, polyorder):
    m = (window - 1) // 2
    k = np.arange(-m, m + 1)
    A = np.vander(k, polyorder + 1)[:, ::-1]
    coeffs = np.linalg.pinv(A)[0]
    y_pad = np.pad(y, m, mode='reflect')
    return np.convolve(y_pad, coeffs[::-1], mode='valid')

def manipulate(df, window_length=7, polyorder=2):
    result = df.copy()
    w = max(3, int(window_length))
    if w % 2 == 0:
        w += 1
    p = min(max(1, int(polyorder)), w - 1)
    
    numeric_cols = result.select_dtypes(include=[np.number]).columns
    y_cols = numeric_cols[1:] if len(numeric_cols) > 1 else numeric_cols
    for col in y_cols:
        series = result[col]
        valid_mask = series.notna()
        valid_idx = series.index[valid_mask]
        vals = series.loc[valid_idx].to_numpy(dtype=float)
        if len(vals) >= w:
            if _HAS_SCIPY:
                filtered = savgol_filter(vals, window_length=w, polyorder=p, mode='mirror')
            else:
                filtered = _savgol_np(vals, w, p)
            result.loc[valid_idx, col] = filtered
    return result
`,
    isBuiltIn: true,
  },
  {
    id: 'transform_derivative',
    name: 'First Derivative (dY/dX)',
    description: 'Computes numerical gradient dY/dX for identifying transition inflection points and peak centers.',
    code: `"""
First Derivative Transform
Calculates central difference gradient dY/dX with monotonic sorting and division protection.
"""
import pandas as pd
import numpy as np

def manipulate(df):
    result = df.copy()
    numeric_cols = result.select_dtypes(include=[np.number]).columns.tolist()
    if len(numeric_cols) < 2 or len(result) < 2:
        return result

    x_col = numeric_cols[0]
    sorted_df = result.sort_values(by=x_col)
    x_vals = sorted_df[x_col].to_numpy(dtype=float)
    
    # Guard against zero-spacing duplicates (dx == 0)
    dx = np.diff(x_vals)
    if np.any(dx == 0):
        x_vals = x_vals + np.arange(len(x_vals)) * 1e-12

    for col in numeric_cols[1:]:
        y_vals = sorted_df[col].to_numpy(dtype=float)
        valid = np.isfinite(x_vals) & np.isfinite(y_vals)
        if np.sum(valid) >= 2:
            grad = np.gradient(y_vals[valid], x_vals[valid])
            result.loc[sorted_df.index[valid], f"d({col})/d({x_col})"] = grad
    return result
`,
    isBuiltIn: true,
  },
  {
    id: 'transform_custom_normalize',
    name: 'Custom Target Range Normalization',
    description: 'Scales the dynamic range of data between user-defined min and max intervals (e.g. -1 to +1 or 0 to 100).',
    code: `"""
Custom Range Normalization Transform
Scales data from [min(y), max(y)] to [target_min, target_max].
"""
import pandas as pd
import numpy as np

def manipulate(df, target_min=-1.0, target_max=1.0):
    result = df.copy()
    numeric_cols = result.select_dtypes(include=[np.number]).columns
    y_cols = numeric_cols[1:] if len(numeric_cols) > 1 else numeric_cols
    for col in y_cols:
        y_min = result[col].min()
        y_max = result[col].max()
        if pd.notna(y_min) and pd.notna(y_max):
            if y_max > y_min:
                result[col] = target_min + (result[col] - y_min) * (target_max - target_min) / (y_max - y_min)
            else:
                result[col] = (target_min + target_max) / 2.0
    return result
`,
    isBuiltIn: true,
  },
];

export function getStoredTransforms(): TransformTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRANSFORMS);
    if (!raw) return BUILTIN_TRANSFORMS;
    const userCustom: TransformTemplate[] = JSON.parse(raw);
    return [...BUILTIN_TRANSFORMS, ...userCustom];
  } catch (e) {
    return BUILTIN_TRANSFORMS;
  }
}

export function saveCustomTransform(transform: TransformTemplate): TransformTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRANSFORMS);
    const existing: TransformTemplate[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter((t) => t.id !== transform.id);
    const next = [...filtered, transform];
    localStorage.setItem(STORAGE_KEY_TRANSFORMS, JSON.stringify(next));
    return [...BUILTIN_TRANSFORMS, ...next];
  } catch (e) {
    return [...BUILTIN_TRANSFORMS, transform];
  }
}

export function deleteCustomTransform(transformId: string): TransformTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRANSFORMS);
    if (!raw) return BUILTIN_TRANSFORMS;
    const existing: TransformTemplate[] = JSON.parse(raw);
    const next = existing.filter((t) => t.id !== transformId);
    localStorage.setItem(STORAGE_KEY_TRANSFORMS, JSON.stringify(next));
    return [...BUILTIN_TRANSFORMS, ...next];
  } catch (e) {
    return BUILTIN_TRANSFORMS;
  }
}
