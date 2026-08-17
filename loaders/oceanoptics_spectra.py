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
    skip = params.get("skip_rows", 10)
    x_idx = params.get("x_col_idx", 0)
    y_idx = params.get("y_col_idx", 1)

    df_raw = pd.read_csv(file_path, sep=delim if delim != " " else r"\s+", skiprows=skip, header=None, comment="#", engine='python')
    df_raw = df_raw.dropna(how='all')
    
    df = pd.DataFrame()
    df["Wavelength (nm)"] = pd.to_numeric(df_raw.iloc[:, x_idx], errors='coerce')
    df["Intensity"] = pd.to_numeric(df_raw.iloc[:, y_idx], errors='coerce')
    df = df.dropna().reset_index(drop=True)
    return df
