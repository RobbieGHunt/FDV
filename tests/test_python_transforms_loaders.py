"""
Automated Test Suite for FDV Custom Python Transforms, Loaders, and Templates
Tests mathematical accuracy, boundary condition resilience, and loader parsing.
"""

import os
import sys
import unittest
import numpy as np
import pandas as pd

# Paths
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.dirname(TEST_DIR)
ROOT_DIR = os.path.dirname(APP_DIR)
DATA_DIR = os.path.join(ROOT_DIR, "data")

# Add FDV-App directories to sys.path
sys.path.insert(0, os.path.join(APP_DIR, "transforms"))
sys.path.insert(0, os.path.join(APP_DIR, "loaders"))

import savgol_smooth
import universal_delimited
import oceanoptics_spectra
import xrr_reflectivity

class TestSavitzkyGolay(unittest.TestCase):
    def test_peak_preservation_vs_moving_average(self):
        """Verify that Savitzky-Golay preserves Gaussian peak height much better than moving average."""
        x = np.linspace(-3, 3, 51)
        peak_height = 10.0
        sigma = 0.5
        y = peak_height * np.exp(-0.5 * (x / sigma) ** 2)
        
        df = pd.DataFrame({"x": x, "y": y})
        
        # 1. Authentic Savitzky-Golay (window=9, polyorder=2)
        sg_df = savgol_smooth.transform(df, {"window_length": 9, "polyorder": 2})
        sg_peak = sg_df["y"].max()
        
        # 2. Moving average (window=9)
        ma_y = df["y"].rolling(window=9, center=True).mean()
        ma_peak = ma_y.max()
        
        # Savitzky-Golay should preserve > 90% of peak height
        sg_retention = sg_peak / peak_height
        ma_retention = ma_peak / peak_height
        
        self.assertGreater(sg_retention, 0.90, f"Savitzky-Golay retention too low: {sg_retention:.3f}")
        self.assertGreater(sg_retention, ma_retention, "Savitzky-Golay should preserve peak height better than moving average")
        print(f"\n[Test] Peak Retention -> Savitzky-Golay: {sg_retention*100:.1f}%, Boxcar Moving Avg: {ma_retention*100:.1f}%")

    def test_pure_numpy_fallback_matches_scipy(self):
        """Verify that the pure NumPy Vandermonde convolution matches SciPy savgol_filter."""
        try:
            from scipy.signal import savgol_filter
        except ImportError:
            self.skipTest("SciPy not installed in current environment.")

        y = np.array([0.5, 1.2, 4.8, 9.7, 4.9, 1.1, 0.6, 0.5, 1.0, 1.5], dtype=float)
        scipy_out = savgol_filter(y, window_length=5, polyorder=2, mode='mirror')
        numpy_out = savgol_smooth._savgol_fallback(y, window_length=5, polyorder=2)
        
        np.testing.assert_allclose(scipy_out, numpy_out, atol=1e-12,
                                   err_msg="Pure NumPy fallback diverges from SciPy savgol_filter")

    def test_boundary_and_null_handling(self):
        """Verify that savgol_smooth gracefully handles datasets smaller than window and nulls."""
        # Dataset smaller than window
        short_df = pd.DataFrame({"x": [1, 2], "y": [5.0, 6.0]})
        result = savgol_smooth.transform(short_df, {"window_length": 7})
        self.assertEqual(len(result), 2)
        self.assertEqual(result["y"].iloc[0], 5.0)

        # Dataset with missing / NaN values
        nan_df = pd.DataFrame({"x": range(10), "y": [1.0, 2.0, np.nan, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0]})
        result_nan = savgol_smooth.transform(nan_df, {"window_length": 5, "polyorder": 2})
        self.assertTrue(pd.isna(result_nan["y"].iloc[2]))
        self.assertFalse(pd.isna(result_nan["y"].iloc[0]))

class TestLoaders(unittest.TestCase):
    def test_universal_delimited_sniffs_with_metadata_headers(self):
        """Verify CSV sniffer correctly identifies delimiter even when metadata contains commas/colons."""
        import tempfile
        content = (
            "# Instrument: OceanOptics HR4000, Serial: 12345, Date: 2026-09-12\n"
            "# Mode: Transmission, Integration: 100ms, Scans: 5\n"
            "Wavelength\tIntensity\n"
            "400.0\t10.5\n"
            "401.0\t12.3\n"
            "402.0\t15.8\n"
        )
        with tempfile.NamedTemporaryFile("w", delete=False, suffix=".txt") as tf:
            tf.write(content)
            tf_path = tf.name

        try:
            df = universal_delimited.load_data(tf_path, {"delimiter": "auto", "skip_rows": 2, "comment_char": "#"})
            self.assertEqual(df.shape[0], 3)
            self.assertIn("Wavelength", df.columns)
            self.assertIn("Intensity", df.columns)
            self.assertEqual(float(df["Wavelength"].iloc[0]), 400.0)
        finally:
            if os.path.exists(tf_path):
                os.remove(tf_path)

    def test_oceanoptics_loader_bounds_check(self):
        """Verify OceanOptics loader raises clean ValueError when column index is out of range."""
        import tempfile
        single_col = "500.0\n501.0\n502.0\n"
        with tempfile.NamedTemporaryFile("w", delete=False, suffix=".txt") as tf:
            tf.write(single_col)
            tf_path = tf.name

        try:
            with self.assertRaises(ValueError) as ctx:
                oceanoptics_spectra.load_data(tf_path, {"skip_rows": 0, "x_col_idx": 0, "y_col_idx": 1})
            self.assertIn("out of range", str(ctx.exception).lower())
        finally:
            if os.path.exists(tf_path):
                os.remove(tf_path)

    def test_oceanoptics_loads_sample_spectra(self):
        """Verify loading benchmark sample_spectra.txt."""
        spectra_path = os.path.join(DATA_DIR, "sample_spectra.txt")
        if not os.path.exists(spectra_path):
            self.skipTest("sample_spectra.txt not found")
        df = oceanoptics_spectra.load_data(spectra_path, {
            "delimiter": "\t",
            "skip_rows": 10,
            "x_col_idx": 0,
            "y_col_idx": 1
        })
        self.assertFalse(df.empty)
        self.assertEqual(df.columns[0], "Wavelength (nm)")
        self.assertEqual(df.columns[1], "Intensity")
        self.assertEqual(df["Wavelength (nm)"].iloc[0], 400.0)

    def test_xrr_reflectivity_math_and_validation(self):
        """Verify XRR loader enforces positive wavelength and computes accurate Q."""
        xrr_path = os.path.join(DATA_DIR, "sample_XRR.xy")
        if not os.path.exists(xrr_path):
            self.skipTest("sample_XRR.xy not found")
            
        # Wavelength <= 0 must fail
        with self.assertRaises(ValueError):
            xrr_reflectivity.load_data(xrr_path, {"wavelength": 0.0})
        with self.assertRaises(ValueError):
            xrr_reflectivity.load_data(xrr_path, {"wavelength": -1.54})

        # Valid load
        wavelength = 1.5406
        df = xrr_reflectivity.load_data(xrr_path, {"wavelength": wavelength, "skip_rows": 0})
        self.assertIn("Q (1/Å)", df.columns)
        
        # Test first point Q calculation
        # TwoTheta = df["TwoTheta (deg)"][0]
        # Q = 4 * pi / wavelength * sin(TwoTheta / 2 * pi / 180)
        two_theta_0 = df["TwoTheta (deg)"].iloc[0]
        expected_q_0 = (4.0 * np.pi / wavelength) * np.sin(np.radians(two_theta_0 / 2.0))
        self.assertAlmostEqual(df["Q (1/Å)"].iloc[0], expected_q_0, places=6)

class TestDerivativeMath(unittest.TestCase):
    def test_numerical_derivative_with_unsorted_and_duplicate_x(self):
        """Verify numerical derivative algorithm handles unsorted X and duplicate points without crashing."""
        # Unsorted X with a duplicate X value
        x = np.array([2.0, 1.0, 1.0, 3.0, 4.0])
        y = np.array([4.0, 1.0, 1.0, 9.0, 16.0]) # y = x^2 approx
        
        # Implementation as defined in updated templates.ts
        numeric_cols = ["x", "y"]
        df = pd.DataFrame({"x": x, "y": y, "label": ["a", "b", "c", "d", "e"]})
        
        # Mimic templates.ts manipulate
        result = df.copy()
        x_col = "x"
        sorted_df = result.sort_values(by=x_col)
        x_vals = sorted_df[x_col].to_numpy(dtype=float)
        dx = np.diff(x_vals)
        if np.any(dx == 0):
            x_vals = x_vals + np.arange(len(x_vals)) * 1e-12

        y_vals = sorted_df["y"].to_numpy(dtype=float)
        valid = np.isfinite(x_vals) & np.isfinite(y_vals)
        self.assertTrue(np.sum(valid) >= 2)
        
        grad = np.gradient(y_vals[valid], x_vals[valid])
        self.assertEqual(len(grad), len(x))
        self.assertFalse(np.any(np.isinf(grad)))
        self.assertFalse(np.any(np.isnan(grad)))

if __name__ == "__main__":
    unittest.main()
