"""
Smoothing Filter Transform
Applies moving average or Savitzky-Golay filtering to reduce high-frequency noise.
"""

import pandas as pd
import numpy as np

NAME = "Moving Average Smoothing"
DESCRIPTION = "Applies a moving window average filter to smooth noisy data."

def manipulate(df):
    result = df.copy()
    window = 5
    numeric_cols = result.select_dtypes(include=[np.number]).columns
    cols_to_adjust = numeric_cols[1:] if len(numeric_cols) > 1 else numeric_cols
    for col in cols_to_adjust:
        result[col] = result[col].rolling(window=window, center=True, min_periods=1).mean()
    return result
