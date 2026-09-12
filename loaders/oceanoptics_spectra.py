"""
OceanOptics / UV-Vis Spectroscopy Loader
Extracts wavelength and intensity columns from UV-Vis and spectral export files.
"""

import pandas as pd
import numpy as np

NAME = "UV-Vis Spectroscopy"
DESCRIPTION = "Loads optical absorption and emission spectra, skipping header comments."
DEFAULT_EXTENSION = ".txt"

def get_parameters():
    return {
        "delimiter": {
            "type": str,
            "default": "\t",
            "choices": ["\t", ",", " ", ";"],
            "label": "Delimiter"
        },
        "skip_rows": {
            "type": int,
            "default": 10,
            "min": 0,
            "label": "Metadata Lines to Skip"
        },
        "x_col_idx": {
            "type": int,
            "default": 0,
            "min": 0,
            "label": "Wavelength Col Index"
        },
        "y_col_idx": {
            "type": int,
            "default": 1,
            "min": 0,
            "label": "Intensity Col Index"
        }
    }

def load_data(file_path, params):
    delim = params.get("delimiter", "\t")
    try:
        skip = int(params.get("skip_rows", 10))
    except (ValueError, TypeError):
        skip = 10
    try:
        x_idx = int(params.get("x_col_idx", 0))
    except (ValueError, TypeError):
        x_idx = 0
    try:
        y_idx = int(params.get("y_col_idx", 1))
    except (ValueError, TypeError):
        y_idx = 1

    df_raw = pd.read_csv(file_path, sep=delim if delim != " " else r"\s+", skiprows=skip, header=None, comment="#", engine='python')
    df_raw = df_raw.dropna(how='all')
    
    if df_raw.empty:
        raise ValueError(f"File contains no tabular data after skipping {skip} header lines.")

    if df_raw.shape[1] <= max(x_idx, y_idx):
        raise ValueError(
            f"File has only {df_raw.shape[1]} column(s). Selected column indices ({x_idx}, {y_idx}) are out of range."
        )

    df = pd.DataFrame()
    df["Wavelength (nm)"] = pd.to_numeric(df_raw.iloc[:, x_idx], errors='coerce')
    df["Intensity"] = pd.to_numeric(df_raw.iloc[:, y_idx], errors='coerce')
    df = df.dropna().reset_index(drop=True)

    if df.empty:
        raise ValueError("No valid numeric data found in the selected wavelength and intensity columns.")

    return df
