"""
Custom Loader Template
To create a new data loader, copy this file, rename it, and customize `load_data`.
"""

import pandas as pd
import numpy as np

# Metadata
NAME = "My Custom Loader"
DESCRIPTION = "Description of the file format or instrument this loader parses."
DEFAULT_EXTENSION = ".txt"

def get_parameters():
    """
    Define customizable parameters shown in the FDV GUI.
    Supported types: str, int, float, bool.
    """
    return {
        "delimiter": {
            "type": str,
            "default": ",",
            "choices": [",", "\t", " ", ";"],
            "label": "Delimiter"
        },
        "skip_rows": {
            "type": int,
            "default": 0,
            "min": 0,
            "label": "Skip Header Rows"
        }
    }

def load_data(file_path, params):
    """
    Reads the file from `file_path` and returns a pandas DataFrame.
    """
    sep = params.get("delimiter", ",")
    skip = params.get("skip_rows", 0)

    # Load file
    df = pd.read_csv(file_path, sep=sep, skiprows=skip)
    
    # Custom transformations / column cleaning
    df.columns = [str(c).strip() for c in df.columns]
    return df
