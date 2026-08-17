"""
Intensity Normalization Transform
Normalizes series to [0, 1] range or unit maximum.
"""

import pandas as pd
import numpy as np

NAME = "Normalization (0 to 1)"
DESCRIPTION = "Rescales Y columns to a [0, 1] normalized interval."

def manipulate(df):
    result = df.copy()
    numeric_cols = result.select_dtypes(include=[np.number]).columns
    cols_to_adjust = numeric_cols[1:] if len(numeric_cols) > 1 else numeric_cols
    for col in cols_to_adjust:
        min_v = result[col].min()
        max_v = result[col].max()
        if pd.notna(min_v) and pd.notna(max_v) and max_v > min_v:
            result[col] = (result[col] - min_v) / (max_v - min_v)
    return result
