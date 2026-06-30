"""
Plots API router — endpoints for generating matplotlib plot images.
"""
import pandas as pd
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from models.schemas import SimulationRequest
from services.data_loader import load_data
from services.euler import compute_euler
from services.taylor import compute_taylor
from services.trapezoid import compute_trapezoid
from services.double_integral import compute_double_integral
from services.plots import plot_euler, plot_taylor, plot_trapecio, plot_double_integral

router = APIRouter(prefix="/api/plots", tags=["plots"])

# ─── Cache data at startup ──────────────────────────────────────────────────
_cached_df: pd.DataFrame | None = None
_cached_city = None


def _ensure_loaded():
    global _cached_df, _cached_city
    if _cached_df is None:
        _cached_df, _cached_city = load_data()
    return _cached_df, _cached_city


@router.post("/euler")
def get_euler_plot(req: SimulationRequest):
    """Generate Euler method plot as PNG."""
    import traceback
    df, city = _ensure_loaded()
    try:
        target_date = pd.Timestamp(req.target_date)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    if target_date <= df["date"].max():
        raise HTTPException(status_code=400, detail=f"Target date must be after {df['date'].max().date()}.")

    euler = compute_euler(df, target_date)

    try:
        png_bytes = plot_euler(
            dates=euler.dates,
            co_predicted=euler.co_predicted,
            co_historical=euler.co_historical,
            historical_dates=euler.historical_dates,
            target_date=euler.target_date,
            k=euler.k,
            mae=euler.mae,
            s_monthly=euler.s_monthly,
        )
    except Exception as e:
        tb = traceback.format_exc()
        print(f"PLOT ERROR: {e}\n{tb}")
        raise HTTPException(status_code=500, detail=str(e))
    return Response(content=png_bytes, media_type="image/png")


@router.post("/taylor")
def get_taylor_plot(req: SimulationRequest):
    """Generate Taylor method plot as PNG."""
    df, city = _ensure_loaded()
    try:
        target_date = pd.Timestamp(req.target_date)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    if target_date <= df["date"].max():
        raise HTTPException(status_code=400, detail=f"Target date must be after {df['date'].max().date()}.")

    euler = compute_euler(df, target_date)
    s_monthly_int = {int(k): v for k, v in euler.s_monthly.items()}
    taylor = compute_taylor(df, euler.co_predicted, euler.k, s_monthly_int)

    png_bytes = plot_taylor(
        dates=taylor.dates,
        co_euler=taylor.co_euler,
        co_taylor=taylor.co_taylor,
        co_historical=taylor.co_historical,
        mae_euler=taylor.mae_euler,
        mae_taylor=taylor.mae_taylor,
        rmse_euler=taylor.rmse_euler,
        rmse_taylor=taylor.rmse_taylor,
        pct_euler=taylor.pct_euler,
        pct_taylor=taylor.pct_taylor,
    )
    return Response(content=png_bytes, media_type="image/png")


@router.post("/trapezoid")
def get_trapezoid_plot(req: SimulationRequest):
    """Generate trapezoid method plot as PNG."""
    df, city = _ensure_loaded()
    try:
        target_date = pd.Timestamp(req.target_date)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    if target_date <= df["date"].max():
        raise HTTPException(status_code=400, detail=f"Target date must be after {df['date'].max().date()}.")

    trap = compute_trapezoid(df, target_date)

    monthly_hist_labels = [d.label for d in trap.monthly_hist]
    monthly_hist_doses = [d.dose for d in trap.monthly_hist]

    png_bytes = plot_trapecio(
        monthly_hist_labels=monthly_hist_labels,
        monthly_hist_doses=monthly_hist_doses,
        total_hist=trap.total_hist,
        days_over_hist=trap.days_over_hist,
        oms_limit=trap.oms_limit,
        df_dates=df["date"].tolist(),
        df_pm25=df["pm2_5"].tolist(),
    )
    return Response(content=png_bytes, media_type="image/png")


@router.post("/double")
def get_double_integral_plot(req: SimulationRequest):
    """Generate double integral plot as PNG."""
    df, city = _ensure_loaded()
    try:
        target_date = pd.Timestamp(req.target_date)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    if target_date <= df["date"].max():
        raise HTTPException(status_code=400, detail=f"Target date must be after {df['date'].max().date()}.")

    euler = compute_euler(df, target_date)
    di = compute_double_integral(
        df, city.longitude, city.latitude,
        euler.co_pred_at_target, euler.target_date,
    )

    png_bytes = plot_double_integral(
        heatmap=di.heatmap,
        lon_range=di.lon_range,
        lat_range=di.lat_range,
        mass_kg=di.mass_kg,
        mass_ton=di.mass_ton,
        c0_ug=di.c0_ug,
        lon0=di.lon0,
        lat0=di.lat0,
        target_date=di.target_date,
    )
    return Response(content=png_bytes, media_type="image/png")
