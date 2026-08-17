"""
Baseline Correction Transform
Subtracts constant minimum or linear baseline from numeric series.
"""

import pandas as pd
import numpy as np

NAME = "Baseline Correction"
DESCRIPTION = "Subtracts offset so that minimum value is zero, or fits a background baseline."

def manipulate(df):
    result = df.copy()
    numeric_cols = result.select_dtypes(include=[np.number]).columns
    # Subtract min for each column after the first (assuming col 0 is X)
    cols_to_adjust = numeric_cols[1:] if len(numeric_cols) > 1 else numeric_cols
    for col in cols_to_adjust:
        min_val = result[col].min()
        if pd.notna(min_val):
            result[col] = result[col] - min_val
    return result
