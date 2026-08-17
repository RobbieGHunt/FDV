"""
Universal Delimited File Loader
Automatically detects separators, comments, and headers for CSV, TSV, and tabular text files.
"""

import pandas as pd
import csv

NAME = "Universal Delimited Loader"
DESCRIPTION = "Loads CSV, TSV, and text tables with automatic or manual delimiter and header skip."
DEFAULT_EXTENSION = ".csv"

def get_parameters():
    return {
        "delimiter": {
            "type": str,
            "default": "auto",
            "choices": ["auto", ",", "\t", " ", ";", "|"],
            "label": "Delimiter"
        },
        "skip_rows": {
            "type": int,
            "default": 0,
            "min": 0,
            "label": "Skip Header Rows"
        },
        "comment_char": {
            "type": str,
            "default": "#",
            "choices": ["#", "//", "!", "%", "None"],
            "label": "Comment Character"
        }
    }

def load_data(file_path, params):
    delim = params.get("delimiter", "auto")
    skip = params.get("skip_rows", 0)
    comment = params.get("comment_char", "#")
    if comment == "None":
        comment = None

    if delim == "auto":
        # Sniff delimiter using Python csv sniffer
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            sample_lines = [f.readline() for _ in range(25)]
            sample_text = "".join(sample_lines)
            try:
                sniffer = csv.Sniffer()
                dialect = sniffer.sniff(sample_text)
                delim = dialect.delimiter
            except Exception:
                delim = ","

    df = pd.read_csv(
        file_path,
        sep=delim if delim != " " else r"\s+",
        skiprows=skip,
        comment=comment,
        engine='python'
    )
    df.columns = [str(c).strip() for c in df.columns]
    return df
