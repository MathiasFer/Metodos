"""
Método 1 — Euler Explícito para predicción de CO.

Resuelve: dC/dt = −k·C + S(t)
"""
import numpy as np
import pandas as pd
from typing import Dict
from models.schemas import EulerResult


def compute_euler(df: pd.DataFrame, target_date: pd.Timestamp) -> EulerResult:
    """Run the Euler method and return results."""
    monthly_mean: Dict[int, float] = df.groupby("month")["carbon_monoxide"].mean().to_dict()
    co = df["carbon_monoxide"].values
    S_mean = float(np.mean(list(monthly_mean.values())))
    k = S_mean / float(co.mean())

    # Euler over historical period
    dt = 1.0
    C = np.zeros(len(df))
    C[0] = co[0]
    months = df["month"].values
    for i in range(1, len(df)):
        S_t = monthly_mean[months[i - 1]]
        C[i] = C[i - 1] + dt * (-k * C[i - 1] + S_t)

    mae = float(np.mean(np.abs(C - co)))

    # Extrapolation into the future
    C_ext = list(C)
    d_ext = list(df["date"])
    C_last = C[-1]
    cur_d = df["date"].iloc[-1]
    n_fut = max(0, (target_date - cur_d).days)

    for _ in range(n_fut):
        cur_d = cur_d + pd.Timedelta(days=1)
        S_t = monthly_mean[cur_d.month]
        C_last = C_last + dt * (-k * C_last + S_t)
        C_ext.append(C_last)
        d_ext.append(cur_d)

    # Find predicted value at target date
    euler_dates_s = pd.Series(d_ext)
    idx = (euler_dates_s <= target_date).sum() - 1
    co_pred = float(np.array(C_ext)[max(0, idx)])

    return EulerResult(
        dates=[str(d.date()) for d in d_ext],
        co_predicted=[float(v) for v in C_ext],
        co_historical=[float(v) for v in co],
        historical_dates=[str(d.date()) for d in df["date"]],
        mae=round(mae, 2),
        k=round(k, 4),
        s_monthly={str(m): round(v, 1) for m, v in monthly_mean.items()},
        co_pred_at_target=round(co_pred, 1),
        target_date=str(target_date.date()),
    )
