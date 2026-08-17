"""
Custom Transform Template
To create a custom math transformation, copy this file and modify the `manipulate(df)` function.
"""

import pandas as pd
import numpy as np

NAME = "My Custom Transform"
DESCRIPTION = "Apply mathematical operations or signal processing to loaded data."

def manipulate(df):
    """
    Takes a pandas DataFrame and returns the modified DataFrame.
    """
    transformed = df.copy()
    
    # Example: multiply intensity by a factor
    # if "Intensity" in transformed.columns:
    #     transformed["Intensity"] = transformed["Intensity"] * 2.0
    
    return transformed
