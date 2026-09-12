"""
Scientific Plotly Layout Exporter
Generates publication-quality figures with scientific log-scale powers (10^x),
theme synchronization (dark/light), and clean grid styling.
"""

import plotly.graph_objects as go
import numpy as np
import pandas as pd

NAME = "Scientific Publication Plotter"
DESCRIPTION = "Creates publication-ready Plotly figures with decade-power tick scaling and themed layouts."

def get_parameters():
    return {
        "x_column": {
            "type": str,
            "default": "x",
            "label": "X Column"
        },
        "log_y": {
            "type": bool,
            "default": False,
            "label": "Logarithmic Y-Axis (10^x)"
        },
        "theme": {
            "type": str,
            "default": "dark",
            "choices": ["dark", "light"],
            "label": "Theme Mode"
        },
        "line_width": {
            "type": float,
            "default": 2.0,
            "min": 0.5,
            "max": 6.0,
            "label": "Line Width"
        }
    }

def plot_plotly(df: pd.DataFrame, params: dict = None) -> go.Figure:
    """
    Creates publication-ready Plotly figure from DataFrame.
    """
    params = params or {}
    fig = go.Figure()
    
    if df.empty or len(df.columns) < 2:
        return fig

    x_col = params.get("x_column", df.columns[0])
    if x_col not in df.columns:
        x_col = df.columns[0]
        
    y_cols = [c for c in df.columns if c != x_col]
    log_y = bool(params.get("log_y", False))
    theme = params.get("theme", "dark")
    line_width = float(params.get("line_width", 2.0))

    # Scientific color cycle: FDV Cyan, Orange, Emerald, Purple, Blue, Amber
    color_cycle = ["#00adb5", "#ea580c", "#10b981", "#8b5cf6", "#3b82f6", "#f59e0b"]

    for idx, col in enumerate(y_cols):
        color = color_cycle[idx % len(color_cycle)]
        fig.add_trace(go.Scatter(
            x=df[x_col],
            y=df[col],
            mode="lines",
            name=str(col),
            line=dict(color=color, width=line_width)
        ))

    # Theming & scientific log scale
    is_dark = (theme == "dark")
    paper_bg = "#121316" if is_dark else "#f8fafc"
    plot_bg = "#181a20" if is_dark else "#ffffff"
    font_color = "#ffffff" if is_dark else "#0f172a"
    grid_color = "#2a2d37" if is_dark else "#e2e8f0"

    y_axis_config = dict(
        title=str(y_cols[0]) if len(y_cols) == 1 else "Intensity / Signal",
        showgrid=True,
        gridcolor=grid_color,
        zeroline=False
    )
    if log_y:
        y_axis_config.update(dict(
            type="log",
            exponentformat="power",
            showexponent="all",
            dtick=1
        ))

    fig.update_layout(
        template="plotly_dark" if is_dark else "plotly_white",
        paper_bgcolor=paper_bg,
        plot_bgcolor=plot_bg,
        font=dict(color=font_color, family="system-ui, sans-serif"),
        xaxis=dict(
            title=str(x_col),
            showgrid=True,
            gridcolor=grid_color,
            zeroline=False
        ),
        yaxis=y_axis_config,
        legend=dict(
            bgcolor="rgba(0,0,0,0)",
            bordercolor="rgba(0,0,0,0)"
        ),
        margin=dict(l=60, r=30, t=50, b=50)
    )

    return fig
