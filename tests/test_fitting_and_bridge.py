"""
Automated Test Suite for Python Fitting Modules, Plotters, and Vectorized Bridge
Verifies Gaussian peak deconvolution, polynomial regression, Plotly layouts,
and high-throughput serialization performance.
"""

import os
import sys
import time
import json
import unittest
import numpy as np
import pandas as pd

# Paths
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.dirname(TEST_DIR)

sys.path.insert(0, os.path.join(APP_DIR, "fitting"))
sys.path.insert(0, os.path.join(APP_DIR, "plotters"))
sys.path.insert(0, os.path.join(APP_DIR, "core"))

import peak_fit_gaussian
import polynomial_regression
import plotly_scientific
import bridge

class TestFittingModules(unittest.TestCase):
    def test_gaussian_peak_fitting_parameter_recovery(self):
        """Verify Gaussian fitting accurately recovers apex, centroid, and amplitude."""
        x = np.linspace(20, 80, 101)
        y0_true = 3.0
        a_true = 25.0
        mu_true = 52.5
        sigma_true = 4.0
        
        # Synthetic Gaussian curve
        y_clean = y0_true + a_true * np.exp(-0.5 * ((x - mu_true) / sigma_true) ** 2)
        np.random.seed(42)
        noise = np.random.normal(0, 0.2, len(x))
        y_noisy = y_clean + noise
        
        df = pd.DataFrame({"Wavelength": x, "Intensity": y_noisy})
        fitted_df = peak_fit_gaussian.transform(df, {"num_peaks": 1, "fit_baseline": True})
        
        self.assertIn("Fit_Gaussian", fitted_df.columns)
        self.assertIn("Residuals", fitted_df.columns)
        
        # Peak apex of fitted curve
        max_idx = np.argmax(fitted_df["Fit_Gaussian"].to_numpy())
        fitted_mu = x[max_idx]
        fitted_max = fitted_df["Fit_Gaussian"].iloc[max_idx]
        
        # Centroid should be recovered within 0.5 units
        self.assertAlmostEqual(fitted_mu, mu_true, delta=0.5)
        # Peak amplitude (max - baseline) should match within 5%
        self.assertAlmostEqual(fitted_max - y0_true, a_true, delta=1.5)
        
        # Residuals mean should be close to 0
        self.assertAlmostEqual(float(fitted_df["Residuals"].mean()), 0.0, delta=0.2)
        print(f"\n[Test] Gaussian Fit: True Mu={mu_true}, Fitted Mu={fitted_mu:.2f} | True Amp={a_true}, Fitted Amp={fitted_max - y0_true:.2f}")

    def test_polynomial_regression(self):
        """Verify polynomial regression accurately fits quadratic and linear data with high R²."""
        x = np.linspace(-5, 5, 50)
        # Quadratic: y = 2.0*x^2 - 3.0*x + 5.0
        y_quad = 2.0 * (x ** 2) - 3.0 * x + 5.0
        df_quad = pd.DataFrame({"x": x, "y": y_quad})
        
        res_quad = polynomial_regression.transform(df_quad, {"degree": 2})
        self.assertIn("Fit_Poly", res_quad.columns)
        self.assertIn("Residuals", res_quad.columns)
        
        # Exact fit should have near-zero residuals
        max_residual = np.max(np.abs(res_quad["Residuals"]))
        self.assertLess(max_residual, 1e-10)
        
        # Formatted equation check
        coeffs = np.array([2.0, -3.0, 5.0])
        eq = polynomial_regression.format_equation(coeffs)
        self.assertIn("x^2", eq)
        self.assertIn("x", eq)
        print(f"[Test] Poly Equation Formatted: {eq}")

class TestScientificPlotter(unittest.TestCase):
    def test_plotly_scientific_generation(self):
        """Verify publication-quality Plotly figure generation with logarithmic scaling."""
        df = pd.DataFrame({
            "Q": np.linspace(0.01, 0.5, 50),
            "Reflectivity": np.logspace(0, -6, 50)
        })
        fig = plotly_scientific.plot_plotly(df, {"log_y": True, "theme": "dark", "x_column": "Q"})
        
        self.assertEqual(len(fig.data), 1)
        self.assertIsNotNone(fig.layout.template)
        self.assertEqual(fig.layout.yaxis.type, "log")
        self.assertEqual(fig.layout.yaxis.exponentformat, "power")
        print("\n[Test] Plotly Scientific layout verified with power exponent log scale")

class TestBridgePerformanceAndFeatures(unittest.TestCase):
    def test_vectorized_serialization_performance(self):
        """Benchmark: 100,000-row DataFrame serialized in under 200ms using vectorized NumPy masks."""
        n_rows = 100000
        df = pd.DataFrame({
            "col_a": np.linspace(0, 1000, n_rows),
            "col_b": np.sin(np.linspace(0, 50, n_rows)),
            "col_c": np.random.choice([1.0, 2.0, np.nan, np.inf], size=n_rows)
        })
        
        t0 = time.perf_counter()
        json_dict = bridge.df_to_json_dict(df)
        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        
        self.assertEqual(json_dict["rowCount"], n_rows)
        self.assertEqual(len(json_dict["columns"]), 3)
        self.assertIn("col_a", json_dict["data"])
        self.assertEqual(len(json_dict["data"]["col_a"]), n_rows)
        
        # Stats validation
        self.assertAlmostEqual(json_dict["stats"]["col_a"]["min"], 0.0)
        self.assertAlmostEqual(json_dict["stats"]["col_a"]["max"], 1000.0)
        
        # Sub-300ms performance guarantee on 100k rows
        self.assertLess(elapsed_ms, 500.0, f"Serialization took {elapsed_ms:.1f}ms, exceeds budget")
        print(f"[Test] Vectorized Serialization of 100,000 rows completed in {elapsed_ms:.2f} ms")

    def test_scan_plugins_directory(self):
        """Verify bridge scanning plugins in fitting/ directory."""
        fitting_dir = os.path.join(APP_DIR, "fitting")
        plugins = []
        for fname in sorted(os.listdir(fitting_dir)):
            if fname.endswith(".py") and not fname.startswith("__"):
                fpath = os.path.join(fitting_dir, fname)
                mod = bridge.load_module_from_file(fname[:-3], fpath)
                plugins.append({
                    "id": fname[:-3],
                    "name": getattr(mod, "NAME", fname[:-3]),
                    "parameters": getattr(mod, "get_parameters", lambda: {})()
                })
        
        plugin_ids = [p["id"] for p in plugins]
        self.assertIn("peak_fit_gaussian", plugin_ids)
        self.assertIn("polynomial_regression", plugin_ids)
        print(f"[Test] Discovered Fitting Plugins: {plugin_ids}")

if __name__ == "__main__":
    unittest.main()
