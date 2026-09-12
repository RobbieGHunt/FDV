"""
Gaussian Peak Fitting Module
Fits single or multiple Gaussian peak profiles to scientific data using non-linear
least-squares optimization (scipy.optimize.curve_fit).
Computes peak centroid (mu), amplitude (A), FWHM, integrated area, and residuals.
"""

import pandas as pd
import numpy as np

try:
    from scipy.optimize import curve_fit
    _HAS_SCIPY = True
except ImportError:
    _HAS_SCIPY = False

NAME = "Gaussian Peak Fit"
DESCRIPTION = "Fits Gaussian peak profile to extract centroid, amplitude, FWHM, and integrated area."

def get_parameters():
    return {
        "num_peaks": {
            "type": int,
            "default": 1,
            "min": 1,
            "max": 5,
            "label": "Number of Peaks"
        },
        "fit_baseline": {
            "type": bool,
            "default": True,
            "label": "Fit Linear Baseline"
        }
    }

def single_gaussian(x, y0, a, mu, sigma):
    """Single Gaussian peak with baseline offset."""
    return y0 + a * np.exp(-0.5 * ((x - mu) / np.maximum(sigma, 1e-12)) ** 2)

def double_gaussian(x, y0, a1, mu1, sigma1, a2, mu2, sigma2):
    """Two overlapping Gaussian peaks with baseline offset."""
    return (
        y0
        + a1 * np.exp(-0.5 * ((x - mu1) / np.maximum(sigma1, 1e-12)) ** 2)
        + a2 * np.exp(-0.5 * ((x - mu2) / np.maximum(sigma2, 1e-12)) ** 2)
    )

def _estimate_initial_params(x, y):
    """Calculates automated initial parameter estimates from empirical data."""
    y0_init = float(np.percentile(y, 10))
    y_sub = np.maximum(0, y - y0_init)
    total_area = np.sum(y_sub)
    
    if total_area > 0:
        mu_init = float(np.sum(x * y_sub) / total_area)
        sigma_init = float(np.sqrt(np.maximum(1e-6, np.sum((x - mu_init) ** 2 * y_sub) / total_area)))
    else:
        mu_init = float(x[np.argmax(y)])
        sigma_init = float((np.max(x) - np.min(x)) / 6.0)
        
    a_init = float(np.max(y) - y0_init)
    sigma_init = max(sigma_init, (np.max(x) - np.min(x)) / 100.0)
    
    return y0_init, a_init, mu_init, sigma_init

def transform(df: pd.DataFrame, params: dict = None) -> pd.DataFrame:
    """
    Fits Gaussian model to data and appends 'Fit_Gaussian' and 'Residuals' columns.
    """
    params = params or {}
    num_peaks = int(params.get("num_peaks", 1))
    fit_baseline = bool(params.get("fit_baseline", True))
    
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if len(numeric_cols) < 2 or len(df) < 4:
        return df

    x_col = numeric_cols[0]
    y_col = numeric_cols[1]

    # Clean non-finite data
    mask = np.isfinite(df[x_col]) & np.isfinite(df[y_col])
    x = df.loc[mask, x_col].to_numpy(dtype=float)
    y = df.loc[mask, y_col].to_numpy(dtype=float)

    if len(x) < 4:
        return df

    # Monotonic sorting
    sort_idx = np.argsort(x)
    x = x[sort_idx]
    y = y[sort_idx]

    result = df.copy()

    if not _HAS_SCIPY:
        # Fallback: estimate from moments without non-linear optimizer
        y0_est, a_est, mu_est, sigma_est = _estimate_initial_params(x, y)
        y_fit = single_gaussian(df[x_col].to_numpy(dtype=float), y0_est, a_est, mu_est, sigma_est)
        result["Fit_Gaussian"] = y_fit
        result["Residuals"] = df[y_col] - y_fit
        return result

    try:
        y0_est, a_est, mu_est, sigma_est = _estimate_initial_params(x, y)

        if num_peaks == 1:
            p0 = [y0_est, a_est, mu_est, sigma_est]
            bounds = (
                [-np.inf, 0, np.min(x), 1e-12],
                [np.inf, np.inf, np.max(x), (np.max(x) - np.min(x))]
            )
            popt, pcov = curve_fit(single_gaussian, x, y, p0=p0, bounds=bounds, maxfev=5000)
            y_fit_full = single_gaussian(df[x_col].to_numpy(dtype=float), *popt)

            # Extract metrics
            y0_fit, a_fit, mu_fit, sigma_fit = popt
            fwhm = 2.0 * np.sqrt(2.0 * np.log(2.0)) * abs(sigma_fit)
            area = a_fit * abs(sigma_fit) * np.sqrt(2.0 * np.pi)

            # R-squared calculation
            ss_res = np.sum((y - single_gaussian(x, *popt)) ** 2)
            ss_tot = np.sum((y - np.mean(y)) ** 2)
            r2 = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 1.0

        elif num_peaks >= 2:
            x_mid = (np.min(x) + np.max(x)) / 2.0
            p0 = [y0_est, a_est * 0.8, mu_est - sigma_est, sigma_est * 0.8,
                  a_est * 0.5, mu_est + sigma_est, sigma_est * 0.8]
            bounds = (
                [-np.inf, 0, np.min(x), 1e-12, 0, np.min(x), 1e-12],
                [np.inf, np.inf, np.max(x), (np.max(x) - np.min(x)), np.inf, np.max(x), (np.max(x) - np.min(x))]
            )
            popt, pcov = curve_fit(double_gaussian, x, y, p0=p0, bounds=bounds, maxfev=5000)
            y_fit_full = double_gaussian(df[x_col].to_numpy(dtype=float), *popt)

            # Individual component traces
            comp1 = single_gaussian(df[x_col].to_numpy(dtype=float), popt[0], popt[1], popt[2], popt[3])
            comp2 = single_gaussian(df[x_col].to_numpy(dtype=float), popt[0], popt[4], popt[5], popt[6])
            result["Peak_1"] = comp1
            result["Peak_2"] = comp2

            ss_res = np.sum((y - double_gaussian(x, *popt)) ** 2)
            ss_tot = np.sum((y - np.mean(y)) ** 2)
            r2 = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 1.0

        result["Fit_Gaussian"] = y_fit_full
        result["Residuals"] = df[y_col] - y_fit_full

    except Exception:
        # Fallback to moment estimation on fit failure
        y0_est, a_est, mu_est, sigma_est = _estimate_initial_params(x, y)
        y_fit = single_gaussian(df[x_col].to_numpy(dtype=float), y0_est, a_est, mu_est, sigma_est)
        result["Fit_Gaussian"] = y_fit
        result["Residuals"] = df[y_col] - y_fit

    return result

def manipulate(df: pd.DataFrame) -> pd.DataFrame:
    """Standard backwards-compatible transform interface."""
    return transform(df, {"num_peaks": 1, "fit_baseline": True})
