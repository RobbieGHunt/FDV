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
            "choices": ["#", "!", "%", "None"],
            "label": "Comment Character"
        }
    }

def load_data(file_path, params):
    delim = params.get("delimiter", "auto")
    try:
        skip = int(params.get("skip_rows", 0))
    except (ValueError, TypeError):
        skip = 0
    comment = params.get("comment_char", "#")
    if comment == "None":
        comment = None

    if delim == "auto":
        # Sniff delimiter using Python csv sniffer after skipping headers & comments
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            for _ in range(max(0, skip)):
                f.readline()
            data_sample_lines = []
            for _ in range(50):
                line = f.readline()
                if not line:
                    break
                stripped = line.strip()
                if stripped and (not comment or not stripped.startswith(comment)):
                    data_sample_lines.append(line)
            sample_text = "".join(data_sample_lines[:25])
            if sample_text:
                try:
                    sniffer = csv.Sniffer()
                    dialect = sniffer.sniff(sample_text)
                    delim = dialect.delimiter
                except Exception:
                    delim = ","
            else:
                delim = ","

    # Use C engine for single-character delimiters, Python engine for whitespace regex
    is_whitespace = (delim == " ")
    df = pd.read_csv(
        file_path,
        sep=r"\s+" if is_whitespace else delim,
        skiprows=skip,
        comment=comment,
        engine='python' if is_whitespace else 'c'
    )
    df.columns = [str(c).strip() for c in df.columns]
    return df
