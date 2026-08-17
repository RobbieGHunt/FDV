"""
FDV Python Bridge
Executes modular loaders, plotters, and transforms from Electron/Node or CLI.
Returns JSON-serialized DataFrames and parameters.
"""

import sys
import os
import json
import argparse
import traceback
import importlib.util
import pandas as pd
import numpy as np

def load_module_from_file(module_name, file_path):
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Script file not found: {file_path}")
    spec = importlib.util.spec_from_file_location(module_name, file_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Could not load spec for {file_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

def df_to_json_dict(df):
    """Converts DataFrame to clean dictionary of columns and summary statistics."""
    # Convert all columns to lists, handling NaN/inf as None
    data_dict = {}
    col_types = {}
    stats = {}
    
    for col in df.columns:
        series = df[col]
        is_num = pd.api.types.is_numeric_dtype(series)
        col_types[str(col)] = "number" if is_num else "string"
        
        # Replace NaN / inf with None for valid JSON serialization
        if is_num:
            clean_series = series.replace([np.inf, -np.inf], np.nan)
            data_dict[str(col)] = [None if pd.isna(v) else float(v) for v in clean_series]
            stats[str(col)] = {
                "min": None if clean_series.dropna().empty else float(clean_series.min()),
                "max": None if clean_series.dropna().empty else float(clean_series.max()),
                "mean": None if clean_series.dropna().empty else float(clean_series.mean()),
                "count": int(clean_series.count())
            }
        else:
            data_dict[str(col)] = [str(v) if not pd.isna(v) else "" for v in series]
            stats[str(col)] = {
                "count": int(series.count())
            }

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
            
            # Read input df from stdin or params if provided
            func = getattr(mod, "manipulate", getattr(mod, "transform", None))
            if not func or not callable(func):
                raise AttributeError("Transform script must have a manipulate(df) or transform(df, params) function")
            
            # Read stdin JSON DataFrame
            input_json = sys.stdin.read()
            if input_json:
                input_data = json.loads(input_json)
                df = pd.DataFrame(input_data["data"])
            else:
                df = pd.DataFrame()

            transformed_df = func(df)
            result = df_to_json_dict(transformed_df)
            print(json.dumps(result))

        elif args.action == "get_parameters":
            if not args.script:
                raise ValueError("--script is required for get_parameters")
            mod = load_module_from_file("custom_script", args.script)
            get_params = getattr(mod, "get_parameters", lambda: {})
            raw_params = get_params()
            
            # Serialize types (str -> "string", int -> "number", etc.)
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

    except Exception as e:
        err_data = {
            "error": str(e),
            "traceback": traceback.format_exc()
        }
        print(json.dumps(err_data), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
