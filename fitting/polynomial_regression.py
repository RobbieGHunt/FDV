"""
Polynomial Regression Curve Fitting Module
Fits linear, quadratic, cubic, or higher-order polynomials to XY datasets.
Computes fitted curves, residuals, R-squared goodness of fit, and formatted equation strings.
"""

import pandas as pd
import numpy as np

NAME = "Polynomial Regression"
DESCRIPTION = "Fits degree 1-5 polynomials (linear, quadratic, etc.) and computes R² and residuals."

def get_parameters():
    return {
        "degree": {
            "type": int,
            "default": 1,
            "min": 1,
            "max": 5,
            "label": "Polynomial Degree (1=Linear, 2=Quadratic)"
        }
    }

def format_equation(coeffs: np.ndarray, x_name="x", y_name="y") -> str:
    """Formats polynomial coefficients [c_n, ..., c_1, c_0] into readable string."""
    deg = len(coeffs) - 1
    terms = []
    for i, c in enumerate(coeffs):
        power = deg - i
        if abs(c) < 1e-12:
            continue
        sign = "+" if c >= 0 and len(terms) > 0 else ("-" if c < 0 and len(terms) > 0 else "")
        val = abs(c) if len(terms) > 0 else c
        
        if power == 0:
            terms.append(f"{sign} {abs(c):.4g}" if len(terms) > 0 else f"{c:.4g}")
        elif power == 1:
            terms.append(f"{sign} {val:.4g}*{x_name}")
        else:
            terms.append(f"{sign} {val:.4g}*{x_name}^{power}")
            
    eq_body = " ".join(terms) if terms else "0"
    return f"{y_name} = {eq_body}"

def transform(df: pd.DataFrame, params: dict = None) -> pd.DataFrame:
    """
    Fits polynomial of specified degree to (X, Y) and appends 'Fit_Poly' and 'Residuals'.
    """
    params = params or {}
    try:
        degree = int(params.get("degree", 1))
    except (ValueError, TypeError):
        degree = 1
    degree = max(1, min(5, degree))

    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if len(numeric_cols) < 2 or len(df) < degree + 1:
        return df

    x_col = numeric_cols[0]
    y_col = numeric_cols[1]

    # Extract valid coordinates
    mask = np.isfinite(df[x_col]) & np.isfinite(df[y_col])
    x_valid = df.loc[mask, x_col].to_numpy(dtype=float)
    y_valid = df.loc[mask, y_col].to_numpy(dtype=float)

    if len(x_valid) < degree + 1:
        return df

    # Fit polynomial coefficients: highest degree first
    coeffs = np.polyfit(x_valid, y_valid, deg=degree)
    poly = np.poly1d(coeffs)

    # Evaluate fit across full column
    x_full = df[x_col].to_numpy(dtype=float)
    y_fit = poly(x_full)
    residuals = df[y_col] - y_fit

    # Goodness-of-fit R²
    ss_res = np.sum((y_valid - poly(x_valid)) ** 2)
    ss_tot = np.sum((y_valid - np.mean(y_valid)) ** 2)
    r2 = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 1.0

    result = df.copy()
    result["Fit_Poly"] = y_fit
    result["Residuals"] = residuals

    return result

def manipulate(df: pd.DataFrame) -> pd.DataFrame:
    """Standard backwards-compatible transform interface."""
    return transform(df, {"degree": 1})
