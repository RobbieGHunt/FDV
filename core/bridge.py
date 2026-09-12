"""
FDV Python Bridge
Executes modular loaders, plotters, and transforms from Electron/Node or CLI.
Returns JSON-serialized DataFrames and parameters with vectorized high-throughput conversion.
"""

import sys
import os
import json
import argparse
import inspect
import traceback
import importlib.util
import pandas as pd
import numpy as np

def load_module_from_file(module_name, file_path):
    resolved = os.path.abspath(file_path)
    if not os.path.exists(resolved):
        raise FileNotFoundError(f"Script file not found: {resolved}")
    spec = importlib.util.spec_from_file_location(module_name, resolved)
    if spec is None or spec.loader is None:
        raise ImportError(f"Could not load spec for {resolved}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

def df_to_json_dict(df):
    """
    Converts DataFrame to clean dictionary of columns and summary statistics.
    Uses vectorized NumPy masks for sub-100ms serialization on 100k+ rows.
    """
    data_dict = {}
    col_types = {}
    stats = {}

    for col in df.columns:
        col_str = str(col)
        series = df[col]
        # In case of duplicate column names, take the first Series
        if isinstance(series, pd.DataFrame):
            series = series.iloc[:, 0]

        is_num = pd.api.types.is_numeric_dtype(series)
        col_types[col_str] = "number" if is_num else "string"

        if is_num:
            arr = series.to_numpy(dtype=float, na_value=np.nan)
            valid_mask = np.isfinite(arr)
            # Vectorized float array to Python list with None for non-finite values
            clean_arr = np.where(valid_mask, arr, None)
            data_dict[col_str] = clean_arr.tolist()

            valid_vals = arr[valid_mask]
            if valid_vals.size > 0:
                stats[col_str] = {
                    "min": float(np.min(valid_vals)),
                    "max": float(np.max(valid_vals)),
                    "mean": float(np.mean(valid_vals)),
                    "count": int(valid_vals.size)
                }
            else:
                stats[col_str] = {"min": None, "max": None, "mean": None, "count": 0}
        else:
            str_series = series.fillna("").astype(str)
            data_dict[col_str] = str_series.tolist()
            stats[col_str] = {"count": int((str_series != "").sum())}

    return {
        "columns": [str(c) for c in df.columns],
        "columnTypes": col_types,
        "rowCount": len(df),
        "data": data_dict,
        "stats": stats
    }

def main():
    parser = argparse.ArgumentParser(description="FDV Python Bridge Runner")
    parser.add_argument("--action", choices=["load_data", "transform", "get_parameters", "scan_plugins"], default="load_data")
    parser.add_argument("--script", required=False, help="Path to Python script")
    parser.add_argument("--file", required=False, help="Path to raw data file")
    parser.add_argument("--params", default="{}", help="JSON string of parameter overrides")
    parser.add_argument("--dir", required=False, help="Directory to scan")

    args = parser.parse_args()
    raw_params = args.params
    if raw_params:
        try:
            params = json.loads(raw_params)
        except Exception:
            try:
                import ast
                params = ast.literal_eval(raw_params)
            except Exception:
                params = {}
    else:
        params = {}

    try:
        if args.action == "load_data":
            if not args.script or not args.file:
                raise ValueError("Both --script and --file are required for load_data")
            mod = load_module_from_file("custom_loader", args.script)
            if not hasattr(mod, "load_data") or not callable(mod.load_data):
                raise AttributeError("Script must have a load_data(file_path, params) function")

            df = mod.load_data(args.file, params)
            if not isinstance(df, pd.DataFrame):
                raise TypeError("load_data must return a pandas DataFrame")

            result = df_to_json_dict(df)
            print(json.dumps(result))

        elif args.action == "transform":
            if not args.script:
                raise ValueError("--script is required for transform")
            mod = load_module_from_file("custom_transform", args.script)

            func = getattr(mod, "transform", getattr(mod, "manipulate", None))
            if not func or not callable(func):
                raise AttributeError("Transform script must have a transform(df, params) or manipulate(df) function")

            # Read input df from stdin
            input_json = sys.stdin.read()
            if input_json:
                input_data = json.loads(input_json)
                if isinstance(input_data, dict) and "data" in input_data:
                    df = pd.DataFrame(input_data["data"])
                elif isinstance(input_data, list):
                    df = pd.DataFrame(input_data)
                elif isinstance(input_data, dict):
                    df = pd.DataFrame(input_data)
                else:
                    df = pd.DataFrame()
            else:
                df = pd.DataFrame()

            # Inspect signature to pass params if accepted
            sig = inspect.signature(func)
            if len(sig.parameters) >= 2:
                transformed_df = func(df, params)
            else:
                transformed_df = func(df)

            if not isinstance(transformed_df, pd.DataFrame):
                raise TypeError("Transform function must return a pandas DataFrame")

            result = df_to_json_dict(transformed_df)
            print(json.dumps(result))

        elif args.action == "get_parameters":
            if not args.script:
                raise ValueError("--script is required for get_parameters")
            mod = load_module_from_file("custom_script", args.script)
            get_params = getattr(mod, "get_parameters", lambda: {})
            raw_params = get_params()

            clean_params = {}
            for k, v in raw_params.items():
                p_type = v.get("type", str)
                type_name = "string"
                if p_type == int:
                    type_name = "integer"
                elif p_type == float:
                    type_name = "float"
                elif p_type == bool:
                    type_name = "boolean"

                clean_params[k] = {
                    "label": v.get("label", k),
                    "type": type_name,
                    "default": v.get("default"),
                    "choices": v.get("choices"),
                    "min": v.get("min"),
                    "max": v.get("max")
                }
            print(json.dumps(clean_params))

        elif args.action == "scan_plugins":
            target_dir = args.dir or os.path.dirname(__file__)
            plugins = []
            if os.path.exists(target_dir):
                for fname in sorted(os.listdir(target_dir)):
                    if fname.endswith(".py") and not fname.startswith("__"):
                        fpath = os.path.join(target_dir, fname)
                        try:
                            mod = load_module_from_file(fname[:-3], fpath)
                            plugins.append({
                                "id": fname[:-3],
                                "name": getattr(mod, "NAME", fname[:-3]),
                                "description": getattr(mod, "DESCRIPTION", ""),
                                "default_extension": getattr(mod, "DEFAULT_EXTENSION", ".txt"),
                                "parameters": getattr(mod, "get_parameters", lambda: {})()
                            })
                        except Exception:
                            continue
            print(json.dumps(plugins))

    except Exception as e:
        err_data = {
            "error": str(e),
            "traceback": traceback.format_exc()
        }
        print(json.dumps(err_data), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
