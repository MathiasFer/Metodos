"""
Método 2 — Serie de Taylor 2° Orden para corrección de precisión.

C_{n+1} = C_n + Δt·f_n + (Δt²/2)·f'_n
"""
import numpy as np
import pandas as pd
from typing import Dict
from models.schemas import TaylorResult


def compute_taylor(df: pd.DataFrame, co_euler: list, k: float, s_monthly: Dict[int, float]) -> TaylorResult:
    """Run the Taylor 2nd order method using Euler results."""
    dt = 1.0
    co = df["carbon_monoxide"].values
    mons = df["month"].values
    C_e = np.array(co_euler[:len(df)])

    C_t = np.zeros(len(df))
    C_t[0] = co[0]

    for i in range(1, len(df)):
        S_n = s_monthly[mons[i - 1]]
        f_n = -k * C_t[i - 1] + S_n

        if i >= 2:
            S_prev = s_monthly[mons[i - 2]]
            S_next = s_monthly[mons[min(i, len(df) - 1)]]
            f_prev = -k * C_e[i - 2] + S_prev
            f_next = -k * C_e[i] + S_next
            d2C = (f_next - f_prev) / (2 * dt)
        else:
            d2C = 0.0

        C_t[i] = C_t[i - 1] + dt * f_n + (dt ** 2 / 2) * d2C

    def mae(a, b): return float(np.mean(np.abs(a - b)))
    def rmse(a, b): return float(np.sqrt(np.mean((a - b) ** 2)))
    def pct(a, b): return float(np.mean(np.abs((a - b) / (np.abs(b) + 1e-9))) * 100)

    dates = [str(d.date()) for d in df["date"]]

    return TaylorResult(
        dates=dates,
        co_euler=[float(v) for v in C_e],
        co_taylor=[float(v) for v in C_t],
        co_historical=[float(v) for v in co],
        mae_euler=round(mae(C_e, co), 2),
        mae_taylor=round(mae(C_t, co), 2),
        rmse_euler=round(rmse(C_e, co), 2),
        rmse_taylor=round(rmse(C_t, co), 2),
        pct_euler=round(pct(C_e, co), 2),
        pct_taylor=round(pct(C_t, co), 2),
    )
