"""
X-Ray Reflectivity (XRR) Loader
Loads 2-theta/Intensity scattering scans and computes momentum transfer vector Q.
"""

import pandas as pd
import numpy as np

NAME = "X-Ray Reflectivity (XRR)"
DESCRIPTION = "Loads 2-Theta vs Intensity XRR scans and automatically computes Q scattering vector."
DEFAULT_EXTENSION = ".xy"

def get_parameters():
    return {
        "wavelength": {
            "type": float,
            "default": 1.5406,
            "decimals": 4,
            "label": "X-Ray Wavelength (Å)"
        },
        "skip_rows": {
            "type": int,
            "default": 0,
            "min": 0,
            "label": "Skip Header Lines"
        }
    }

def load_data(file_path, params):
    try:
        wavelength = float(params.get("wavelength", 1.5406))
    except (ValueError, TypeError):
        wavelength = 1.5406

    if wavelength <= 0:
        raise ValueError(f"X-ray wavelength must be strictly positive (> 0 Å), got {wavelength}")

    try:
        skip = int(params.get("skip_rows", 0))
    except (ValueError, TypeError):
        skip = 0

    df_raw = pd.read_csv(file_path, sep=r"\s+", skiprows=skip, header=None, comment="#", engine='python')
    df_raw = df_raw.dropna(how='all')
    if df_raw.empty:
        raise ValueError(f"File contains no tabular data after skipping {skip} header lines.")
    if df_raw.shape[1] < 2:
        raise ValueError(f"XRR profile requires at least 2 columns (TwoTheta, Intensity), but file only has {df_raw.shape[1]}.")

    df = pd.DataFrame()
    df["TwoTheta (deg)"] = pd.to_numeric(df_raw.iloc[:, 0], errors='coerce')
    df["Intensity"] = pd.to_numeric(df_raw.iloc[:, 1], errors='coerce')
    df = df.dropna().reset_index(drop=True)
    if df.empty:
        raise ValueError("No valid numeric TwoTheta and Intensity data found.")

    # Q = (4 * pi / lambda) * sin(theta)
    theta_rad = np.radians(df["TwoTheta (deg)"] / 2.0)
    df["Q (1/Å)"] = (4.0 * np.pi / wavelength) * np.sin(theta_rad)
    return df
