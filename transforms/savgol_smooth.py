"""
Savitzky-Golay Smoothing Transform
Applies polynomial local least-squares convolution (Savitzky-Golay filter)
to reduce high-frequency noise while preserving scientific peak heights,
areas, and curvatures.
"""

import pandas as pd
import numpy as np

try:
    from scipy.signal import savgol_filter as _scipy_savgol
    _HAS_SCIPY = True
except ImportError:
    _HAS_SCIPY = False

NAME = "Savitzky-Golay Smoothing"
DESCRIPTION = "Polynomial least-squares filter that smooths data while preserving peak shape and height."

def get_parameters():
    return {
        "window_length": {
            "type": int,
            "default": 7,
            "min": 3,
            "max": 101,
            "label": "Window Length (Odd integer)"
        },
        "polyorder": {
            "type": int,
            "default": 2,
            "min": 1,
            "max": 5,
            "label": "Polynomial Order"
        }
    }

def _savgol_fallback(y: np.ndarray, window_length: int, polyorder: int) -> np.ndarray:
    """Pure NumPy least-squares polynomial convolution fallback matching SciPy."""
    m = (window_length - 1) // 2
    k = np.arange(-m, m + 1)
    A = np.vander(k, polyorder + 1)[:, ::-1]
    pinv = np.linalg.pinv(A)
    coeffs = pinv[0]
    y_padded = np.pad(y, m, mode='reflect')
    return np.convolve(y_padded, coeffs[::-1], mode='valid')

def apply_savgol(data: np.ndarray, window_length: int, polyorder: int) -> np.ndarray:
    """Applies Savitzky-Golay filter using SciPy if available, else pure NumPy fallback."""
    if _HAS_SCIPY:
        try:
            return _scipy_savgol(data, window_length=window_length, polyorder=polyorder, mode='mirror')
        except Exception:
            pass
    return _savgol_fallback(data, window_length=window_length, polyorder=polyorder)

def transform(df: pd.DataFrame, params: dict = None) -> pd.DataFrame:
    """
    Applies Savitzky-Golay smoothing to numeric Y columns in the DataFrame.
    """
    params = params or {}
    try:
        window = int(params.get("window_length", 7))
    except (ValueError, TypeError):
        window = 7
        
    try:
        polyorder = int(params.get("polyorder", 2))
    except (ValueError, TypeError):
        polyorder = 2

    # Enforce odd window_length >= 3
    if window < 3:
        window = 3
    if window % 2 == 0:
        window += 1

    # Polyorder must be less than window_length
    if polyorder >= window:
        polyorder = max(1, window - 1)

    result = df.copy()
    numeric_cols = result.select_dtypes(include=[np.number]).columns
    # Apply to all columns after X (or column 0 if only 1 numeric column exists)
    cols_to_adjust = numeric_cols[1:] if len(numeric_cols) > 1 else numeric_cols

    for col in cols_to_adjust:
        series = result[col]
        # Only filter if we have enough non-null points
        valid_mask = series.notna()
        valid_indices = series.index[valid_mask]
        valid_vals = series.loc[valid_indices].to_numpy(dtype=float)

        if len(valid_vals) >= window:
            filtered = apply_savgol(valid_vals, window_length=window, polyorder=polyorder)
            result.loc[valid_indices, col] = filtered

    return result

def manipulate(df: pd.DataFrame) -> pd.DataFrame:
    """Backwards-compatible wrapper with default parameters."""
    return transform(df, {"window_length": 7, "polyorder": 2})
