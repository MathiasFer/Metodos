"""
Método 4 — Integral Doble para masa de CO sobre el área urbana de Quito.

C(x,y) = C₀·exp(−α(x−x₀)²)·exp(−β(y−y₀)²)
M = ρ·H·∬ C(x,y) dx dy  [Trapecio Compuesto 2D]
"""
import numpy as np
import pandas as pd
from config import AIR_DENSITY, MIXING_HEIGHT, GRID_SIZE, LON_RANGE, LAT_RANGE
from models.schemas import DoubleIntegralResult

# Compatibility with NumPy >=2.0
_trapz = getattr(np, "trapezoid", None) or getattr(np, "trapz", None)


def compute_double_integral(
    df: pd.DataFrame,
    lon0: float,
    lat0: float,
    co_pred_at_target: float,
    target_date: str,
) -> DoubleIntegralResult:
    """Compute the double integral of CO concentration over Quito."""
    # C₀ at target date
    C0_ug = co_pred_at_target
    C0 = C0_ug * 1e-9  # µg/m³ → kg/m³

    # Dispersion from historical coordinates
    lons = df["longitud"].dropna().values
    lats = df["latitud"].dropna().values
    sl = float(lons.std()) or 0.05
    sb = float(lats.std()) or 0.05
    alpha = 1.0 / (2 * sl ** 2)
    beta = 1.0 / (2 * sb ** 2)

    # Grid 80×80 over Quito
    N = GRID_SIZE
    lon_arr = np.linspace(lon0 - LON_RANGE, lon0 + LON_RANGE, N)
    lat_arr = np.linspace(lat0 - LAT_RANGE, lat0 + LAT_RANGE, N)
    X, Y = np.meshgrid(lon_arr, lat_arr)

    Z = C0 * np.exp(-alpha * (X - lon0) ** 2) * np.exp(-beta * (Y - lat0) ** 2)

    # m/degree at Ecuador latitude
    dlon_m = (lon_arr[1] - lon_arr[0]) * 111_320 * np.cos(np.radians(lat0))
    dlat_m = (lat_arr[1] - lat_arr[0]) * 110_540

    rows_int = [_trapz(Z[j, :], dx=dlon_m) for j in range(N)]
    integral = float(_trapz(rows_int, dx=dlat_m))
    mass_kg = AIR_DENSITY * MIXING_HEIGHT * integral

    # Downsample heatmap to 40x40 for frontend performance
    step = 2
    Z_downsampled = Z[::step, ::step].tolist()

    return DoubleIntegralResult(
        heatmap=Z_downsampled,
        lon_range=[float(lon0 - LON_RANGE), float(lon0 + LON_RANGE)],
        lat_range=[float(lat0 - LAT_RANGE), float(lat0 + LAT_RANGE)],
        mass_kg=round(mass_kg, 2),
        mass_ton=round(mass_kg / 1000.0, 4),
        c0_ug=round(C0_ug, 1),
        lon0=float(lon0),
        lat0=float(lat0),
        target_date=target_date,
    )
