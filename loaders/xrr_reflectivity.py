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
    wavelength = params.get("wavelength", 1.5406)
    skip = params.get("skip_rows", 0)

    df_raw = pd.read_csv(file_path, sep=r"\s+", skiprows=skip, header=None, comment="#", engine='python')
    df = pd.DataFrame()
    df["TwoTheta (deg)"] = pd.to_numeric(df_raw.iloc[:, 0], errors='coerce')
    df["Intensity"] = pd.to_numeric(df_raw.iloc[:, 1], errors='coerce')
    df = df.dropna().reset_index(drop=True)

    # Q = (4 * pi / lambda) * sin(theta)
    theta_rad = np.radians(df["TwoTheta (deg)"] / 2.0)
    df["Q (1/Å)"] = (4.0 * np.pi / wavelength) * np.sin(theta_rad)
    return df
