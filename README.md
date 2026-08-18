# Flexible Data Viewer (FDV)

[![GitHub Release](https://img.shields.io/github/v/release/RobbieGHunt/FDV?include_prereleases&color=0284c7)](https://github.com/RobbieGHunt/FDV/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-slate.svg)](LICENSE)

Flexible Data Viewer (FDV) is an open-source desktop application designed for fast, frictionless visualization, exploratory analysis, and transformation of scientific datasets. It accommodates arbitrary tabular formats (CSV, TSV, TXT, XY, DAT, ASC) without requiring manual header stripping, format conversions, or complex plotting scripts.

**Repository**: [https://github.com/RobbieGHunt/FDV](https://github.com/RobbieGHunt/FDV)

---

> **Notice on Version 0.11**: This repository contains version 0.1 (early preview) of the software. It is under active development and has not yet undergone comprehensive multi-platform stability testing. Users may encounter occasional edge cases. Feedback and bug reports are welcome on the [GitHub Issues tracker](https://github.com/RobbieGHunt/FDV/issues).

---

## Quick-Start Guide (Standalone Portable Executable)

For users who want to run the application immediately without installing Node.js, Python, or compilation tools:

1. Navigate to the **[Releases page](https://github.com/RobbieGHunt/FDV/releases)** on GitHub.
2. Download the standalone executable asset: `Flexible Data Viewer.exe`.
3. Double-click the downloaded `.exe` to launch the application. No installation, runtime setup, or administrative privileges are required.
4. Drag and drop any raw experimental data file directly onto the window, or click **Open Data** in the top navigation bar.

---

## Developer Installation (Running & Building from Source)

### Prerequisites
* **Node.js**: Version 18.x or higher
* **npm**: Version 9.x or higher
* **Python**: Version 3.8+ (optional, for custom external script execution and Python data transforms)

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/RobbieGHunt/FDV.git
   cd FDV
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Launch desktop application:**
   ```bash
   npm run start
   ```
   *(Alternatively, run `npm run dev` to launch the Vite local browser server).*

4. **Launch via Windows Batch Script:**
   Double-click `run_app.bat` or run:
   ```cmd
   run_app.bat
   ```

5. **Package standalone executable:**
   ```bash
   npm run build:exe
   ```
   The compiled standalone binary will be generated in `release/Flexible Data Viewer.exe`.

---

## Core Features & Interactive Tools

### Smart Auto-Detector Engine
* Automatically identifies delimiters (comma, tab, semicolon, variable whitespace) and header lines.
* Extracts structured experimental metadata blocks (e.g. spectrometer parameters, integration times, calibration details) into clean key-value dictionaries.
* Robust fallback handling for uneven column widths, commented lines (`#`, `;`, `%`, `//`), and non-numeric leading rows.

### Interactive Plot Canvas
* **Pan Mode** `[Move Tool]`: Pan curves smoothly across continuous coordinate spaces.
* **Box Zoom Mode** `[Zoom Tool]`: Draw rectangular zoom windows to inspect fine spectral or diffraction peaks.
* **Data Selection Tool** `[Mouse Pointer Tool]`: Select an individual point on any active curve to place a target cursor marker and automatically link/scroll directly to that row in the Data Table.
* **Reset View** `[Reset Tool]`: Auto-scales and fits all visible datasets to view extents.
* **Coordinate HUD & Crosshairs**: Continuous cursor coordinate readout with tracking spike lines.
* **Interactive Reference Guides**: Draggable Vertical (V-Line) and Horizontal (H-Line) reference markers with direct numeric inputs.
* **Automated Peak Detection**: Instant detection, labeling, and intensity readout of prominent peaks.
* **Scientific Log Scale Formatting**: Decade axes formatted in mathematical powers of 10 ($10^{-2}, 10^0, 10^4, 10^7$) rather than SI metric suffixes.

### Tabular Datafile Inspector
* **In-Memory Inline Cell Editing**: Double-click any cell to modify values on the fly with live statistics recalculation.
* **Row Deletion**: Remove unwanted points or outliers directly from the loaded dataframe.
* **Data Safety**: All edits and row deletions apply in-memory to the active session; source files on disk remain strictly unmodified.

### User Experience & System State
* **Themes**: High-contrast scientific Dark Mode and soft slate Light Mode with high-contrast text and sapphire blue accents.
* **Session Persistence**: Theme choices, active tabs, scaling presets, and sidebar widths automatically restore between launches.
* **Undo / Redo History**: Full state history support via top-left header arrows and standard keybindings (`Ctrl+Z`, `Ctrl+Y`, `Ctrl+Shift+Z`).

---

## Advanced Extensibility: Loaders, Transforms, & Plotters

FDV contains a modular architecture allowing users to save and customize Python and JavaScript data pipelines:

```
FDV (Repository Root)
├── assets/               # Official FDV Vector SVG, PNG, and Windows ICO icons
├── electron/             # Electron desktop main process & native dialogs
├── src/                  # React + TypeScript UI, PlotCanvas, DataTable, Sidebar
├── loaders/              # Modular data loaders
├── transforms/           # Scientific signal transforms
├── data/                 # Sample test datasets (UV-Vis spectra, XRR reflectivity, CSV)
├── tests/                # Automated detector tests
├── index.html            # Application HTML entry point
├── package.json          # App configuration & dependencies
├── vite.config.ts        # Bundler configuration
├── tsconfig.json         # TypeScript configuration
├── tailwind.config.js    # UI styling tokens
├── run_app.bat           # 1-click Windows desktop launcher
├── README.md             # Clean v0.1 documentation & quick-start guide
├── LICENSE               # MIT License
└── .gitignore            # Ignores node_modules, release/, dist/, caches
```

### 1. Data Loader Templates
Define custom data loading routines for proprietary binary or multi-block files. Saved templates can be chosen from the **Scripts & Plotters** tab.

```python
import numpy as np
import pandas as pd

def load_data(file_path):
    """
    Custom loader template for multi-column experimental datasets.
    """
    # Parse structured tabular data
    data = pd.read_csv(file_path, comment='#', delim_whitespace=True)
    metadata = {"source": file_path}
    return data, metadata
```

### 2. Signal Processing & Transforms
Apply baseline corrections, range normalizations, smoothing filters, or derivatives in real time:
* **Zero Baseline**: Shifts the lowest intensity point to zero ($Y - Y_{min}$).
* **Peak Maximum Normalization**: Rescales peak intensity to 1.0 ($Y / Y_{max}$).
* **Custom Range Normalization**: Rescales data to arbitrary intervals $[Y_{target\_min}, Y_{target\_max}]$.
* **Savitzky-Golay Filter**: Quadratic polynomial smoothing filter preserving peak widths and heights.
* **First Derivative**: Numerical rate of change ($dY / dX$) for inflection point discovery.

### 3. Plotting Scripts
Export loaded and transformed curves directly into standalone Python scripts for automated high-DPI rendering using Matplotlib, Seaborn, or Plotly.

---

## Contributing & Bug Reports

Contributions, suggestions, and pull requests are welcome. If you encounter any bugs or would like to propose new experimental file formats, please open an issue at:

**[https://github.com/RobbieGHunt/FDV/issues](https://github.com/RobbieGHunt/FDV/issues)**

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
