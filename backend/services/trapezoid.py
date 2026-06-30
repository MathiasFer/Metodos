"""
Método 3 — Regla del Trapecio para dosis acumulada de PM2.5.

Dosis = ∫ C(t) dt  ≈  Σ (Δt/2)[C_i + C_{i+1}]
"""
import numpy as np
import pandas as pd
from config import OMS_PM25_LIMIT
from models.schemas import TrapezoidResult, MonthlyDose

# Compatibility with NumPy >=2.0
_trapz = getattr(np, "trapezoid", None) or getattr(np, "trapz", None)


def compute_trapezoid(df: pd.DataFrame, target_date: pd.Timestamp) -> TrapezoidResult:
    """Run the trapezoid rule for PM2.5 dose calculation."""
    n_hist = len(df)

    # Historical: monthly dose
    rows_h = []
    for (y, m), grp in df.groupby(["year", "month"]):
        d = float(_trapz(grp["pm2_5"].values, dx=1.0))
        rows_h.append(MonthlyDose(label=f"{y}-{str(m).zfill(2)}", dose=round(d, 1)))

    # Future projection
    last_d = df["date"].iloc[-1]
    n_fut = max(1, (target_date - last_d).days)
    fut_dates = pd.date_range(last_d + pd.Timedelta(days=1), periods=n_fut, freq="D")
    pm_mean = df.groupby("month")["pm2_5"].mean().to_dict()
    fut_pm25 = np.array([pm_mean[d.month] for d in fut_dates])

    fut_df = pd.DataFrame({"date": fut_dates, "pm2_5": fut_pm25})
    fut_df["year"] = fut_df["date"].dt.year
    fut_df["month"] = fut_df["date"].dt.month

    rows_f = []
    for (y, m), grp in fut_df.groupby(["year", "month"]):
        d = float(_trapz(grp["pm2_5"].values, dx=1.0))
        rows_f.append(MonthlyDose(label=f"{y}-{str(m).zfill(2)}", dose=round(d, 1)))

    total_hist = float(_trapz(df["pm2_5"].values, dx=1.0))
    total_fut = float(_trapz(fut_pm25, dx=1.0))

    return TrapezoidResult(
        monthly_hist=rows_h,
        monthly_fut=rows_f,
        total_hist=round(total_hist, 1),
        total_fut=round(total_fut, 1),
        oms_limit=OMS_PM25_LIMIT,
        days_over_hist=int((df["pm2_5"] > OMS_PM25_LIMIT).sum()),
        days_over_fut=int((fut_pm25 > OMS_PM25_LIMIT).sum()),
        n_historical=n_hist,
        n_future=n_fut,
    )
